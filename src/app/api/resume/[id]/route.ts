import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Rate limit: 60 API requests per minute per user
    const clientId = `user:${user.id}`;
    const rateCheck = checkRateLimit("api", clientId);
    if (!rateCheck.allowed) {
      return Response.json(
        { success: false, error: "Too many requests. Please slow down." },
        { status: 429 },
      );
    }

    const resume = await prisma.resume.findUnique({
      where: { id, userId: user.id },
      include: {
        analyses: {
          where: { type: { in: ["ats_only", "full", "ai_only"] } },
          include: { atsReport: true, aiFeedback: true },
          orderBy: { createdAt: "desc" },
          take: 2,
        },
      },
    });

    if (!resume) {
      return Response.json({ success: false, error: "Resume not found" });
    }

    const atsAnalysis = resume.analyses.find(
      (a) => a.type === "ats_only" || a.type === "full",
    );
    const aiAnalysis = resume.analyses.find(
      (a) => a.type === "ai_only" || a.type === "full",
    );

    const atsReport = atsAnalysis?.atsReport
      ? {
          score: atsAnalysis.atsReport.score,
          keywordMatch: atsAnalysis.atsReport.keywordMatch,
          readability: atsAnalysis.atsReport.readability,
          formattingScore: atsAnalysis.atsReport.formattingScore,
          matchedKeywords: atsAnalysis.atsReport.matchedKeywords as string[],
          missingKeywords: atsAnalysis.atsReport.missingKeywords as string[],
          suggestions: atsAnalysis.atsReport.suggestions as string[],
          sectionScore: atsAnalysis.atsReport.sectionScore as Record<string, number>,
          formatting: atsAnalysis.atsReport.formatting as {
            hasBulletPoints: boolean;
            hasSections: boolean;
            properLength: boolean;
            hasContactInfo: boolean;
            fileType: string;
            issues: string[];
          },
        }
      : null;

    const aiFeedback = aiAnalysis?.aiFeedback
      ? {
          overallRating: aiAnalysis.aiFeedback.overallRating,
          summary: aiAnalysis.aiFeedback.summary,
          strengths: aiAnalysis.aiFeedback.strengths as string[],
          weaknesses: aiAnalysis.aiFeedback.weaknesses as string[],
          improvements: aiAnalysis.aiFeedback.improvements as string[],
          bulletPoints: aiAnalysis.aiFeedback.bulletPoints as Array<{
            original: string;
            improved: string;
            reasoning: string;
          }>,
          grammarIssues: aiAnalysis.aiFeedback.grammarIssues as Array<{
            text: string;
            suggestion: string;
            type: string;
          }>,
          skillGaps: aiAnalysis.aiFeedback.skillGaps as {
            currentSkills: string[];
            recommendedSkills: string[];
            marketDemandSkills: string[];
            courses: string[];
          },
          careerAdvice: aiAnalysis.aiFeedback.careerAdvice,
        }
      : null;

    return Response.json({
      success: true,
      data: {
        id: resume.id,
        title: resume.title,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        fileType: resume.fileType,
        parsedData: resume.parsedData,
        rawText: resume.rawText,
        atsReport,
        aiFeedback,
      },
    });
  } catch {
    return Response.json({ success: false, error: "Failed to load resume" });
  }
}
