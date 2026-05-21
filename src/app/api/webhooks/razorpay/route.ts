import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fromRazorpayTimestamp } from "@/lib/razorpay";

type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    subscription?: {
      entity?: {
        id: string;
        status: string;
        plan_id?: string;
        customer_id?: string;
        current_start?: number;
        current_end?: number;
        ended_at?: number;
        notes?: Record<string, string>;
      };
    };
    payment?: {
      entity?: {
        id: string;
        status: string;
        notes?: Record<string, string>;
        subscription_id?: string;
      };
    };
  };
  created_at?: number;
};

function verifySignature(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("Razorpay webhook secret is not configured");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

function normalizeSubscriptionStatus(event: string, status: string) {
  if (event === "subscription.charged") return "active";
  if (event === "payment.failed") return "past_due";
  return status;
}

async function upsertSubscription(payload: RazorpayWebhookPayload) {
  const event = payload.event;
  const subscription = payload.payload?.subscription?.entity;
  const payment = payload.payload?.payment?.entity;
  const razorpaySubscriptionId = subscription?.id ?? payment?.subscription_id;

  if (!razorpaySubscriptionId) return;

  const userId = subscription?.notes?.userId ?? payment?.notes?.userId;
  const status = normalizeSubscriptionStatus(event, subscription?.status ?? "active");

  const existing = await prisma.subscription.findFirst({
    where: { razorpaySubscriptionId },
  });

  if (!existing && !userId) return;

  const data = {
    plan: "pro",
    status,
    provider: "razorpay",
    razorpaySubscriptionId,
    razorpayPlanId: subscription?.plan_id,
    razorpayCustomerId: subscription?.customer_id,
    currentPeriodStart: fromRazorpayTimestamp(subscription?.current_start),
    currentPeriodEnd: fromRazorpayTimestamp(subscription?.current_end),
    cancelledAt:
      event === "subscription.cancelled" || event === "subscription.completed"
        ? fromRazorpayTimestamp(subscription?.ended_at) ?? new Date()
        : null,
  };

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data,
    });
    return;
  }

  await prisma.subscription.create({
    data: {
      ...data,
      userId: userId as string,
    },
  });
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-razorpay-signature");
  const body = await req.text();

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  try {
    if (!verifySignature(body, signature)) {
      return new Response("Invalid signature", { status: 400 });
    }

    const payload = JSON.parse(body) as RazorpayWebhookPayload;
    const entityId =
      payload.payload?.subscription?.entity?.id ??
      payload.payload?.payment?.entity?.id ??
      `${payload.created_at ?? Date.now()}`;
    const eventId = `razorpay:${payload.event}:${entityId}`;

    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    if (existing) {
      return Response.json({ success: true, duplicate: true });
    }

    await upsertSubscription(payload);

    await prisma.webhookEvent.create({
      data: {
        provider: "razorpay",
        eventId,
        eventType: payload.event,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Razorpay webhook failed";
    return new Response(message, { status: 400 });
  }
}
