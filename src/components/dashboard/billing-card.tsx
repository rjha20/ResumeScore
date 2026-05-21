"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Loader2 } from "lucide-react";

import { getCurrentBillingSummary } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BillingSummary } from "@/lib/billing";

export function BillingCard() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBilling() {
      const result = await getCurrentBillingSummary();
      if (result.success) {
        setSummary(result.data);
      }
      setLoading(false);
    }

    loadBilling();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading plan usage...
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold capitalize">{summary.plan} plan</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.usage.resumeUploads}/{summary.limits.resumeUploads} uploads
            used · {summary.usage.aiGenerations}/{summary.limits.aiGenerations} AI
            generations used this month
          </p>
        </div>
        {summary.plan === "free" && (
          <Button asChild size="sm" variant="premium">
            <Link href="/pricing">Upgrade</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
