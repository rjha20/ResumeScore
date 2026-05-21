type RazorpaySubscriptionRequest = {
  plan_id: string;
  total_count: number;
  quantity: number;
  customer_notify: 0 | 1;
  notes?: Record<string, string>;
};

export type RazorpaySubscription = {
  id: string;
  entity: "subscription";
  plan_id: string;
  status: string;
  current_start?: number;
  current_end?: number;
  charge_at?: number;
  customer_id?: string;
  short_url?: string;
  notes?: Record<string, string>;
};

function getRazorpayAuthHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function razorpayRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json?.error?.description ?? json?.error?.reason ?? "Razorpay request failed";
    throw new Error(message);
  }

  return json as T;
}

export function getRazorpayPlanId(plan: "pro_monthly" | "pro_yearly") {
  const envKey =
    plan === "pro_monthly"
      ? "RAZORPAY_PRO_MONTHLY_PLAN_ID"
      : "RAZORPAY_PRO_YEARLY_PLAN_ID";
  const planId = process.env[envKey];

  if (!planId) {
    throw new Error(`${envKey} is not configured`);
  }

  return planId;
}

export async function createRazorpaySubscription({
  planId,
  userId,
  email,
}: {
  planId: string;
  userId: string;
  email: string;
}) {
  return razorpayRequest<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId,
        email,
      },
    } satisfies RazorpaySubscriptionRequest),
  });
}

export function fromRazorpayTimestamp(timestamp?: number | null) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000);
}
