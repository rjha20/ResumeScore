import { z } from "zod";

// ─── Resume Upload ──────────────────────────────────────────────────
export const resumeUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  fileUrl: z.string().url("Invalid file URL"),
  fileKey: z.string().min(1, "File key is required"),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().max(10 * 1024 * 1024, "File must be under 10MB"),
});

export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>;

// ─── Job Description ────────────────────────────────────────────────
export const jobDescriptionSchema = z.object({
  jobDescription: z.string().min(10, "Job description must be at least 10 characters").max(10000),
  resumeId: z.string().cuid(),
});

export type JobDescriptionInput = z.infer<typeof jobDescriptionSchema>;

// ─── Analysis Request ───────────────────────────────────────────────
export const analysisRequestSchema = z.object({
  resumeId: z.string().cuid(),
  jobDescription: z.string().optional(),
  type: z.enum(["full", "ats_only", "ai_only"]).default("full"),
});

export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;

// ─── User Profile Update ────────────────────────────────────────────
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ─── Resume Title Update ────────────────────────────────────────────
export const resumeUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
});

export type ResumeUpdateInput = z.infer<typeof resumeUpdateSchema>;

// ─── File Validation ────────────────────────────────────────────────
export const ALLOWED_FILE_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;
export const ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const fileValidationSchema = z.object({
  type: z.enum(ALLOWED_FILE_TYPES, { message: "Only PDF and DOCX files are allowed" }),
  size: z.number().max(MAX_FILE_SIZE, "File must be under 10MB"),
  name: z.string().refine(
    (name) => ALLOWED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext)),
    { message: "File must be .pdf or .docx" }
  ),
});

export type FileValidationInput = z.infer<typeof fileValidationSchema>;

// ─── Parsed Resume ──────────────────────────────────────────────────
export const parsedExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  current: z.boolean(),
  description: z.array(z.string()),
});

export const parsedEducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  gpa: z.string().optional(),
  field: z.string().optional(),
});

export const parsedProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  url: z.string().optional(),
});

export const parsedCertificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string().optional(),
  url: z.string().optional(),
});

export const parsedResumeSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  skills: z.array(z.string()),
  experience: z.array(parsedExperienceSchema),
  education: z.array(parsedEducationSchema),
  projects: z.array(parsedProjectSchema),
  certifications: z.array(parsedCertificationSchema),
});

export type ParsedResumeInput = z.infer<typeof parsedResumeSchema>;

// ─── ATS Analysis ───────────────────────────────────────────────────
export const atsAnalysisSchema = z.object({
  resumeId: z.string().cuid(),
  jobDescription: z.string().min(10).max(10000).optional(),
});

export type AtsAnalysisInput = z.infer<typeof atsAnalysisSchema>;

// ─── API Response ──────────────────────────────────────────────────
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });