"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoreDistribution } from "@/types";

const PIE_COLORS = {
  excellent: "#22c55e",
  good: "#eab308",
  average: "#f97316",
  poor: "#ef4444",
};

const PIE_DATA_KEYS: { key: keyof ScoreDistribution; label: string; color: string }[] = [
  { key: "excellent", label: "Excellent (80+)", color: PIE_COLORS.excellent },
  { key: "good", label: "Good (60-79)", color: PIE_COLORS.good },
  { key: "average", label: "Average (40-59)", color: PIE_COLORS.average },
  { key: "poor", label: "Poor (<40)", color: PIE_COLORS.poor },
];

interface AtsChartProps {
  trendData: { date: string; score: number }[];
  distribution: ScoreDistribution;
  loading?: boolean;
}

export function AtsChart({ trendData, distribution, loading }: AtsChartProps) {
  const pieData = PIE_DATA_KEYS.map(({ key, label, color }) => ({
    name: label,
    value: distribution[key],
    color,
  })).filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>ATS Score Trend</CardTitle></CardHeader><CardContent><div className="h-[250px] bg-muted animate-pulse rounded-lg" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader><CardContent><div className="h-[250px] bg-muted animate-pulse rounded-lg" /></CardContent></Card>
      </div>
    );
  }

  if (trendData.length === 0 && pieData.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid md:grid-cols-2 gap-4"
    >
      {/* Trend Bar Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ATS Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v?.slice(5) ?? ""}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Distribution Pie */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}