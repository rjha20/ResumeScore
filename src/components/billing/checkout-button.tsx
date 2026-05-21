"use client";

import { useState } from "react";
import type React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type BillingCycle = "monthly" | "yearly";

type RazorpayCheckoutOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutButton({
  cycle,
  children,
  className,
  variant = "default",
}: {
  cycle: BillingCycle;
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
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load Razorpay checkout. Please try again.");
      }

      const response = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error ?? "Failed to start checkout");
      }

      const checkout = new window.Razorpay!({
        key: json.data.keyId,
        subscription_id: json.data.subscriptionId,
        name: json.data.name,
        description: json.data.description,
        prefill: json.data.prefill,
        theme: { color: "#3b82f6" },
        handler: () => {
          window.location.href = "/dashboard";
        },
      });

      checkout.open();
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
