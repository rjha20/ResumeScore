"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, FileText, Mail, Phone, MapPin, Calendar,
  Briefcase, GraduationCap, Code, Award, Activity,
  Brain, Target, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeResumeAts } from "@/actions/analyze-ats";
import { analyzeResumeAI } from "@/actions/analyze-ai";
import { cn } from "@/lib/utils";
import type { AtsResult, ParsedResume, AiAnalysisResult } from "@/types";

interface AiFeedbackData {
  overallRating: number | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  bulletPoints: Array<{
    original: string;
    improved: string;
    reasoning: string;
  }>;
  grammarIssues: Array<{
    text: string;
    suggestion: string;
    type: string;
  }>;
  skillGaps: {
    currentSkills: string[];
    recommendedSkills: string[];
    marketDemandSkills: string[];
    courses: string[];
  };
  careerAdvice: string | null;
}

interface ResumeData {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  parsedData: ParsedResume | null;
  rawText: string | null;
  atsReport: {
    score: number;
    keywordMatch: number;
    readability: number;
    formattingScore: number | null;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
    sectionScore: Record<string, number>;
    formatting: {
      hasBulletPoints: boolean;
      hasSections: boolean;
      properLength: boolean;
      hasContactInfo: boolean;
      fileType: string;
      issues: string[];
    };
  } | null;
  aiFeedback: AiFeedbackData | null;
}

export default function ResumeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/resume/${id}`);
        const json = await res.json();
        if (!json.success) {
          setError(json.error ?? "Failed to load resume");
        } else {
          setResume(json.data);
        }
      } catch {
        setError("Failed to load resume");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeResumeAts({ resumeId: id });
    if (result.success) {
      setResume((prev) =>
        prev ? { ...prev, atsReport: result.data as unknown as ResumeData["atsReport"] } : prev
      );
    } else {
      setError(result.error);
    }
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !resume) {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Resume not found</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!resume) return null;

  const pd = resume.parsedData;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{resume.title}</h1>
            <p className="text-muted-foreground text-sm">
              {resume.fileName} &middot; {resume.fileType.toUpperCase()}
            </p>
          </div>
          {resume.fileUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View File
              </a>
            </Button>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {pd && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-lg font-semibold">{pd.name}</p>
                      {pd.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" /> {pd.email}
                        </p>
                      )}
                      {pd.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" /> {pd.phone}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {pd.skills.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Code className="h-5 w-5" />
                          Skills
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {pd.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {pd.experience.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Experience
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {pd.experience.map((exp, i) => (
                          <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold">{exp.title}</p>
                                <p className="text-sm text-muted-foreground">{exp.company}</p>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
                                <Calendar className="h-3 w-3" />
                                {exp.startDate} &ndash; {exp.current ? "Present" : exp.endDate}
                              </div>
                            </div>
                            {exp.description.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {exp.description.map((d, j) => (
                                  <li key={j} className="text-sm text-muted-foreground flex gap-2">
                                    <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                                    {d}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {pd.education.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5" />
                          Education
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pd.education.map((edu, i) => (
                          <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                            <p className="font-semibold">{edu.degree}</p>
                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {edu.startDate} &ndash; {edu.endDate}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {pd.projects.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Projects
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pd.projects.map((proj, i) => (
                          <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                            <p className="font-semibold">{proj.name}</p>
                            <p className="text-sm text-muted-foreground">{proj.description}</p>
                            {proj.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {proj.technologies.map((t) => (
                                  <span key={t} className="px-2 py-0.5 rounded bg-muted text-xs">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {pd.certifications.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Certifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {pd.certifications.map((cert, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{cert.name}</p>
                              <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}

            {!pd && (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Resume has not been parsed yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {!resume.atsReport ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      ATS Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Run an ATS analysis to check your resume&apos;s compatibility score, keyword match, and formatting.
                    </p>
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      variant="premium"
                      className="w-full"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4 mr-2" />
                          Run ATS Analysis
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      ATS Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <div className="text-5xl font-bold text-primary">
                        {resume.atsReport.score}
                      </div>
                      <p className="text-sm text-muted-foreground">/ 100</p>
                    </div>

                    <div className="space-y-3">
                      <ScoreBar
                        label="Keyword Match"
                        value={resume.atsReport.keywordMatch}
                      />
                      <ScoreBar
                        label="Readability"
                        value={resume.atsReport.readability}
                      />
                      {resume.atsReport.formattingScore != null && (
                        <ScoreBar
                          label="Formatting"
                          value={resume.atsReport.formattingScore}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {resume.atsReport.matchedKeywords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Matched Keywords
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.atsReport.matchedKeywords.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {resume.atsReport.missingKeywords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Missing Keywords
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.atsReport.missingKeywords.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {resume.atsReport.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {resume.atsReport.suggestions.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* AI Analysis Section */}
            {resume.aiFeedback?.overallRating != null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-5xl font-bold text-primary">
                        {resume.aiFeedback.overallRating}
                      </div>
                      <p className="text-sm text-muted-foreground">/ 100</p>
                    </div>

                    {resume.aiFeedback.summary && (
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {resume.aiFeedback.summary}
                      </p>
                    )}

                    {resume.aiFeedback.strengths.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {resume.aiFeedback.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-2">
                              <span className="text-green-500 mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {resume.aiFeedback.improvements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          Improvements
                        </h4>
                        <ul className="space-y-1">
                          {resume.aiFeedback.improvements.map((imp, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-2">
                              <span className="text-amber-500 mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {resume.aiFeedback.skillGaps.recommendedSkills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          Recommended Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {resume.aiFeedback.skillGaps.recommendedSkills.map((skill) => (
                            <span key={skill} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {resume.aiFeedback.skillGaps.marketDemandSkills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          In-Demand Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {resume.aiFeedback.skillGaps.marketDemandSkills.map((skill) => (
                            <span key={skill} className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {resume.aiFeedback.careerAdvice && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <Briefcase className="h-4 w-4 text-indigo-600" />
                          Career Advice
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                          {resume.aiFeedback.careerAdvice}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {resume.aiFeedback.bulletPoints.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Bullet Point Improvements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {resume.aiFeedback.bulletPoints.map((bp, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Original:</p>
                            <p className="text-sm text-muted-foreground">{bp.original}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-1">Improved:</p>
                            <p className="text-sm text-green-700">{bp.improved}</p>
                          </div>
                          <p className="text-xs text-muted-foreground italic">{bp.reasoning}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {resume.aiFeedback.grammarIssues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Grammar & Style Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {resume.aiFeedback.grammarIssues.map((issue, i) => (
                        <div key={i} className="p-2 rounded bg-red-50 border border-red-100">
                          <p className="text-xs text-red-800 mb-1">{issue.text}</p>
                          <p className="text-xs text-red-600 italic">{issue.suggestion}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {error && (
              <Card className="border-destructive">
                <CardContent className="py-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
