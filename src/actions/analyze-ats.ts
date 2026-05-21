"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeAts } from "@/lib/ats-analyzer";
import { atsAnalysisSchema } from "@/schemas";
import { checkActionRateLimit } from "@/lib/rate-limiter";
import { logger, LogEvent } from "@/lib/logger";
import { assertUsageAvailable, recordUsage } from "@/lib/billing";
import type { AtsResult } from "@/types";
import type { Prisma } from "@prisma/client";

export async function analyzeResumeAts(
  input: unknown,
): Promise<{ success: true; data: AtsResult } | { success: false; error: string }> {
  try {
    const user = await requireAuth();

    // Rate limit: 10 ATS analyses per hour per user
    const rateCheck = checkActionRateLimit("atsAnalysis", user.id);
    if (!rateCheck.success) {
      logger.warn(LogEvent.RATE_LIMITED, "ATS analysis rate limited", {
        userId: user.id,
      });
      return { success: false, error: rateCheck.error };
    }

    const usageCheck = await assertUsageAvailable(user.id, "ai_generation");
    if (!usageCheck.allowed) {
      return {
        success: false,
        error: usageCheck.error ?? "AI generation limit reached",
      };
    }

    // Validate with Zod
    const parsed = atsAnalysisSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((e) => e.message).join(", ");
      logger.warn(LogEvent.VALIDATION_ERROR, "ATS analysis validation failed", {
        metadata: { errors: parsed.error.issues },
      });
      return { success: false, error: errorMsg };
    }

    const { resumeId, jobDescription } = parsed.data;

    // Verify resume ownership
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
    });

    if (!resume) {
      return { success: false, error: "Resume not found" };
    }

    if (!resume.parsedData || !resume.rawText) {
      return { success: false, error: "Resume has not been parsed yet" };
    }

    const parsedData = resume.parsedData as Record<string, unknown>;

    // Check for duplicate in-progress analysis
    const existingAnalysis = await prisma.analysis.findFirst({
      where: {
        resumeId,
        userId: user.id,
        type: jobDescription ? "full" : "ats_only",
        status: { in: ["pending", "processing"] },
      },
    });

    if (existingAnalysis) {
      return { success: false, error: "Analysis already in progress for this resume" };
    }

    logger.info(LogEvent.ATS_ANALYSIS_START, "Starting ATS analysis", {
      userId: user.id,
      metadata: { resumeId, hasJobDescription: !!jobDescription },
    });

    const analysis = await prisma.analysis.create({
      data: {
        resumeId,
        userId: user.id,
        jobDescription: jobDescription ?? null,
        type: jobDescription ? "full" : "ats_only",
        status: "processing",
      },
    });

    const startTime = Date.now();
    const result = await analyzeAts(
      resume.rawText,
      parsedData as never,
      jobDescription,
    );
    const durationMs = Date.now() - startTime;

    await prisma.atsReport.create({
      data: {
        analysisId: analysis.id,
        score: result.score,
        keywordMatch: result.keywordMatch,
        matchedKeywords: result.matchedKeywords as unknown as Prisma.InputJsonValue,
        missingKeywords: result.missingKeywords as unknown as Prisma.InputJsonValue,
        readability: result.readability,
        formattingScore: result.formatting.issues.length > 0
          ? Math.max(0, 100 - result.formatting.issues.length * 10)
          : 100,
        formatting: result.formatting as unknown as Prisma.InputJsonValue,
        sectionScore: result.sectionScore as unknown as Prisma.InputJsonValue,
        suggestions: result.suggestions as unknown as Prisma.InputJsonValue,
        rawAnalysis: JSON.stringify(result),
      },
    });

    await prisma.analysis.update({
      where: { id: analysis.id },
      data: { status: "completed", durationMs },
    });

    await recordUsage(user.id, "ai_generation");

    logger.info(LogEvent.ATS_ANALYSIS_COMPLETE, "ATS analysis completed", {
      userId: user.id,
      metadata: { resumeId, score: result.score },
      durationMs,
    });

    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "ATS analysis failed";
    logger.error(LogEvent.ATS_ANALYSIS_FAILED, message, {
      metadata: { input },
    });
    return { success: false, error: message };
  }
}
