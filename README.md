# ResumeScore — AI Resume Analyzer

> **Live App:** [https://resume-score-smoky.vercel.app/](https://resume-score-smoky.vercel.app/)

AI-powered resume analysis to help job seekers optimize their resumes for ATS systems and land more interviews.

A full-stack web application that parses PDF/DOCX resumes using AI, scores them against ATS (Applicant Tracking System) standards, and provides actionable feedback. Built with **Next.js 16**, **React 19**, **PostgreSQL (Prisma)**, and a failover chain of LLM providers (**Groq → DeepSeek**).

---

## ✨ Features

- **📄 Resume Upload & Parsing** — Drag-and-drop PDF or DOCX upload via UploadThing. Text is extracted server-side using `pdf-parse` (PDF) or `mammoth` (DOCX), then structured into fields (name, skills, experience, education, projects, certifications) using LLM-powered parsing.

- **📊 ATS Compatibility Scoring** — AI evaluates keyword match, formatting, readability, and section scores against industry standards. Optionally accepts a **job description** for custom scoring. Generates targeted improvement suggestions.

- **🧠 AI-Powered Feedback** — Four parallel analyses per resume:
  - **Resume Review** — Strengths, weaknesses, overall rating (0–100)
  - **Bullet Point Optimization** — Rewrites experience bullets for maximum impact using STAR method
  - **Skill Gap Analysis** — Current skills vs. market demand with course recommendations
  - **Career Suggestions** — Next roles, growth areas, personal branding advice

- **🔍 Grammar & Style Checks** — Rule-based detection of weak phrases ("worked on", "was responsible for"), passive voice, and missing metrics (%, $, users affected).

- **📈 Dashboard** — Aggregate stats (total resumes, analyses, average ATS score, average AI rating), ATS score trend chart, score distribution, and recent analyses list.

- **💳 Billing / Subscriptions** — Free plan (3 analyses/month), Pro/Team/Enterprise plans with usage-based tracking via Stripe.

- **🌗 Dark / Light Theme** — Theme toggle with localStorage persistence.

- **🔐 Secure Authentication** — Clerk integration with webhook-based user sync.

---

## 🏗️ Architecture

```
Browser (Next.js App Router — Client Components)
       │
       ├── Server Actions ─── Parse, analyze, billing, dashboard stats
       ├── API Routes ──────── UploadThing, webhooks, Stripe subscriptions
       └── Static Pages ────── Landing, features, pricing, about, contact
              │
              ▼
         Service Layer (src/lib/)
       ┌────────────┬────────────┬────────────────┐
       │ Resume     │ ATS        │ AI Analysis     │
       │ Parser     │ Engine     │ (Review,        │
       │ (pdf-parse,│ (LLM +     │  Bullets,       │
       │  mammoth)  │  prompt)   │  Skill Gaps,    │
       │            │            │  Career)        │
       └─────┬──────┴──────┬────┴──────┬──────────┘
             │             │           │
             ▼             ▼           ▼
       ┌──────────────────────────────────────────┐
       │         PostgreSQL (Prisma ORM)          │
       │  User · Resume · Analysis · AtsReport   │
       │  AiFeedback · Subscription · UsageRecord │
       │  WebhookEvent                            │
       └──────────────────────────────────────────┘
             │             │           │
             ▼             ▼           ▼
       External:      External:    External:
       UploadThing    Clerk        Groq / DeepSeek
       (file store)   (auth)       (LLM APIs)
                                    Stripe
                                    (subscriptions)
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS v4, shadcn/ui (Radix UI primitives), framer-motion |
| **State Management** | Zustand (client state), @tanstack/react-query (server state) |
| **Charts** | Recharts |
| **Database** | PostgreSQL 15+ via Prisma 6 ORM |
| **Authentication** | Clerk (Next.js SDK v7) with Svix webhook verification |
| **File Upload** | UploadThing v7 |
| **AI / LLM** | Groq (`llama-3.3-70b-versatile`) → DeepSeek (`deepseek-chat`) failover chain |
| **File Parsing** | `pdf-parse` (PDF), `mammoth` (DOCX) |
| **Payments** | Stripe (subscriptions via checkout sessions + webhooks) |
| **Validation** | Zod 4 |
| **Logging** | Structured in-memory logger with typed event enums |
| **Icons** | lucide-react |
| **Dates** | date-fns v4 |

---

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm
- API keys for: **Clerk**, **UploadThing**, **Groq** (or **DeepSeek**), **Stripe** (optional for subscriptions)

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

# ─── Stripe (optional — needed for subscriptions) ─────────
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_TEAM_MONTHLY_PRICE_ID=price_...
STRIPE_TEAM_YEARLY_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── Clerk Webhook (optional — needed for user sync) ─────
CLERK_WEBHOOK_SECRET=whsec_...

# ─── App Configuration ───────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** Values must be pasted **without** surrounding quotes.

### 3. Database Setup

```bash
npm run db:generate     # Generate Prisma client
npm run db:push         # Sync schema with database (dev only)
npm run db:seed         # Seed sample data (optional - creates demo user + resume)
```

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
ai-resume-analyzer/
├── prisma/
│   ├── schema.prisma          # 8 models: User, Resume, Analysis, AtsReport,
│   │                          #   AiFeedback, Subscription, UsageRecord, WebhookEvent
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/            # Sign-in / Sign-up pages (Clerk UI components)
│   │   ├── about/             # About page
│   │   ├── api/
│   │   │   ├── billing/       # Stripe checkout session creation
│   │   │   ├── resume/        # Resume CRUD endpoints
│   │   │   ├── uploadthing/   # UploadThing route handler + file router config
│   │   │   └── webhooks/      # Clerk (Svix) + Stripe webhooks
│   │   ├── contact/           # Contact page
│   │   ├── dashboard/
│   │   │   └── resume/[id]/   # Individual resume analysis detail view
│   │   ├── features/          # Features overview page
│   │   ├── pricing/           # Pricing plans with Stripe checkout button
│   │   ├── layout.tsx         # Root layout: ClerkProvider, Navbar, Footer, Providers
│   │   ├── page.tsx           # Landing page (hero, features, testimonials, FAQ, CTA)
│   │   └── globals.css        # Tailwind v4 + CSS custom properties
│   ├── actions/               # Server Actions (backend logic)
│   │   ├── parse-resume.ts    # Upload → download → extract → AI parse → save pipeline
│   │   ├── analyze-ai.ts      # 4 parallel AI analyses (review, bullets, skill gaps, career)
│   │   ├── analyze-ats.ts     # ATS scoring against job description (optional)
│   │   ├── billing.ts         # Fetch current billing summary
│   │   ├── get-dashboard-stats.ts  # Dashboard stats + ATS trend + resume list
│   │   └── verify-checkout.ts # Verify Stripe checkout session after payment
│   ├── components/
│   │   ├── billing/           # Stripe checkout button
│   │   ├── dashboard/         # Stats cards, ATS chart, resume history, billing card
│   │   ├── layout/            # Navbar (responsive), Footer
│   │   ├── resume/            # Resume-related components
│   │   ├── ui/                # shadcn/ui primitives (Button, Card, Input)
│   │   ├── upload/            # Drag-and-drop file upload with progress
│   │   └── providers.tsx      # ThemeProvider (dark/light mode)
│   ├── features/              # Feature-specific logic & sub-components
│   │   ├── ai/                # AI analysis results display
│   │   ├── analytics/         # Analytics/charts components
│   │   ├── ats/               # ATS report display
│   │   ├── auth/              # Auth-related components
│   │   ├── billing/           # Billing/subscription UI
│   │   ├── dashboard/         # Dashboard feature components
│   │   └── resumes/           # Resume list & management
│   ├── hooks/                 # Custom React hooks
│   │   └── index.ts           # Exports: useDebounce, useMounted, useStableCallback
│   ├── lib/
│   │   ├── ai-parser.ts       # Resume raw text → structured ParsedResume JSON (LLM)
│   │   ├── ai-analyzer.ts     # Full AI analysis (4 parallel LLM calls + grammar checks)
│   │   ├── ai-cache.ts        # In-memory cache with configurable TTL + LRU eviction
│   │   ├── ats-analyzer.ts    # ATS scoring via LLM (with optional job description)
│   │   ├── auth.ts            # Clerk auth helpers + DB user sync (upsert)
│   │   ├── billing.ts         # Plan limits, usage tracking, quota assertions
│   │   ├── errors.ts          # Typed error hierarchy (AppError, AuthError, etc.)
│   │   ├── logger.ts          # Structured event logging with typed enums
│   │   ├── prisma.ts          # Singleton Prisma client with connection pooling config
│   │   ├── rate-limiter.ts    # In-memory sliding window rate limiter per scope+key
│   │   ├── resume-parser.ts   # PDF (pdf-parse) + DOCX (mammoth) text extraction
│   │   ├── security.ts        # Input sanitization, XSS prevention, file validation
│   │   ├── stripe.ts          # Stripe client + price ID helpers
│   │   └── utils.ts           # cn(), formatDate(), score colors, etc.
│   ├── proxy.ts               # Clerk middleware — protects routes, redirects to sign-in
│   ├── schemas/               # Zod validation schemas for all inputs
│   ├── store/                 # Zustand stores (theme, upload progress, analysis state)
│   └── types/                 # TypeScript interfaces + module declarations (pdf-parse)
├── next.config.ts             # Image domains, server actions body limit (10MB)
├── tsconfig.json
├── components.json            # shadcn/ui configuration
└── .env                       # Local env vars (never committed)
```

---

## 🔄 Data Flow

### Resume Analysis Pipeline

```
1. UPLOAD
   User drops file → UploadThing client uploads to cloud storage
   (PDF or DOCX, max 10MB, validated client-side + server-side)

2. DOWNLOAD
   Server Action (parse-resume.ts) downloads file from UploadThing URL into a Buffer

3. EXTRACT
   PDF  → pdf-parse (extracts text + page count)
   DOCX → mammoth (extracts raw text from .docx XML)
   Produces: clean raw text

4. AI PARSE
   LLM (Groq → DeepSeek fallback) extracts structured data:
   name, email, phone, skills[], experience[], education[],
   projects[], certifications[]

5. SAVE
   Resume record created in PostgreSQL with rawText + parsedData (JSON)

6. ANALYZE (separate action, triggered from dashboard)
   ┌─ ATS Analysis:     LLM scores keyword match, formatting, readability,
   │                    section scores + improvement suggestions
   ├─ AI Review:        LLM evaluates strengths, weaknesses, overall rating
   ├─ Bullet Points:    LLM rewrites experience bullets for impact (STAR method)
   ├─ Skill Gaps:       LLM identifies market demand gaps + course recommendations
   └─ Career:           LLM suggests next roles, growth areas, personal branding

7. DISPLAY
   Dashboard shows scores, charts, trend lines, and detailed feedback
   Users can view individual analysis reports with full breakdowns
```

### Authentication Flow

```
1. Clerk middleware (src/proxy.ts) protects all routes except public ones
2. Sign-in / Sign-up via Clerk's prebuilt UI components
3. Webhook (Svix-verified) syncs Clerk user → local DB on create/update/delete
4. Server actions call requireAuth() which:
   a. Reads Clerk auth from request context
   b. Upserts user into local DB (email, name, imageUrl)
   c. Returns the DB user record for row-level access control
```

### Subscription/Billing Flow

```
1. User selects a plan on the /pricing page
2. Client-side button creates a Stripe Checkout Session via API route
3. User completes payment on Stripe's hosted checkout page
4. Stripe redirects back to app with session_id
5. verify-checkout.ts server action retrieves session + subscription details
6. Subscription record upserted in local DB (plan, status, period dates)
7. Stripe webhooks handle recurring charges, cancellations, payment failures
8. Usage tracking: UsageRecord table tracks monthly usage per user
9. assertUsageAvailable() checks quota before executing paid actions
```

---

## 🧠 AI Integration

### Provider Chain (Failover)

| Priority | Provider | Model | Env Variable |
|---|---|---|---|
| 1st | **Groq** | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| 2nd | **DeepSeek** | `deepseek-chat` | `DEEPSEEK_API_KEY` |

All LLM calls use a shared **OpenAI-compatible client** (`openai` npm package). If the primary provider fails (missing key, API error, empty response), the system automatically retries with the fallback. If all providers fail, a detailed error is thrown listing every failure.

**Used in four modules:**

| Module | Purpose | Calls |
|---|---|---|
| `lib/ai-parser.ts` | Resume raw text → structured JSON | 1 LLM call |
| `lib/ai-analyzer.ts` | Full AI analysis (review, bullets, skill gaps, career) | 4 parallel LLM calls |
| `lib/ats-analyzer.ts` | ATS scoring + suggestions | 1 LLM call |
| `lib/ai-analyzer.ts` | Grammar/style extraction | Rule-based (no LLM) |

### Caching (`lib/ai-cache.ts`)

- **In-memory** `Map<string, CacheEntry>` with configurable TTLs
  - AI Analysis: 24 hours
  - ATS Analysis: 24 hours
  - Resume Parsing: 7 days
  - Errors: 1 hour
- **Cache key** = MD5 hash of resume text (first 5000 chars for speed)
- **Eviction**: LRU-style — entries sorted by hit count, lowest dropped when >200 entries
- **Cleanup**: Runs every 5 minutes, removes expired entries
- **API**: `withCache(key, fn, ttl)` — check cache first, execute on miss, store result

---

## 🗄️ Database Schema (8 Models)

| Model | Purpose | Key Fields |
|---|---|---|
| **User** | Synced from Clerk | clerkId, email, name, imageUrl |
| **Resume** | Uploaded resume files | title, fileUrl, fileType, parsedData (JSON), rawText |
| **Analysis** | Analysis execution record | type (full/ats_only/ai_only), status, durationMs |
| **AtsReport** | ATS compatibility report | score, keywordMatch, matchedKeywords, readability, suggestions |
| **AiFeedback** | AI analysis results | overallRating, strengths, weaknesses, bulletPoints, skillGaps |
| **Subscription** | Stripe subscription sync | plan, status, stripeSubscriptionId, period dates |
| **UsageRecord** | Monthly usage tracking | kind (resume_upload/ai_generation), count, period |
| **WebhookEvent** | Idempotent webhook processing | provider, eventId (unique), eventType, payload |

---

## 🔐 Security

- **Authentication** — Clerk middleware protects all non-public routes
- **Row-Level Access** — All DB queries filtered by authenticated user ID
- **Input Validation** — Zod schemas validate every server action input
- **Input Sanitization** — HTML tag stripping, XSS prevention on filenames, titles, and text
- **File Validation** — MIME type + extension + size checks on both client and server
- **Rate Limiting** — In-memory sliding window per user:

  | Scope | Limit | Window |
  |---|---|---|
  | AI Analysis | 5 | 1 hour |
  | ATS Analysis | 10 | 1 hour |
  | Resume Upload | 5 | 1 hour |
  | General API | 60 | 1 minute |
  | Auth Operations | 10 | 1 minute |

- **Webhook Verification** — Svix (Clerk) + Stripe webhook signatures
- **Environment Variables** — All secrets in `.env`, never committed

---

## 💳 Billing & Subscriptions

| Plan | Resume Uploads / month | AI Generations / month | Price |
|---|---|---|---|
| **Free** | 3 | 3 | $0 |
| **Pro** | 50 | 100 | Stripe subscription |
| **Team** | 200 | 500 | Stripe subscription |
| **Enterprise** | 1000 | 5000 | Custom |

Usage is tracked per **calendar month** via the `UsageRecord` table.

- **`assertUsageAvailable()`** — Checks remaining quota before executing an action
- **`recordUsage()`** — Increments usage counter after successful action
- **`getBillingSummary()`** — Returns plan, limits, usage, and remaining counts

Pro/Team subscriptions managed through **Stripe**:
1. Client sends request to `/api/billing/create-checkout` → creates Stripe Checkout Session
2. User completes payment on Stripe's hosted page
3. Success redirect → `verify-checkout.ts` syncs subscription to local DB
4. Stripe webhooks handle recurring events (idempotent via `WebhookEvent` table)

---

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run typecheck        # TypeScript type checking (tsc --noEmit)
npm run format           # Format code with Prettier

# Database
npm run db:generate      # Generate Prisma client from schema
npm run db:push          # Push schema to database (dev)
npm run db:migrate       # Create and run a new migration
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed sample data (demo user + resume)

# Production
npm run build            # Build for production
npm run start            # Start production server
```

---

## 🌐 Deployment (Vercel)

The app is deployed on Vercel at: [https://resume-score-smoky.vercel.app/](https://resume-score-smoky.vercel.app/)

To deploy your own instance:

1. Push the repo to GitHub
2. Connect your repository to Vercel
3. Add all environment variables from `.env` (values **without** quotes) in Vercel's dashboard
4. Deploy — Vercel handles the build and hosting automatically

**Important:** Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g., `https://your-app.vercel.app`).

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📝 License

MIT License — see the LICENSE file for details.

---

## 👤 Author

**Rohan Jha**

- GitHub: [@rjha20](https://github.com/rjha20)
- LinkedIn: [rohan-jha-12556b257](https://www.linkedin.com/in/rohan-jha-12556b257/)
- Live App: [https://resume-score-smoky.vercel.app/](https://resume-score-smoky.vercel.app/)