"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Free", price: "₹0", period: "forever",
    description: "Perfect for getting started",
    features: ["3 analyses per month", "Basic ATS score", "AI feedback summary", "Keyword matching"],
    cta: "Get started", popular: false,
  },
  {
    name: "Pro", price: "₹499", period: "month",
    description: "For serious applicants",
    features: ["Unlimited analyses", "Full ATS breakdown", "Complete AI feedback", "Bullet point rewrites", "Skill gap analysis", "Career recommendations"],
    cta: "Upgrade monthly", popular: true,
  },
  {
    name: "Team", price: "₹999", period: "month",
    description: "For professional teams",
    features: ["Everything in Pro", "Up to 5 team members", "Shared workspace", "Bulk analysis", "Priority support", "Custom branding"],
    cta: "Start team monthly", popular: false,
  },
  {
    name: "Enterprise", price: "Custom", period: "",
    description: "For large organizations",
    features: ["Everything in Team", "Unlimited members", "API access", "Dedicated account manager", "SSO / SAML", "Custom integrations"],
    cta: "Contact sales", popular: false,
  },
];

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const analysisHref = isSignedIn
    ? "/dashboard/resume-new"
    : "/sign-up?redirect_url=%2Fdashboard%2Fresume-new";

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight">Simple, transparent pricing</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No hidden fees. Upgrade or cancel anytime.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular ? "border-primary/30" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                  Most popular
                </div>
              )}
              <CardContent className="p-5 flex flex-col h-full">
                <div>
                  <h3 className="text-sm font-semibold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-0.5">
                    <span className="text-2xl font-semibold tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-xs text-muted-foreground">/{plan.period}</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="mt-5 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.name === "Pro" || plan.name === "Team" ? (
                  <div className="mt-5 space-y-2">
                    <CheckoutButton
                      cycle="monthly"
                      plan={plan.name.toLowerCase() as "pro" | "team"}
                      className="w-full"
                    >
                      {plan.cta}
                    </CheckoutButton>
                    <CheckoutButton
                      cycle="yearly"
                      plan={plan.name.toLowerCase() as "pro" | "team"}
                      className="w-full"
                      variant="outline"
                    >
                      {plan.name === "Pro" ? "Yearly · ₹4,999" : "Yearly · ₹9,999"}
                    </CheckoutButton>
                  </div>
                ) : (
                  <Button
                    asChild
                    className="mt-5 w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    <Link href={plan.name === "Enterprise" ? "/contact" : analysisHref}>
                      {plan.cta}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
