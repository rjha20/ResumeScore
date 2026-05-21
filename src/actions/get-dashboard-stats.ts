"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DashboardStats, AnalysisSummary } from "@/types";

/**
 * Fetches real dashboard statistics from the database for the authenticated user.
 */
export async function getDashboardStats(): Promise<
  { success: true; data: DashboardStats } | { success: false; error: string }
> {
  try {
    const user = await requireAuth();

    const [resumes, analyses, atsReports, aiFeedbackEntries] = await Promise.all([
      prisma.resume.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.analysis.findMany({
        where: { userId: user.id, status: "completed" },
        orderBy: { createdAt: "desc" },
        include: { atsReport: true, aiFeedback: true },
      }),
      prisma.atsReport.findMany({
        where: { analysis: { userId: user.id } },
      }),
      prisma.aiFeedback.findMany({
        where: { analysis: { userId: user.id } },
      }),
    ]);

    const totalResumes = resumes.length;
    const totalAnalyses = analyses.length;
    const averageAtsScore =
      atsReports.length > 0
        ? Math.round(
            atsReports.reduce((sum, r) => sum + r.score, 0) / atsReports.length,
          )
        : 0;
    const averageAiRating =
      aiFeedbackEntries.length > 0
        ? Math.round(
            aiFeedbackEntries.reduce((sum, f) => sum + (f.overallRating ?? 0), 0) /
              aiFeedbackEntries.length,
          )
        : 0;

    const recentAnalyses: AnalysisSummary[] = analyses.slice(0, 10).map((a) => ({
      id: a.id,
      resumeId: a.resumeId,
      resumeTitle: "Resume",
      atsScore: a.atsReport?.score ?? null,
      aiRating: a.aiFeedback?.overallRating ?? null,
      createdAt: a.createdAt.toISOString(),
      status: a.status,
    }));

    const scoreDistribution = {
      excellent: atsReports.filter((r) => r.score >= 80).length,
      good: atsReports.filter((r) => r.score >= 60 && r.score < 80).length,
      average: atsReports.filter((r) => r.score >= 40 && r.score < 60).length,
      poor: atsReports.filter((r) => r.score < 40).length,
    };

    return {
      success: true,
      data: {
        totalResumes,
        totalAnalyses,
        averageAtsScore,
        averageAiRating,
        recentAnalyses,
        scoreDistribution,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch dashboard stats";
    return { success: false, error: message };
  }
}

/**
 * Fetches ATS score trend data over time for chart rendering.
 */
export async function getAtsTrend(): Promise<
  | { success: true; data: { date: string; score: number }[] }
  | { success: false; error: string }
> {
  try {
    const user = await requireAuth();

    const reports = await prisma.atsReport.findMany({
      where: { analysis: { userId: user.id } },
      orderBy: { createdAt: "asc" },
      include: { analysis: { select: { createdAt: true } } },
    });

    const trend = reports.map((r) => ({
      date: r.createdAt.toISOString().split("T")[0],
      score: r.score,
    }));

    return { success: true, data: trend };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch ATS trend";
    return { success: false, error: message };
  }
}

/**
 * Lists all resumes for the authenticated user with basic metadata.
 */
export async function getResumeList() {
  try {
    const user = await requireAuth();

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        analyses: {
          where: { status: "completed" },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { atsReport: true },
        },
      },
    });

    return {
      success: true,
      data: resumes.map((r) => ({
        id: r.id,
        title: r.title,
        fileName: r.fileName,
        fileType: r.fileType,
        fileSize: r.fileSize,
        parsed: !!r.parsedData,
        createdAt: r.createdAt.toISOString(),
        latestAtsScore: r.analyses[0]?.atsReport?.score ?? null,
      })),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch resumes";
    return { success: false, error: message };
  }
}