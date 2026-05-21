"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Brain, FileCheck, Target, TrendingUp, Zap, BarChart3, Sparkles } from "lucide-react";

const features = [
  {
    icon: Brain, title: "AI Resume Analysis",
    description: "Deep content analysis with context-aware matching against job descriptions. Identifies strengths and areas for improvement.",
  },
  {
    icon: Target, title: "ATS Score & Optimization",
    description: "Precise ATS compatibility scoring with keyword gap analysis and format optimization recommendations.",
  },
  {
    icon: TrendingUp, title: "Skill Gap Detection",
    description: "Market demand analysis with personalized learning paths and certification recommendations.",
  },
  {
    icon: FileCheck, title: "Smart Resume Parsing",
    description: "Automatic extraction and structuring of resume data from PDF and DOCX files with contact detection.",
  },
  {
    icon: Zap, title: "Bullet Point Rewriting",
    description: "AI-powered rewrites that make bullet points more impactful with action verbs and quantified results.",
  },
  {
    icon: BarChart3, title: "Career Insights",
    description: "Industry benchmarking with role-specific feedback and growth recommendations.",
  },
];

export default function FeaturesPage() {
  const { isSignedIn } = useAuth();
  const analysisHref = isSignedIn
    ? "/dashboard/resume-new"
    : "/sign-up?redirect_url=%2Fdashboard%2Fresume-new";

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-5">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight">Powerful features</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to optimize your resume and land more interviews.
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-5">
                <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center mb-3">
                  <f.icon className="w-4 h-4 text-foreground" />
                </div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12">
          <Button asChild>
            <Link href={analysisHref}>
              Start free analysis
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
