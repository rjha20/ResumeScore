# AI Resume Analyzer

> AI-powered resume analysis to help job seekers optimize their resumes for ATS systems and land more interviews.

A full-stack web application that uses advanced AI models to parse, analyze, and provide actionable feedback on resumes. Get precise ATS compatibility scores, identify missing keywords, and receive personalized career recommendations.

## ✨ Features

- **Resume Parsing** — Extract structured data (name, skills, experience, education, projects) from PDF and DOCX files automatically
- **ATS Score Analysis** — Compatibility scoring against job descriptions with keyword matching and formatting assessment
- **AI-Powered Feedback** — Get actionable suggestions including:
  - Skill gap analysis and market demand recommendations
  - Grammar and wording improvements
  - Better bullet point rewrites using action verbs and metrics
  - Career advancement paths and role recommendations
- **Dashboard** — View analysis history, compare multiple resume scores, and track improvements
- **Real-time Analytics** — Track performance metrics and usage patterns
- **Multi-Provider AI** — Flexible LLM switching between OpenAI, DeepSeek, and Groq for cost optimization
- **Secure File Handling** — Encrypted storage with enterprise-grade file validation
- **Authentication** — Built-in Clerk integration for secure user management

## 🏗️ Architecture

The application follows a modern full-stack architecture:

```
Client (Next.js App Router) 
    ↓
Server Actions & API Routes
    ↓
Service Layer (AI, ATS, Resume Parser, Analytics)
    ↓
PostgreSQL Database + External APIs (OpenAI, DeepSeek, Groq, UploadThing)
```

For a detailed architecture breakdown, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | Next.js Server Actions, API Routes, Node.js |
| **Database** | PostgreSQL 15+, Prisma ORM |
| **Authentication** | Clerk |
| **File Upload** | UploadThing |
| **AI/LLM** | OpenAI GPT-4, DeepSeek, Groq Llama |
| **File Parsing** | pdf-parse, mammoth |
| **State Management** | Zustand |
| **Validation** | Zod |
| **UI Components** | Radix UI, Headless UI |

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn
- API Keys:
  - Clerk (authentication)
  - UploadThing (file storage)
  - OpenAI or DeepSeek or Groq (LLM)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/rjha20/ai-resume-analyzer.git
cd ai-resume-analyzer
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_resume"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# UploadThing
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_id

# AI Providers (choose at least one)
OPENAI_API_KEY=your_openai_key
DEEPSEEK_API_KEY=your_deepseek_key
GROQ_API_KEY=your_groq_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:push

# Seed sample data (optional)
npm run db:seed
```

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
ai-resume-analyzer/
├── docs/                          # Documentation
│   └── ARCHITECTURE.md            # System design & data flow
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Sample data
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API routes & webhooks
│   │   ├── (auth)/                # Authentication pages
│   │   ├── dashboard/             # Protected dashboard
│   │   ├── page.tsx               # Landing page
│   │   └── globals.css            # Global styles
│   ├── components/                # React components
│   │   ├── layout/                # Navigation, footer
│   │   ├── dashboard/             # Dashboard widgets
│   │   ├── resume/                # Resume analysis UI
│   │   ├── ui/                    # Base UI components
│   │   └── upload/                # File upload
│   ├── actions/                   # Server actions
│   │   ├── analyze-ai.ts          # AI analysis
│   │   ├── analyze-ats.ts         # ATS analysis
│   │   ├── parse-resume.ts        # Resume parsing
│   │   └── billing.ts             # Billing operations
│   ├── features/                  # Feature modules
│   │   ├── auth/                  # Authentication logic
│   │   ├── resumes/               # Resume management
│   │   ├── ats/                   # ATS engine
│   │   ├── ai/                    # AI service
│   │   ├── dashboard/             # Dashboard logic
│   │   ├── analytics/             # Analytics
│   │   └── billing/               # Subscription management
│   ├── lib/                       # Utilities & services
│   │   ├── ai-parser.ts           # Resume parsing with AI
│   │   ├── ai-analyzer.ts         # AI feedback engine
│   │   ├── ats-analyzer.ts        # ATS scoring
│   │   ├── auth.ts                # Auth utilities
│   │   ├── prisma.ts              # Prisma client
│   │   ├── logger.ts              # Logging
│   │   └── utils.ts               # Helper functions
│   ├── schemas/                   # Zod validation schemas
│   ├── types/                     # TypeScript types
│   ├── hooks/                     # Custom React hooks
│   └── store/                     # Zustand state management
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.ts
└── .env.local                     # Environment variables (not in repo)
```

## 🔄 Data Flow

### Resume Analysis Workflow

1. **Upload** — User uploads PDF/DOCX via drag-and-drop
2. **Parse** — Resume text extracted using pdf-parse/mammoth
3. **Structure** — AI extracts structured data (name, skills, experience, education)
4. **ATS Analysis** — Engine scores against job description, finds keyword gaps
5. **AI Analysis** — LLM provides feedback on:
   - Overall resume quality
   - Skill improvements
   - Bullet point rewrites
   - Career recommendations
6. **Store** — Results saved to PostgreSQL
7. **Display** — Dashboard shows scores, charts, and suggestions

## 🧠 AI Integration

The app uses a multi-provider strategy for LLM calls:

- **Primary**: OpenAI GPT-4 (most accurate)
- **Fallback 1**: DeepSeek (cost-effective)
- **Fallback 2**: Groq (fast inference)

If one provider fails, the system automatically retries with the next available provider. This ensures reliability and cost optimization.

**Supported AI Features:**
- Resume parsing with structured extraction
- Keyword matching for ATS compatibility
- Grammar and writing quality assessment
- Bullet point optimization with metrics
- Skill gap analysis
- Career path recommendations

## 📊 Database Schema

Key entities:
- **User** → Connected to Clerk authentication
- **Resume** → Uploaded resumes with metadata
- **Analysis** → Results from ATS and AI analysis
- **ATSReport** → Keyword matching, scoring
- **AIAnalysis** → Feedback and suggestions
- **Subscription** → Billing & usage limits
- **UsageTracking** → API call monitoring

See `prisma/schema.prisma` for the complete schema.

## 🔐 Security

- **Row-Level Security** — All queries filtered by authenticated user ID
- **File Validation** — Type and size checks before upload
- **Encrypted Storage** — Files encrypted at rest via UploadThing
- **Rate Limiting** — Per-user API call throttling
- **Input Sanitization** — Zod schemas validate all inputs
- **Environment Variables** — Sensitive keys stored in `.env.local`

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run format          # Format with Prettier
npm run typecheck       # Type-check with TypeScript

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Sync schema with database
npm run db:migrate      # Create migrations
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed sample data

# Production
npm run build           # Build for production
npm run start           # Start production server
```

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Push to GitHub, then connect to Vercel
```

Vercel automatically handles:
- Environment variables
- Automatic deployments on push
- PostgreSQL database hosting via Vercel Storage

### Docker

```bash
docker build -t ai-resume-analyzer .
docker run -p 3000:3000 ai-resume-analyzer
```

### Self-Hosted

1. Deploy Next.js app to VPS/EC2
2. Set up PostgreSQL database
3. Configure environment variables
4. Set up CI/CD pipeline

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## 📝 License

MIT License — see LICENSE file for details.

## 👤 Author

**Rohan Jha**

- GitHub: [@rjha20](https://github.com/rjha20)
- LinkedIn: [rohan-jha-12556b257](https://www.linkedin.com/in/rohan-jha-12556b257/)

## 🆘 Support

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Email**: Contact via the website

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Clerk Documentation](https://clerk.com/docs)
- [UploadThing Documentation](https://docs.uploadthing.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
