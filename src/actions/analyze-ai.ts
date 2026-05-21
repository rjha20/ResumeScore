"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeResumeWithAI } from "@/lib/ai-analyzer";
import { analysisRequestSchema } from "@/schemas";
import { checkActionRateLimit } from "@/lib/rate-limiter";
import { logger, LogEvent } from "@/lib/logger";
import { assertUsageAvailable, recordUsage } from "@/lib/billing";
import type { AiAnalysisResult, ParsedResume } from "@/types";
import type { Prisma } from "@prisma/client";

/**
 * Runs full AI analysis (review, bullet points, skill gaps, career)
 * on a parsed resume and persists results to the database.
 */
export async function analyzeResumeAI(
  input: unknown,
): Promise<
  { success: true; data: AiAnalysisResult } | { success: false; error: string }
> {
  try {
    const user = await requireAuth();

    // Rate limit: 5 AI analyses per hour per user
    const rateCheck = checkActionRateLimit("aiAnalysis", user.id);
    if (!rateCheck.success) {
      logger.warn(LogEvent.AI_RATE_LIMITED, "AI analysis rate limited", {
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

    // Validate input with Zod
    const parsed = analysisRequestSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((e) => e.message).join(", ");
      logger.warn(LogEvent.VALIDATION_ERROR, "AI analysis validation failed", {
        metadata: { errors: parsed.error.issues },
      });
      return { success: false, error: errorMsg };
    }

    const { resumeId } = parsed.data;

    // Verify resume exists and belongs to user
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
    });

    if (!resume) {
      return { success: false, error: "Resume not found" };
    }

    if (!resume.parsedData || !resume.rawText) {
      return { success: false, error: "Resume has not been parsed yet" };
    }

    // Check for existing in-progress analysis
    const existingAnalysis = await prisma.analysis.findFirst({
      where: {
        resumeId,
        userId: user.id,
        type: "ai_only",
        status: { in: ["pending", "processing"] },
      },
    });

    if (existingAnalysis) {
      return {
        success: false,
        error: "AI analysis already in progress for this resume",
      };
    }

    logger.info(LogEvent.AI_ANALYSIS_START, "Starting AI analysis", {
      userId: user.id,
      metadata: { resumeId },
    });

    // Create the analysis record
    const analysis = await prisma.analysis.create({
      data: {
        resumeId,
        userId: user.id,
        type: "ai_only",
        status: "processing",
      },
    });

    const startTime = Date.now();

    // Run the AI analysis
    const result = await analyzeResumeWithAI(
      resume.rawText,
      resume.parsedData as unknown as ParsedResume,
    );

    const durationMs = Date.now() - startTime;

    // Persist AI feedback
    await prisma.aiFeedback.create({
      data: {
        analysisId: analysis.id,
        overallRating: result.overallRating,
        summary: result.summary,
        strengths: result.strengths as unknown as Prisma.InputJsonValue,
        improvements: result.improvements as unknown as Prisma.InputJsonValue,
        bulletPoints: result.bulletPoints as unknown as Prisma.InputJsonValue,
        grammarIssues: result.grammarIssues as unknown as Prisma.InputJsonValue,
        skillGaps: result.skillGaps as unknown as Prisma.InputJsonValue,
        careerAdvice: result.careerSuggestions.join("\n") || null,
        rawResponse: JSON.stringify(result),
        modelUsed: "groq+deepseek",
      },
    });

    // Mark analysis complete
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: { status: "completed", durationMs },
    });

    await recordUsage(user.id, "ai_generation");

    logger.info(LogEvent.AI_ANALYSIS_COMPLETE, "AI analysis completed", {
      userId: user.id,
      metadata: { resumeId, overallRating: result.overallRating },
      durationMs,
    });

    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI analysis failed";
    logger.error(LogEvent.AI_ANALYSIS_FAILED, message, {
      metadata: { input },
    });
    return { success: false, error: message };
  }
}

/**
 * Safely cast a Prisma JSON value to an array of a given type.
 */
function safeJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

/**
 * Fetches previous AI analysis results for a resume.
 */
export async function getAiAnalysis(
  resumeId: string,
): Promise<
  | { success: true; data: AiAnalysisResult }
  | { success: false; error: string }
> {
  try {
    const user = await requireAuth();

    const analysis = await prisma.analysis.findFirst({
      where: {
        resumeId,
        userId: user.id,
        type: "ai_only",
        status: "completed",
      },
      include: { aiFeedback: true },
      orderBy: { createdAt: "desc" },
    });

    if (!analysis?.aiFeedback) {
      return { success: false, error: "No AI analysis found" };
    }

    const fb = analysis.aiFeedback;

    return {
      success: true,
      data: {
        overallRating: fb.overallRating ?? 0,
        summary: fb.summary ?? "",
        strengths: safeJsonArray<string>(fb.strengths),
        improvements: safeJsonArray<string>(fb.improvements),
        bulletPoints: safeJsonArray(fb.bulletPoints),
        grammarIssues: safeJsonArray(fb.grammarIssues),
        skillGaps: (fb.skillGaps as unknown as AiAnalysisResult["skillGaps"]) ?? {
          currentSkills: [],
          recommendedSkills: [],
          marketDemandSkills: [],
          courses: [],
        },
        careerSuggestions: fb.careerAdvice?.split("\n") ?? [],
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch AI analysis";
    return { success: false, error: message };
  }
}
