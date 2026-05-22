"use client";

import { useState } from "react";
import type React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type BillingCycle = "monthly" | "yearly";

export function CheckoutButton({
  cycle,
  plan = "pro",
  children,
  className,
  variant = "default",
}: {
  cycle: BillingCycle;
  plan?: "pro" | "team";
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle, plan }),
      });
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error ?? "Failed to start checkout");
      }

      window.location.href = json.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        variant={variant}
        className={className}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
