"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  FileText,
  BarChart3,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "ATS Score Analysis",
    description: "Get a precise compatibility score with detailed breakdown across keyword match, formatting, and readability.",
  },
  {
    icon: FileText,
    title: "Resume Parsing",
    description: "Extract and structure all resume data automatically from PDF and DOCX files.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Feedback",
    description: "Receive actionable suggestions to improve bullet points, fill skill gaps, and strengthen your profile.",
  },
];

const faqs = [
  {
    q: "How does the ATS scoring work?",
    a: "Our engine analyzes your resume against industry standards and job descriptions, scoring keyword relevance, formatting quality, section completeness, and readability.",
  },
  {
    q: "What file formats are supported?",
    a: "We support both PDF and DOCX file formats. Files must be under 10MB.",
  },
  {
    q: "Is my data secure?",
    a: "All resumes are encrypted at rest and in transit. Your data is never shared with third parties and can be deleted at any time.",
  },
  {
    q: "Can I analyze multiple resumes?",
    a: "Yes. Free users get 3 analyses per month. Pro users get unlimited analyses with advanced insights.",
  },
];

export default function HomePage() {
  const { isSignedIn } = useAuth();
  const analysisHref = isSignedIn
    ? "/dashboard/resume-new"
    : "/sign-up?redirect_url=%2Fdashboard%2Fresume-new";

  return (
    <div>
      {/* ── Hero ── */}
      <section className="pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground mb-6">
              <Sparkles className="w-3 h-3" />
              AI-Powered Resume Analysis
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] text-balance">
              Optimize your resume for every application
            </h1>
            <p className="mt-4 text-base text-muted-foreground max-w-lg text-balance leading-relaxed">
              Upload your resume, get an ATS compatibility score, and receive AI-driven feedback to land more interviews.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Button asChild size="xl">
                <Link href={analysisHref}>
                  Analyze your resume
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/features">
                  See how it works
                </Link>
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-muted/30">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">resumescore.app/dashboard</span>
            </div>
            <div className="p-5 grid md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Resume Analysis</p>
                    <p className="text-xs text-muted-foreground">Software Engineer · Google, Meta, Stripe</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-semibold">84</span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Keyword Match", value: 78, color: "bg-blue-500" },
                    { label: "Readability", value: 92, color: "bg-emerald-500" },
                    { label: "Formatting", value: 85, color: "bg-amber-500" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-semibold mt-0.5">{item.value}%</p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs font-medium mb-2">Matched Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["React", "TypeScript", "Node.js", "System Design", "AWS", "CI/CD", "REST APIs", "PostgreSQL"].map((kw) => (
                      <span key={kw} className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs font-medium mb-2">Missing Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["GraphQL", "Docker", "Kubernetes", "Microservices", "Redis"].map((kw) => (
                      <span key={kw} className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs font-medium mb-2">Suggestions</p>
                  <ul className="space-y-1.5">
                    {[
                      "Add metrics to achievements",
                      "Include Docker experience",
                      "Quantify system impact",
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs font-medium mb-2">Skill Gap</p>
                  <p className="text-xs text-muted-foreground">Market demand suggests adding GraphQL and Docker experience to stay competitive.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight">Everything you need to optimize your resume</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              From parsing to analysis, get a complete picture of how recruiters and ATS systems see your resume.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-shadow duration-150 hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center mb-3">
                    <feature.icon className="w-4 h-4 text-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats / Trust Bar ── */}
      <section className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50K+", label: "Resumes analyzed" },
              { value: "92%", label: "Average ATS score" },
              { value: "3.2x", label: "More interview callbacks" },
              { value: "4.9", label: "Average rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight">Three steps to a better resume</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              From upload to actionable insights in under a minute.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload", desc: "Drag and drop your PDF or DOCX resume. Files are parsed and structured automatically." },
              { step: "02", title: "Analyze", desc: "Our engine scores your resume against ATS standards and job market requirements." },
              { step: "03", title: "Improve", desc: "Get specific recommendations to fix gaps, strengthen language, and increase your score." },
            ].map((item) => (
              <div key={item.step}>
                <p className="text-xs text-muted-foreground font-mono">{item.step}</p>
                <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-2xl font-semibold tracking-tight text-center">Trusted by job seekers</h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            {[
              {
                quote: "My ATS score went from 45 to 92. Started getting interview calls within a week.",
                name: "Sarah Chen",
                role: "Software Engineer at Google",
              },
              {
                quote: "The AI caught grammar issues I'd missed for years and rewrote my bullet points entirely.",
                name: "Marcus Johnson",
                role: "Product Manager at Stripe",
              },
              {
                quote: "Skill gap analysis showed exactly what to learn. Landed my dream role in 2 months.",
                name: "Priya Patel",
                role: "Data Scientist at Meta",
              },
            ].map((t) => (
              <Card key={t.name} className="transition-shadow duration-150 hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-semibold tracking-tight text-center">Frequently asked questions</h2>
            <div className="mt-8 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-lg border border-border">
                  <summary className="flex items-center justify-between p-3.5 text-sm font-medium cursor-pointer list-none">
                    {faq.q}
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-150 group-open:rotate-90" />
                  </summary>
                  <div className="px-3.5 pb-3.5 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to optimize your resume?</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Join thousands of job seekers who land more interviews with data-driven resume optimization.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href={analysisHref}>
                Start free analysis
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
