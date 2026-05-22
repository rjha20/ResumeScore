import { NextRequest } from "next/server";
import Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

interface StripeSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: { data: { price: { id: string } }[] };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("STRIPE_WEBHOOK_SECRET is not configured", { status: 500 });
    }

    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const eventId = `stripe:${event.id}`;
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    if (existing) {
      return Response.json({ success: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as StripeSubscription;
        const plan = session.metadata?.plan ?? "pro";

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan,
            status: sub.status,
            provider: "stripe",
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id,
            stripeCustomerId: session.customer as string,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          create: {
            user: { connect: { id: userId } },
            plan,
            status: sub.status,
            provider: "stripe",
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id,
            stripeCustomerId: session.customer as string,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as unknown as StripeSubscription;
        const sid = sub.id;

        const existingSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sid },
        });
        if (!existingSub) break;

        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            stripePriceId: sub.items.data[0]?.price.id,
            cancelledAt:
              event.type === "customer.subscription.deleted" ? new Date() : undefined,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription: string };
        const sid2 = invoice.subscription;

        if (!sid2) break;

        const invSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sid2 },
        });
        if (invSub) {
          await prisma.subscription.update({
            where: { id: invSub.id },
            data: { status: "past_due" },
          });
        }
        break;
      }
    }

    await prisma.webhookEvent.create({
      data: {
        provider: "stripe",
        eventId,
        eventType: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe webhook failed";
    return new Response(message, { status: 400 });
  }
}
