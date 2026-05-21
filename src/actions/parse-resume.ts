"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadFile, extractText } from "@/lib/resume-parser";
import { parseWithAI } from "@/lib/ai-parser";
import { resumeUploadSchema } from "@/schemas";
import { checkActionRateLimit } from "@/lib/rate-limiter";
import { logger, LogEvent } from "@/lib/logger";
import { sanitizeInput, validateResumeFile } from "@/lib/security";
import { assertUsageAvailable, recordUsage } from "@/lib/billing";
import type { ParsedResume } from "@/types";
import type { Prisma } from "@prisma/client";

export interface ParseResult {
  resumeId: string;
  parsedData: ParsedResume;
  rawText: string;
}

export async function parseResume(
  input: unknown,
): Promise<{ success: true; data: ParseResult } | { success: false; error: string }> {
  try {
    const user = await requireAuth();

    // Rate limit: 5 uploads per hour per user
    const rateCheck = checkActionRateLimit("resumeUpload", user.id);
    if (!rateCheck.success) {
      logger.warn(LogEvent.RATE_LIMITED, "Upload rate limited", {
        userId: user.id,
      });
      return { success: false, error: rateCheck.error };
    }

    const usageCheck = await assertUsageAvailable(user.id, "resume_upload");
    if (!usageCheck.allowed) {
      return {
        success: false,
        error: usageCheck.error ?? "Resume upload limit reached",
      };
    }

    // Validate with Zod
    const parsed = resumeUploadSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((e) => e.message).join(", ");
      logger.warn(LogEvent.VALIDATION_ERROR, "Upload validation failed", {
        metadata: { errors: parsed.error.issues },
      });
      return { success: false, error: errorMsg };
    }

    const { title, fileUrl, fileKey, fileName, fileType, fileSize } = parsed.data;

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title, 200);
    const sanitizedFileName = sanitizeInput(fileName, 255);

    // Validate file
    const mimeType = fileType === "pdf"
      ? "application/pdf"
      : fileType === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : fileType;
    const fileValidation = validateResumeFile({
      name: fileName,
      size: fileSize,
      type: mimeType,
    });
    if (!fileValidation.valid) {
      logger.warn(LogEvent.UPLOAD_INVALID_FILE, "Invalid file upload attempt", {
        userId: user.id,
        metadata: { fileName, fileType, fileSize },
      });
      return { success: false, error: fileValidation.error };
    }

    logger.info(LogEvent.UPLOAD_START, "Starting resume upload", {
      userId: user.id,
      metadata: { fileName: sanitizedFileName, fileType, fileSize },
    });

    logger.info(LogEvent.PARSE_START, "Starting resume parsing", {
      userId: user.id,
      metadata: { fileName: sanitizedFileName },
    });

    const startTime = Date.now();
    const buffer = await downloadFile(fileUrl);
    const { rawText } = await extractText(buffer, fileType);
    const parsedData = await parseWithAI(rawText);
    const durationMs = Date.now() - startTime;

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: sanitizedTitle,
        fileName: sanitizedFileName,
        fileUrl,
        fileKey,
        fileType,
        fileSize,
        rawText,
        parsedData: parsedData as unknown as Prisma.InputJsonValue,
      },
    });

    await recordUsage(user.id, "resume_upload");

    logger.info(LogEvent.PARSE_COMPLETE, "Resume parsed successfully", {
      userId: user.id,
      metadata: { resumeId: resume.id, skillsCount: parsedData.skills.length },
      durationMs,
    });

    logger.info(LogEvent.UPLOAD_COMPLETE, "Resume upload complete", {
      userId: user.id,
      metadata: { resumeId: resume.id },
    });

    return {
      success: true,
      data: {
        resumeId: resume.id,
        parsedData,
        rawText,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse resume";
    logger.error(LogEvent.PARSE_FAILED, message, {
      metadata: { input },
    });
    return { success: false, error: message };
  }
}
