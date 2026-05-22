# ResumeScore — AI Resume Analyzer

> AI-powered resume analysis to help job seekers optimize their resumes for ATS systems and land more interviews.

A full-stack web application that parses PDF/DOCX resumes using AI, scores them against ATS (Applicant Tracking System) standards, and provides actionable feedback. Built with Next.js 16, React 19, PostgreSQL (Prisma), and a failover chain of LLM providers (Groq → DeepSeek).

---

## ✨ Features

- **Resume Upload & Parsing** — Drag-and-drop PDF or DOCX upload via UploadThing. Text is extracted server-side and structured into fields (name, skills, experience, education, projects, certifications) using LLM-powered parsing.
- **ATS Compatibility Scoring** — AI evaluates keyword match, formatting, readability, section scores, and generates targeted improvement suggestions. Optionally accepts a job description for custom scoring.
- **AI-Powered Feedback** — Four parallel analyses per resume:
  - **Resume Review** — Strengths, weaknesses, overall rating (0–100)
  - **Bullet Point Optimization** — Rewrites experience bullets for impact
  - **Skill Gap Analysis** — Current skills vs. market demand + course recommendations
  - **Career Suggestions** — Next roles, growth areas, personal branding
- **Grammar & Style Checks** — Rule-based detection of weak phrases, passive voice, and missing metrics.
- **Dashboard** — Aggregate stats (total resumes, analyses, average ATS score, average AI rating), ATS score trend chart, score distribution pie chart, and recent analyses list.
- **Billing / Subscriptions** — Free plan (3 analyses/month), Pro plan (unlimited via Razorpay subscriptions), Enterprise tier. Usage tracked monthly per user.
- **Dark / Light Theme** — Custom theme context with localStorage persistence.
- **Secure Authentication** — Clerk integration with webhook-based user sync.

---

## 🏗️ Architecture

```
Browser (Next.js App Router client components)
       │
       ├── Server Actions ──── Parse, analyze, bill
       ├── API Routes ──────── UploadThing, webhooks, subscriptions
       └── Static Pages ────── Landing, features, pricing, about
              │
              ▼
         Service Layer
       ┌────────────┬────────────┬──────────────┐
       │ Resume     │ ATS        │ AI Analysis   │
       │ Parser     │ Engine     │ (Groq/DpS)    │
       │ (pdf-parse,│ (LLM)      │               │
       │  mammoth)  │            │               │
       └─────┬──────┴──────┬────┴──────┬────────┘
             │             │           │
             ▼             ▼           ▼
       ┌─────────────────────────────────────┐
       │       PostgreSQL (Prisma ORM)       │
       │  User · Resume · Analysis · ATS     │
       │  AI Feedback · Subscription · Usage │
       └─────────────────────────────────────┘
             │             │           │
             ▼             ▼           ▼
       External:      External:    External:
       UploadThing    Clerk        Groq / DeepSeek
       (file store)   (auth)       (LLM APIs)
                                   Razorpay
                                   (subscriptions)
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS v4, shadcn/ui (Radix primitives), framer-motion |
| **State** | Zustand, @tanstack/react-query |
| **Charts** | Recharts |
| **Database** | PostgreSQL 15+, Prisma 6 ORM |
| **Auth** | Clerk (Next.js SDK v7) with Svix webhook verification |
| **File Upload** | UploadThing v7 |
| **AI / LLM** | Groq (`llama-3.3-70b-versatile`) → DeepSeek (`deepseek-chat`) failover chain |
| **File Parsing** | pdf-parse v1 (PDF), mammoth (DOCX) |
| **Payments** | Razorpay (subscriptions) with HMAC-SHA256 webhook verification |
| **Validation** | Zod 4 |
| **Logging** | Structured in-memory logger with typed event enums |
| **Icons** | lucide-react |
| **Dates** | date-fns v4 |

---

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm
- API keys for: Clerk, UploadThing, Groq (or DeepSeek), Razorpay (optional)

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/rjha20/ai-resume-analyzer.git
cd ai-resume-analyzer
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# ─── Database ─────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/ai_resume"

# ─── Clerk Authentication ─────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ─── UploadThing ───────────────────────────────────────────
UPLOADTHING_TOKEN=eyJ...   # From dashboard → API Keys → v7 tab

# ─── AI Providers (at least one required) ──────────────────
GROQ_API_KEY=gsk_...
DEEPSEEK_API_KEY=sk_...

# ─── Razorpay (optional — needed for subscriptions) ───────
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_...
RAZORPAY_WEBHOOK_SECRET=...

# ─── Clerk Webhook (optional — needed for user sync) ─────
CLERK_WEBHOOK_SECRET=whsec_...

# ─── App Configuration ───────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Values must be pasted **without** surrounding quotes.

### 3. Database Setup

```bash
npm run db:generate     # Generate Prisma client
npm run db:push         # Sync schema with database
npm run db:seed         # Seed sample data (optional)
```

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
ai-resume-analyzer/
├── prisma/
│   ├── schema.prisma          # 7 models (User, Resume, Analysis, AtsReport,
│   │                          #   AiFeedback, Subscription, UsageRecord, WebhookEvent)
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/            # Sign-in / sign-up (Clerk components)
│   │   ├── about/
│   │   ├── api/
│   │   │   ├── billing/subscription/
│   │   │   ├── resume/[id]/
│   │   │   ├── uploadthing/   # UploadThing route handler + file router
│   │   │   └── webhooks/      # Clerk (Svix) + Razorpay (HMAC)
│   │   ├── contact/
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Stats, charts, resume history
│   │   │   ├── resume-new/    # Upload page
│   │   │   └── resume/[id]/   # Single analysis detail
│   │   ├── features/
│   │   ├── layout.tsx         # Root: ClerkProvider, Navbar, Footer
│   │   ├── page.tsx           # Landing page
│   │   ├── pricing/           # Plans + Razorpay checkout
│   │   └── globals.css        # Tailwind v4 + CSS custom properties
│   ├── actions/               # Server Actions
│   │   ├── parse-resume.ts    # Upload → parse → store pipeline
│   │   ├── analyze-ai.ts      # 4 parallel AI analyses
│   │   ├── analyze-ats.ts     # ATS scoring
│   │   ├── billing.ts         # Billing summary
│   │   └── get-dashboard-stats.ts
│   ├── components/
│   │   ├── billing/           # Razorpay checkout button
│   │   ├── dashboard/         # Charts, stats cards, history list
│   │   ├── layout/            # Navbar, Footer
│   │   ├── providers.tsx      # Custom ThemeProvider (dark/light)
│   │   ├── ui/                # shadcn/ui primitives (button, card, input)
│   │   └── upload/            # Drag-and-drop upload with progress
│   ├── hooks/                 # useDebounce, useMounted, useStableCallback
│   ├── lib/
│   │   ├── ai-parser.ts       # Resume text → structured JSON (LLM)
│   │   ├── ai-analyzer.ts     # Full AI analysis (4 parallel LLM calls)
│   │   ├── ai-cache.ts        # In-memory cache with TTL + LRU eviction
│   │   ├── ats-analyzer.ts    # ATS scoring via LLM
│   │   ├── auth.ts            # Clerk auth helpers + DB user sync
│   │   ├── billing.ts         # Plan limits, usage tracking
│   │   ├── errors.ts          # Typed error hierarchy
│   │   ├── logger.ts          # Structured event logging
│   │   ├── prisma.ts          # Singleton Prisma client (pooling config)
│   │   ├── rate-limiter.ts    # In-memory sliding window rate limiter
│   │   ├── razorpay.ts        # Razorpay subscription API wrapper
│   │   ├── resume-parser.ts   # PDF (pdf-parse) + DOCX (mammoth) extraction
│   │   ├── security.ts        # Input sanitization, file validation
│   │   └── utils.ts           # cn(), formatDate(), score colors, etc.
│   ├── proxy.ts               # Clerk middleware (route protection)
│   ├── schemas/               # Zod validation schemas
│   ├── store/                 # Zustand stores (theme, upload, analysis)
│   └── types/                 # TypeScript interfaces + module declarations
├── next.config.ts             # Images, server actions body limit
├── tsconfig.json
└── .env                       # Local env vars (not in repo)
```

---

## 🔄 Data Flow

### Resume Analysis Pipeline

```
1. UPLOAD
   User drops file → UploadThing client uploads to cloud storage
   (PDF or DOCX, max 8 MB, validated client-side)

2. DOWNLOAD
   Server Action downloads file from UploadThing URL into a Buffer

3. EXTRACT
   PDF → pdf-parse (v1, bundles pdfjs-dist internally, no worker)
   DOCX → mammoth
   Produces: raw text

4. AI PARSE
   LLM (Groq → DeepSeek fallback) extracts structured data:
   name, email, phone, skills, experience, education, projects, certifications

5. SAVE
   Resume record created in PostgreSQL with raw text + parsed JSON

6. ANALYZE (optional, separate action)
   ┌─ ATS Analysis: LLM scores keyword match, formatting, readability,
   │                section scores + suggestions
   ├─ AI Review:    LLM evaluates strengths, weaknesses, overall rating
   ├─ Bullet Points: LLM rewrites experience bullets for impact
   ├─ Skill Gaps:   LLM identifies market demand gaps + course recommendations
   └─ Career:       LLM suggests next roles and growth areas

7. DISPLAY
   Dashboard shows scores, charts, trend lines, and detailed feedback
```

### Authentication Flow

```
1. Clerk middleware protects all routes except public ones
2. Sign-in/sign-up via Clerk's prebuilt components
3. Webhook (Svix-verified) syncs Clerk user → local DB on create/update/delete
4. Server actions call requireAuth() which:
   a. Reads Clerk auth from request context
   b. Upserts user into local DB (email, name, image)
   c. Returns the DB user record
```

---

## 🧠 AI Integration

### Provider Chain

| Priority | Provider | Model | Env Variable |
|---|---|---|---|
| 1st | **Groq** | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| 2nd | **DeepSeek** | `deepseek-chat` | `DEEPSEEK_API_KEY` |

All LLM calls use a shared OpenAI-compatible client. If the primary provider fails (missing key, API error, empty response), the system automatically retries with the fallback. If all providers fail, a detailed error is thrown listing every failure.

**Used in three modules:**
- **`ai-parser.ts`** — Single LLM call to structure raw text → `ParsedResume` JSON
- **`ai-analyzer.ts`** — 4 parallel LLM calls (review, bullets, skill gaps, career). Results cached in memory (MD5 key, configurable TTL, LRU eviction at 200 entries)
- **`ats-analyzer.ts`** — Single LLM call for ATS scoring + suggestions

### Caching (`lib/ai-cache.ts`)

- In-memory `Map` with configurable TTLs: 24h (analysis), 7d (parsing), 1h (errors)
- Cache key = MD5 hash of resume text (first 5000 chars)
- LRU-style eviction: entries sorted by hit count, lowest dropped when >200 entries
- Cleanup interval: every 5 minutes

---

## 🔐 Security

- **Authentication** — Clerk middleware protects all non-public routes
- **Row-Level Access** — All DB queries filtered by authenticated user ID
- **Input Validation** — Zod schemas validate every server action input
- **Input Sanitization** — HTML tag stripping, XSS prevention on file names and titles
- **File Validation** — MIME type + extension + size checks on both client and server
- **Rate Limiting** — In-memory sliding window per user:
  | Scope | Limit | Window |
  |---|---|---|
  | AI Analysis | 5 | 1 hour |
  | ATS Analysis | 10 | 1 hour |
  | Resume Upload | 5 | 1 hour |
- **Webhook Verification** — Svix (Clerk) + HMAC-SHA256 (Razorpay)
- **Environment Variables** — All secrets in `.env`, never committed

---

## 💳 Billing & Subscriptions

| Plan | Resume Uploads | AI Generations | Price |
|---|---|---|---|
| **Free** | 3 / month | 3 / month | $0 |
| **Pro** | 50 / month | 100 / month | Via Razorpay |
| **Enterprise** | 1000 / month | 5000 / month | Custom |

Usage is tracked per calendar month via the `UsageRecord` table. `assertUsageAvailable()` checks quota before executing an action; `recordUsage()` increments after success.

Pro subscriptions are managed through **Razorpay** — the client-side checkout button loads Razorpay's JS SDK, creates a subscription via a server API route, and redirects to Razorpay's checkout. Webhooks handle `subscription.charged`, `cancelled`, `completed`, and `payment.failed` events (idempotent via `WebhookEvent` table).

---

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Create a migration
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed sample data

# Production
npm run build            # Build for production
npm run start            # Start production server
```

---

## 🌐 Deployment (Vercel)

1. Push the repo to GitHub
2. Connect to Vercel
3. Add all environment variables from `.env` (values **without** quotes) in Vercel's dashboard
4. Deploy — Vercel handles the rest

**Important:** Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g., `https://your-app.vercel.app`).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📝 License

MIT License — see LICENSE file for details.

## 👤 Author

**Rohan Jha**

- GitHub: [@rjha20](https://github.com/rjha20)
- LinkedIn: [rohan-jha-12556b257](https://www.linkedin.com/in/rohan-jha-12556b257/)
