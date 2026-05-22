"use server";

import Stripe from "stripe";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function verifyCheckoutSession(sessionId: string) {
  try {
    const user = await requireAuth();
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.userId !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    if (session.status !== "complete") {
      return { success: true as const, data: { status: "incomplete" } };
    }

    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      return { success: true as const, data: { status: "no_subscription" } };
    }

    const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
      id: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      cancel_at_period_end: boolean;
      items: { data: { price: { id: string } }[] };
    };

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: session.metadata?.plan ?? "pro",
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
        user: { connect: { id: user.id } },
        plan: session.metadata?.plan ?? "pro",
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

    return { success: true as const, data: { status: "subscribed" } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Verification failed";
    return { success: false as const, error: message };
  }
}
