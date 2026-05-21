"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  BarChart3,
  Target,
  Brain,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

const statConfigs = [
  {
    icon: FileText,
    label: "Total Resumes",
    key: "totalResumes" as const,
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: BarChart3,
    label: "Analyses Done",
    key: "totalAnalyses" as const,
    gradient: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    icon: Target,
    label: "Avg ATS Score",
    key: "averageAtsScore" as const,
    gradient: "from-orange-500 to-red-500",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    icon: Brain,
    label: "AI Rating",
    key: "averageAiRating" as const,
    gradient: "from-green-500 to-emerald-500",
    iconBg: "bg-green-100 dark:bg-green-900/30",
  },
];

export const StatsCards = memo(function StatsCards({ stats, loading }: StatsCardsProps) {
  const getValue = (key: string): string | number => {
    if (loading) return "—";
    switch (key) {
      case "totalResumes":
        return stats.totalResumes;
      case "totalAnalyses":
        return stats.totalAnalyses;
      case "averageAtsScore":
        return stats.averageAtsScore > 0 ? `${stats.averageAtsScore}%` : "—";
      case "averageAiRating":
        return stats.averageAiRating > 0 ? `${stats.averageAiRating}%` : "—";
      default:
        return "—";
    }
  };

  const getTrend = (key: string): { icon: typeof TrendingUp; color: string } | null => {
    if (loading || key === "totalResumes" || key === "totalAnalyses") return null;
    const val = stats[key as keyof DashboardStats] as number;
    if (val >= 70) return { icon: TrendingUp, color: "text-green-500" };
    if (val >= 40) return { icon: TrendingUp, color: "text-yellow-500" };
    return { icon: TrendingDown, color: "text-red-500" };
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statConfigs.map((stat, i) => {
        const trend = getTrend(stat.key);
        const TrendIcon = trend?.icon;

        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shrink-0`}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  {trend && TrendIcon && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend.color}`}>
                      <TrendIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <div className="h-7 w-16 bg-muted rounded animate-pulse" />
                    ) : (
                      getValue(stat.key)
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
});
