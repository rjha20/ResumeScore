import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getStripeClient, getPriceId } from "@/lib/stripe";

type BillingCycle = "monthly" | "yearly";
type BillingPlan = "pro" | "team";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = (await req.json().catch(() => ({}))) as {
      cycle?: BillingCycle;
      plan?: BillingPlan;
    };
    const cycle = body.cycle === "yearly" ? "yearly" : "monthly";
    const plan = body.plan === "team" ? "team" : "pro";
    const priceKey = `${plan}_${cycle}` as const;
    const priceId = getPriceId(priceKey);

    const stripe = getStripeClient();
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { userId: user.id, cycle, plan },
      subscription_data: {
        metadata: { userId: user.id, cycle, plan },
      },
    });

    return Response.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";
    return Response.json({ success: false, error: message }, { status: 400 });
  }
}
