"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Upload, TrendingUp, Sparkles,
  Brain, AlertCircle
} from "lucide-react";

import { getDashboardStats, getAtsTrend } from "@/actions/get-dashboard-stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { AtsChart } from "@/components/dashboard/ats-chart";
import { ResumeHistory } from "@/components/dashboard/resume-history";
import { BillingCard } from "@/components/dashboard/billing-card";
import type { DashboardStats, AnalysisSummary } from "@/types";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<{ date: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsResult, trendResult] = await Promise.all([
          getDashboardStats(),
          getAtsTrend(),
        ]);

        if (statsResult.success) {
          setStats(statsResult.data);
        } else {
          setError(statsResult.error);
        }

        if (trendResult.success) {
          setTrendData(trendResult.data);
        }
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      loadDashboard();
    }
  }, [isLoaded]);

  const hasData = stats && (stats.totalResumes > 0 || stats.totalAnalyses > 0);
  const recentAnalyses: AnalysisSummary[] = stats?.recentAnalyses ?? [];

  if (!isLoaded || loading) {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 animate-pulse">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="grid md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-72 bg-muted rounded-xl" />
              <div className="h-72 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
            </h1>
            <p className="text-muted-foreground">Here&apos;s your resume analysis overview</p>
          </div>
          <Button asChild variant="premium">
            <Link href="/dashboard/resume-new">
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Link>
          </Button>
        </motion.div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="mb-6">
          <BillingCard />
        </div>

        <StatsCards
          stats={stats ?? {
            totalResumes: 0,
            totalAnalyses: 0,
            averageAtsScore: 0,
            averageAiRating: 0,
            recentAnalyses: [],
            scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
          }}
          loading={loading}
        />

        {hasData ? (
          <>
            {/* Charts & Analytics */}
            <div className="mt-8">
              <AtsChart
                trendData={trendData}
                distribution={stats?.scoreDistribution ?? { excellent: 0, good: 0, average: 0, poor: 0 }}
                loading={loading}
              />
            </div>

            {/* Recent Analyses */}
            <div className="mt-6">
              <ResumeHistory analyses={recentAnalyses} loading={loading} />
            </div>
          </>
        ) : (
          <>
            {/* Empty State */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">No Resumes Yet</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Upload your first resume to get an ATS analysis, AI feedback, and personalized career insights.
                  </p>
                  <Button asChild size="lg" variant="premium">
                    <Link href="/dashboard/resume-new">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your First Resume
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 grid md:grid-cols-3 gap-4"
            >
              {[
                { icon: Sparkles, title: "ATS Optimization", desc: "Get a detailed compatibility score and keyword analysis." },
                { icon: Brain, title: "AI Feedback", desc: "Receive personalized suggestions to improve your resume." },
                { icon: TrendingUp, title: "Career Insights", desc: "Discover skill gaps and growth opportunities." },
              ].map((tip) => (
                <Card key={tip.title}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                      <tip.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground">{tip.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
