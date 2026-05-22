import Stripe from "stripe";

export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

type PricePlan = "pro_monthly" | "pro_yearly" | "team_monthly" | "team_yearly";

const PRICE_ENV_MAP: Record<PricePlan, string> = {
  pro_monthly: "STRIPE_PRO_MONTHLY_PRICE_ID",
  pro_yearly: "STRIPE_PRO_YEARLY_PRICE_ID",
  team_monthly: "STRIPE_TEAM_MONTHLY_PRICE_ID",
  team_yearly: "STRIPE_TEAM_YEARLY_PRICE_ID",
};

export function getPriceId(plan: PricePlan) {
  const envKey = PRICE_ENV_MAP[plan];
  const id = process.env[envKey];
  if (!id) throw new Error(`${envKey} is not configured`);
  return id;
}
