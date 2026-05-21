import OpenAI from "openai";
import type { AtsResult, FormattingAnalysis, ParsedResume } from "@/types";

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

const SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) analysis engine. Analyze the resume against any provided job description and return a detailed ATS compatibility report.

Return ONLY valid JSON matching this interface:
{
  "score": number,
  "keywordMatch": number,
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "formatting": {
    "hasBulletPoints": boolean,
    "hasSections": boolean,
    "properLength": boolean,
    "hasContactInfo": boolean,
    "fileType": string,
    "issues": string[]
  },
  "readability": number,
  "sectionScore": Record<string, number>,
  "suggestions": string[]
}

Scoring formula:
- ATS Score = 40% Skill Match + 30% Experience + 20% Formatting + 10% Readability
- keywordMatch: percentage (0-100) of job description keywords found in resume
- readability: 0-100 score based on sentence length, bullet point usage, and clear section headers
- sectionScore: object with scores (0-100) for each section found (e.g., "summary", "experience", "education", "skills", "projects", "certifications")

Rules for analysis:
1. Extract keywords from job description and check presence in resume
2. Identify missing important keywords
3. Evaluate resume structure (proper sections, chronological order)
4. Check for bullet points vs paragraphs
5. Assess proper length (1-2 pages ideal)
6. Verify contact info presence (name, email, phone, links)
7. Detect formatting issues (inconsistent fonts, poor spacing, lack of section headers)
8. Score each section based on completeness and relevance
9. Provide actionable suggestions for improvement
10. Be critical but fair - score 70+ means resume is strong`;

function createClient(config: { baseURL: string; apiKey?: string }): OpenAI {
  return new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
}

function buildUserPrompt(
  rawText: string,
  parsedData: ParsedResume,
  jobDescription?: string,
): string {
  return `Analyze this resume for ATS compatibility${
    jobDescription ? " against the provided job description" : ""
  }.

Resume Text:
--- BEGIN RESUME ---
${rawText}
--- END RESUME ---

Parsed Resume Data:
${JSON.stringify(parsedData, null, 2)}
${
  jobDescription
    ? `

Job Description:
--- BEGIN JD ---
${jobDescription}
--- END JD ---`
    : ""
}

Perform the analysis and return the JSON result.`;
}

export async function analyzeAts(
  rawText: string,
  parsedData: ParsedResume,
  jobDescription?: string,
): Promise<AtsResult> {
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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(rawText, parsedData, jobDescription) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        errors.push(`${config.name}: empty response`);
        continue;
      }

      const parsed = JSON.parse(content) as AtsResult;
      return normalizeAtsResult(parsed, rawText);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.name}: ${message}`);
    }
  }

  throw new Error(
    `All AI providers failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
  );
}

function normalizeAtsResult(data: Partial<AtsResult>, rawText: string): AtsResult {
  const formatting = data.formatting ?? ({} as Partial<FormattingAnalysis>);

  return {
    score: clamp(data.score ?? 0, 0, 100),
    keywordMatch: clamp(data.keywordMatch ?? 0, 0, 100),
    matchedKeywords: Array.isArray(data.matchedKeywords) ? data.matchedKeywords : [],
    missingKeywords: Array.isArray(data.missingKeywords) ? data.missingKeywords : [],
    formatting: {
      hasBulletPoints: formatting.hasBulletPoints ?? (rawText.includes("•") || rawText.includes("- ")),
      hasSections: formatting.hasSections ?? true,
      properLength: formatting.properLength ?? true,
      hasContactInfo: formatting.hasContactInfo ?? false,
      fileType: formatting.fileType ?? "pdf",
      issues: Array.isArray(formatting.issues) ? formatting.issues : [],
    },
    readability: clamp(data.readability ?? 0, 0, 100),
    sectionScore: data.sectionScore ?? {},
    suggestions: Array.isArray(data.suggestions)
      ? data.suggestions
      : [],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
