import OpenAI from "openai";
import type { ParsedResume } from "@/types";

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

const SYSTEM_PROMPT = `You are a resume parsing engine. Extract structured information from the resume text provided.

Return ONLY valid JSON matching this exact TypeScript interface:

{
  "name": string,
  "email": string,
  "phone": string,
  "skills": string[],
  "experience": Array<{
    "title": string,
    "company": string,
    "location"?: string,
    "startDate": string,
    "endDate": string | null,
    "current": boolean,
    "description": string[]
  }>,
  "education": Array<{
    "degree": string,
    "institution": string,
    "location"?: string,
    "startDate": string,
    "endDate": string,
    "gpa"?: string,
    "field"?: string
  }>,
  "projects": Array<{
    "name": string,
    "description": string,
    "technologies": string[],
    "url"?: string
  }>,
  "certifications": Array<{
    "name": string,
    "issuer": string,
    "date"?: string,
    "url"?: string
  }>
}

Rules:
- Normalize skill names (e.g., "ReactJS" → "React", "Node" → "Node.js")
- Detect roles/titles from experience entries
- Extract all technologies mentioned in projects and skills
- For dates use "YYYY-MM" or "YYYY" format. Use null for endDate if it's current/present
- Set "current": true for experience entries that are ongoing
- Use empty arrays for missing sections
- Use empty string for missing scalar fields
- Omit optional fields entirely if not present`;

function createClient(config: { baseURL: string; apiKey?: string }): OpenAI {
  return new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
}

function buildUserPrompt(rawText: string): string {
  return `Parse the following resume text and return the structured JSON:

--- BEGIN RESUME TEXT ---
${rawText}
--- END RESUME TEXT ---`;
}

export async function parseWithAI(rawText: string): Promise<ParsedResume> {
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
          { role: "user", content: buildUserPrompt(rawText) },
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

      const parsed = JSON.parse(content) as ParsedResume;
      return normalizedResume(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.name}: ${message}`);
    }
  }

  throw new Error(
    `All AI providers failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
  );
}

function normalizedResume(data: Partial<ParsedResume>): ParsedResume {
  return {
    name: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    skills: data.skills ?? [],
    experience: Array.isArray(data.experience)
      ? data.experience.map((exp) => ({
          title: exp.title ?? "",
          company: exp.company ?? "",
          location: exp.location ?? undefined,
          startDate: exp.startDate ?? "",
          endDate: exp.endDate ?? null,
          current: exp.current ?? false,
          description: Array.isArray(exp.description) ? exp.description : [],
        }))
      : [],
    education: Array.isArray(data.education)
      ? data.education.map((edu) => ({
          degree: edu.degree ?? "",
          institution: edu.institution ?? "",
          location: edu.location ?? undefined,
          startDate: edu.startDate ?? "",
          endDate: edu.endDate ?? "",
          gpa: edu.gpa ?? undefined,
          field: edu.field ?? undefined,
        }))
      : [],
    projects: Array.isArray(data.projects)
      ? data.projects.map((proj) => ({
          name: proj.name ?? "",
          description: proj.description ?? "",
          technologies: Array.isArray(proj.technologies)
            ? proj.technologies
            : [],
          url: proj.url ?? undefined,
        }))
      : [],
    certifications: Array.isArray(data.certifications)
      ? data.certifications.map((cert) => ({
          name: cert.name ?? "",
          issuer: cert.issuer ?? "",
          date: cert.date ?? undefined,
          url: cert.url ?? undefined,
        }))
      : [],
  };
}
