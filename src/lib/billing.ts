import { prisma } from "@/lib/prisma";

export type BillingPlan = "free" | "pro" | "team" | "enterprise";
export type UsageKind = "resume_upload" | "ai_generation";

export interface PlanLimits {
  resumeUploads: number;
  aiGenerations: number;
}

export interface BillingSummary {
  plan: BillingPlan;
  status: string;
  limits: PlanLimits;
  usage: PlanLimits;
  remaining: PlanLimits;
  currentPeriodEnd: string;
}

export const PLAN_LIMITS: Record<BillingPlan, PlanLimits> = {
  free: {
    resumeUploads: 3,
    aiGenerations: 3,
  },
  pro: {
    resumeUploads: 50,
    aiGenerations: 100,
  },
  team: {
    resumeUploads: 200,
    aiGenerations: 500,
  },
  enterprise: {
    resumeUploads: 1000,
    aiGenerations: 5000,
  },
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "complete",
]);

function normalizePlan(plan: string | null | undefined): BillingPlan {
  if (plan === "pro" || plan === "team" || plan === "enterprise") return plan;
  return "free";
}

function getCurrentMonthlyPeriod(now = new Date()) {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { periodStart, periodEnd };
}

function toLimitKey(kind: UsageKind): keyof PlanLimits {
  return kind === "resume_upload" ? "resumeUploads" : "aiGenerations";
}

export async function getUserPlan(userId: string): Promise<BillingPlan> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  if (!subscription) return "free";
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) return "free";

  return normalizePlan(subscription.plan);
}

export async function getBillingSummary(userId: string): Promise<BillingSummary> {
  const { periodStart, periodEnd } = getCurrentMonthlyPeriod();
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  const plan =
    subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
      ? normalizePlan(subscription.plan)
      : "free";
  const usageRecords = await prisma.usageRecord.findMany({
    where: {
      userId,
      periodStart,
    },
  });

  const usage = {
    resumeUploads:
      usageRecords.find((record) => record.kind === "resume_upload")?.count ?? 0,
    aiGenerations:
      usageRecords.find((record) => record.kind === "ai_generation")?.count ?? 0,
  };
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    status: subscription?.status ?? "free",
    limits,
    usage,
    remaining: {
      resumeUploads: Math.max(0, limits.resumeUploads - usage.resumeUploads),
      aiGenerations: Math.max(0, limits.aiGenerations - usage.aiGenerations),
    },
    currentPeriodEnd: periodEnd.toISOString(),
  };
}

export async function assertUsageAvailable(userId: string, kind: UsageKind) {
  const summary = await getBillingSummary(userId);
  const key = toLimitKey(kind);

  if (summary.usage[key] >= summary.limits[key]) {
    const label =
      kind === "resume_upload" ? "resume upload" : "AI generation";
    return {
      allowed: false,
      error: `You have reached your monthly ${label} limit for the ${summary.plan} plan. Upgrade to Pro to continue.`,
      summary,
    };
  }

  return { allowed: true, summary };
}

export async function recordUsage(userId: string, kind: UsageKind, amount = 1) {
  const { periodStart, periodEnd } = getCurrentMonthlyPeriod();

  await prisma.usageRecord.upsert({
    where: {
      userId_kind_periodStart: {
        userId,
        kind,
        periodStart,
      },
    },
    update: {
      count: { increment: amount },
      periodEnd,
    },
    create: {
      userId,
      kind,
      count: amount,
      periodStart,
      periodEnd,
    },
  });
}
