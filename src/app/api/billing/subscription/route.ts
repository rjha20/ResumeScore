import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createRazorpaySubscription,
  fromRazorpayTimestamp,
  getRazorpayPlanId,
} from "@/lib/razorpay";

type BillingCycle = "monthly" | "yearly";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = (await req.json().catch(() => ({}))) as {
      cycle?: BillingCycle;
    };
    const cycle = body.cycle === "yearly" ? "yearly" : "monthly";
    const planId = getRazorpayPlanId(
      cycle === "yearly" ? "pro_yearly" : "pro_monthly",
    );

    const subscription = await createRazorpaySubscription({
      planId,
      userId: user.id,
      email: user.email,
    });

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: "pro",
        status: subscription.status,
        provider: "razorpay",
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId: subscription.plan_id,
        razorpayCustomerId: subscription.customer_id ?? null,
        currentPeriodStart: fromRazorpayTimestamp(subscription.current_start),
        currentPeriodEnd: fromRazorpayTimestamp(subscription.current_end),
      },
      create: {
        userId: user.id,
        plan: "pro",
        status: subscription.status,
        provider: "razorpay",
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId: subscription.plan_id,
        razorpayCustomerId: subscription.customer_id ?? null,
        currentPeriodStart: fromRazorpayTimestamp(subscription.current_start),
        currentPeriodEnd: fromRazorpayTimestamp(subscription.current_end),
      },
    });

    return Response.json({
      success: true,
      data: {
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url ?? null,
        name: "ResumeScore Pro",
        description:
          cycle === "yearly" ? "Pro yearly subscription" : "Pro monthly subscription",
        prefill: {
          name: user.name ?? "",
          email: user.email,
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create subscription";
    return Response.json({ success: false, error: message }, { status: 400 });
  }
}
