// ─── Shared TypeScript Types ───────────────────────────────────────

// ─── Resume Types ──────────────────────────────────────────────────
export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
}

export interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  field?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

// ─── ATS Types ──────────────────────────────────────────────────────
export interface AtsResult {
  score: number;
  keywordMatch: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  formatting: FormattingAnalysis;
  readability: number;
  sectionScore: Record<string, number>;
  suggestions: string[];
}

export interface FormattingAnalysis {
  hasBulletPoints: boolean;
  hasSections: boolean;
  properLength: boolean;
  hasContactInfo: boolean;
  fileType: string;
  issues: string[];
}

// ─── AI Analysis Types ──────────────────────────────────────────────
export interface AiAnalysisResult {
  overallRating: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  bulletPoints: BulletPointImprovement[];
  grammarIssues: GrammarIssue[];
  skillGaps: SkillGapAnalysis;
  careerSuggestions: string[];
}

export interface BulletPointImprovement {
  original: string;
  improved: string;
  reasoning: string;
}

export interface GrammarIssue {
  text: string;
  suggestion: string;
  type: "grammar" | "spelling" | "style" | "clarity";
}

export interface SkillGapAnalysis {
  currentSkills: string[];
  recommendedSkills: string[];
  marketDemandSkills: string[];
  courses: string[];
}

// ─── Dashboard Types ────────────────────────────────────────────────
export interface DashboardStats {
  totalResumes: number;
  totalAnalyses: number;
  averageAtsScore: number;
  averageAiRating: number;
  recentAnalyses: AnalysisSummary[];
  scoreDistribution: ScoreDistribution;
}

export interface AnalysisSummary {
  id: string;
  resumeId: string;
  resumeTitle: string;
  atsScore: number | null;
  aiRating: number | null;
  createdAt: string;
  status: string;
}

export interface ScoreDistribution {
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

// ─── Upload Types ───────────────────────────────────────────────────
export interface UploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
}

// ─── API Response Wrapper ──────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── User Types ────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: "candidate" | "admin";
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
  };
}