"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileText,
  Target,
  Brain,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import type { AnalysisSummary } from "@/types";

interface ResumeHistoryProps {
  analyses: AnalysisSummary[];
  loading?: boolean;
}

export function ResumeHistory({ analyses, loading }: ResumeHistoryProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No analyses yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload a resume to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Recent Analyses</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/resume-new">
              New Analysis
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyses.map((analysis, i) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/dashboard/resume/${analysis.resumeId}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {analysis.resumeTitle}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {analysis.atsScore != null && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-orange-500" />
                            <span className="text-sm font-semibold">
                              {analysis.atsScore}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">ATS</span>
                        </div>
                      )}
                      {analysis.aiRating != null && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Brain className="h-3 w-3 text-green-500" />
                            <span className="text-sm font-semibold">
                              {analysis.aiRating}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">AI</span>
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}