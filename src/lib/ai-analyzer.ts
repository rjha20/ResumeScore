import OpenAI from "openai";
import { withCache, generateCacheKey } from "./ai-cache";
import type { ParsedResume, AiAnalysisResult, BulletPointImprovement, GrammarIssue, SkillGapAnalysis } from "@/types";

// ─── AI Provider Config ─────────────────────────────────────────────
const AI_CONFIGS = [
  {
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "deepseek",
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: "deepseek-chat",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────
function createClient(config: { baseURL: string; apiKey?: string }): OpenAI {
  return new OpenAI({ baseURL: config.baseURL, apiKey: config.apiKey });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

// ─── SYSTEM PROMPTS ─────────────────────────────────────────────────

const REVIEW_SYSTEM_PROMPT = `You are an expert resume reviewer and career coach with 15+ years in HR and tech recruiting.

Analyze the resume and return ONLY valid JSON matching this interface:
{
  "overallRating": number (0-100),
  "summary": string,
  "strengths": string[],
  "improvements": string[],
  "weakSections": string[],
  "missingImpact": string[],
  "poorWording": string[]
}

Be honest and critical. A score of 80+ means a strong resume with minor tweaks.
Score 60-79 means decent but needs significant improvement.
Score below 60 means major restructuring needed.

Focus on:
- Action verbs and measurable impact
- Section completeness and relevance
- Quantified achievements
- Industry-standard formatting
- Keyword density for ATS`;

const BULLET_POINT_SYSTEM_PROMPT = `You are a resume bullet point optimization expert.

For each experience/project bullet point in the resume, rewrite it to be more impactful.
Return ONLY valid JSON matching this interface:
{
  "bulletPoints": Array<{
    "original": string,
    "improved": string,
    "reasoning": string
  }>
}

Rules for improvement:
1. Start with strong action verbs (Led, Developed, Implemented, Optimized, Architected)
2. Add measurable impact with metrics (%, $, time saved, users affected)
3. Include relevant technologies in context
4. Keep each bullet to 1-2 lines max
5. Follow the STAR method context where possible
6. Remove weak phrases like "Worked on", "Helped with", "Was responsible for"`;

const SKILL_GAP_SYSTEM_PROMPT = `You are a career technology skills analyst. Analyze the resume's skill set against current market demands.

Return ONLY valid JSON matching this interface:
{
  "skillGaps": {
    "currentSkills": string[],
    "recommendedSkills": string[],
    "marketDemandSkills": string[],
    "courses": string[]
  }
}

Consider:
- Current job market trends (2025-2026)
- Industry-specific requirements (backend, frontend, data, devops, AI/ML)
- Seniority level inferred from experience years
- Missing complementary technologies (e.g., if React then suggest TypeScript, Next.js)
- Certifications that add value for the role
- Suggest specific online courses/resources for each recommended skill`;

const CAREER_SYSTEM_PROMPT = `You are a senior career coach and tech industry strategist.

Analyze the resume and provide tailored career advancement suggestions.
Return ONLY valid JSON matching this interface:
{
  "careerSuggestions": string[],
  "nextRoles": string[],
  "growthAreas": string[]
}

Consider:
- Current role progression path (Junior → Senior → Lead → Manager/Staff)
- Missing leadership or mentoring experience
- Open source contributions and community involvement
- Side projects that demonstrate passion
- Industry networking and personal branding
- Certifications that unlock senior roles
- Location-specific market opportunities`;

// ─── BUILD USER PROMPTS ────────────────────────────────────────────

function buildResumeContext(rawText: string, parsed: ParsedResume): string {
  return `RESUME TEXT:
${rawText}

PARSED RESUME DATA:
${JSON.stringify(parsed, null, 2)}`;
}

function buildReviewPrompt(rawText: string, parsed: ParsedResume): string {
  return `Perform a comprehensive resume review. Identify weak sections, missing impact statements, and poor wording.

${buildResumeContext(rawText, parsed)}`;
}

function buildBulletPointPrompt(rawText: string, parsed: ParsedResume): string {
  return `Optimize all experience and project bullet points. Rewrite each for maximum impact.

${buildResumeContext(rawText, parsed)}

Focus on the experience and project sections. Return improvements for every bullet point found.`;
}

function buildSkillGapPrompt(rawText: string, parsed: ParsedResume): string {
  return `Analyze the skill set against current market demands for the candidate's apparent role/seniority.

${buildResumeContext(rawText, parsed)}`;
}

function buildCareerPrompt(rawText: string, parsed: ParsedResume): string {
  return `Provide career advancement suggestions for this professional.

${buildResumeContext(rawText, parsed)}`;
}

// ─── AI CALL HELPER ─────────────────────────────────────────────────
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096,
): Promise<string> {
  const errors: string[] = [];

  for (const config of AI_CONFIGS) {
    if (!config.apiKey) {
      errors.push(`${config.name}: no API key configured`);
      continue;
    }

    try {
      const client = createClient(config);
      const completion = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: maxTokens,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        errors.push(`${config.name}: empty response`);
        continue;
      }

      return content;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.name}: ${message}`);
    }
  }

  throw new Error(
    `All AI providers failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
  );
}

// ─── AI FEATURE FUNCTIONS ───────────────────────────────────────────

/**
 * Full AI Analysis — runs all four analysis features in parallel.
 * Results are cached per resume content to reduce API costs.
 */
export async function analyzeResumeWithAI(
  rawText: string,
  parsed: ParsedResume,
): Promise<AiAnalysisResult> {
  const cacheKey = generateCacheKey("ai_full", rawText);

  return withCache(cacheKey, async () => {
    const [reviewJson, bulletPointsJson, skillGapsJson, careerJson] =
      await Promise.all([
        callAI(REVIEW_SYSTEM_PROMPT, buildReviewPrompt(rawText, parsed)),
        callAI(BULLET_POINT_SYSTEM_PROMPT, buildBulletPointPrompt(rawText, parsed)),
        callAI(SKILL_GAP_SYSTEM_PROMPT, buildSkillGapPrompt(rawText, parsed)),
        callAI(CAREER_SYSTEM_PROMPT, buildCareerPrompt(rawText, parsed)),
      ]);

    const review = JSON.parse(reviewJson) as {
      overallRating?: number;
      summary?: string;
      strengths?: string[];
      improvements?: string[];
      weakSections?: string[];
      missingImpact?: string[];
      poorWording?: string[];
    };

    const bulletPoints = JSON.parse(bulletPointsJson) as {
      bulletPoints?: BulletPointImprovement[];
    };

    const skillGap = JSON.parse(skillGapsJson) as {
      skillGaps?: SkillGapAnalysis;
    };

    const career = JSON.parse(careerJson) as {
      careerSuggestions?: string[];
      nextRoles?: string[];
      growthAreas?: string[];
    };

    return {
      overallRating: clamp(review.overallRating ?? 0, 0, 100),
      summary: review.summary ?? "Analysis complete.",
      strengths: review.strengths ?? [],
      improvements: review.improvements ?? [],
      bulletPoints: bulletPoints.bulletPoints ?? [],
      grammarIssues: extractGrammarIssues(parsed),
      skillGaps: skillGap.skillGaps ?? {
        currentSkills: parsed.skills,
        recommendedSkills: [],
        marketDemandSkills: [],
        courses: [],
      },
      careerSuggestions: career.careerSuggestions ?? [],
    };
  });
}

/**
 * Standalone bullet point optimizer.
 */
export async function optimizeBulletPoints(
  rawText: string,
  parsed: ParsedResume,
): Promise<BulletPointImprovement[]> {
  const json = await callAI(
    BULLET_POINT_SYSTEM_PROMPT,
    buildBulletPointPrompt(rawText, parsed),
  );
  const result = JSON.parse(json) as { bulletPoints?: BulletPointImprovement[] };
  return result.bulletPoints ?? [];
}

/**
 * Standalone skill gap analyzer.
 */
export async function analyzeSkillGaps(
  rawText: string,
  parsed: ParsedResume,
): Promise<SkillGapAnalysis> {
  const json = await callAI(
    SKILL_GAP_SYSTEM_PROMPT,
    buildSkillGapPrompt(rawText, parsed),
  );
  const result = JSON.parse(json) as { skillGaps?: SkillGapAnalysis };
  return result.skillGaps ?? {
    currentSkills: parsed.skills,
    recommendedSkills: [],
    marketDemandSkills: [],
    courses: [],
  };
}

/**
 * Standalone career suggestion generator.
 */
export async function getCareerSuggestions(
  rawText: string,
  parsed: ParsedResume,
): Promise<string[]> {
  const json = await callAI(
    CAREER_SYSTEM_PROMPT,
    buildCareerPrompt(rawText, parsed),
  );
  const result = JSON.parse(json) as { careerSuggestions?: string[] };
  return result.careerSuggestions ?? [];
}

/**
 * Extracts grammar/style issues from parsed resume text.
 * Uses rule-based detection for common issues, supplemented by AI analysis.
 */
function extractGrammarIssues(parsed: ParsedResume): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const weakPhrases = [
    "worked on", "was responsible for", "helped with", "did",
    "made", "got", "was part of", "involved in", "tasked with",
  ];
  const actionVerbs = [
    "developed", "implemented", "designed", "architected", "optimized",
    "led", "managed", "created", "built", "delivered", "launched",
    "improved", "increased", "reduced", "automated", "migrated",
  ];

  for (const exp of parsed.experience) {
    for (const desc of exp.description) {
      const lower = desc.toLowerCase();

      // Check for weak phrases
      for (const phrase of weakPhrases) {
        if (lower.includes(phrase)) {
          issues.push({
            text: desc,
            suggestion: `Replace "${phrase}" with a strong action verb like "${actionVerbs[Math.floor(Math.random() * actionVerbs.length)]}"`,
            type: "style",
          });
          break;
        }
      }

      // Check for missing metrics
      if (!/[0-9]+%/.test(desc) && !/\$\d/.test(desc) && !/\d+x/.test(lower)) {
        issues.push({
          text: desc.substring(0, 100),
          suggestion: "Add measurable impact (%, $, time saved, users affected)",
          type: "clarity",
        });
      }

      // Check for passive voice
      if (/\b(was|were|been|being|am|is|are)\s+\w+ed\b/i.test(desc)) {
        issues.push({
          text: desc.substring(0, 100),
          suggestion: "Use active voice instead of passive voice",
          type: "grammar",
        });
      }
    }
  }

  return issues;
}