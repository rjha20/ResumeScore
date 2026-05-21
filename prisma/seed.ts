import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@airesume.com" },
    update: {},
    create: {
      clerkId: "demo_clerk_id",
      email: "demo@airesume.com",
      name: "John Doe",
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // Create sample resume with parsed JSON data
  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      title: "Software Engineering Resume",
      fileName: "software-engineer-resume.pdf",
      fileUrl: "https://utfs.io/f/demo-resume-1.pdf",
      fileType: "pdf",
      fileSize: 245760,
      rawText: `John Doe - Software Engineer with 5+ years experience`,
      parsedData: {
        name: "John Doe",
        email: "john.doe@email.com",
        phone: "(555) 123-4567",
        skills: ["TypeScript", "React", "Node.js", "AWS", "Docker", "PostgreSQL"],
      },
    },
  });
  console.log(`✅ Created resume: ${resume.title}`);

  // Create analysis
  const analysis = await prisma.analysis.create({
    data: {
      resumeId: resume.id,
      userId: user.id,
      jobDescription: "Senior Software Engineer role needing TypeScript, React, Node.js, AWS",
      status: "completed",
      type: "full",
      durationMs: 3450,
    },
  });
  console.log(`✅ Created analysis: ${analysis.id}`);

  // Create ATS report
  const atsReport = await prisma.atsReport.create({
    data: {
      analysisId: analysis.id,
      score: 82,
      keywordMatch: 78,
      readability: 85,
      formattingScore: 80,
      matchedKeywords: ["TypeScript", "React", "Node.js", "AWS", "Docker"],
      missingKeywords: ["NoSQL", "DevOps", "GraphQL"],
      formatting: {
        hasBulletPoints: true,
        hasSections: true,
        properLength: true,
        hasContactInfo: true,
        fileType: "pdf",
        issues: ["Missing LinkedIn URL"],
      },
      sectionScore: {
        experience: 88,
        education: 75,
        skills: 82,
        projects: 70,
      },
      suggestions: [
        "Add a professional summary",
        "Include more quantifiable achievements",
      ],
    },
  });
  console.log(`✅ Created ATS report (score: ${atsReport.score})`);

  // Create AI feedback
  const aiFeedback = await prisma.aiFeedback.create({
    data: {
      analysisId: analysis.id,
      overallRating: 4,
      summary: "Strong resume with good ATS compatibility.",
      careerAdvice: "Well-positioned for Senior Engineer roles.",
      modelUsed: "gpt-4",
      tokensUsed: 2450,
      strengths: ["Strong full-stack skills", "Leadership experience"],
      weaknesses: ["Missing professional summary"],
      improvements: ["Add compelling summary", "Use stronger action verbs"],
      bulletPoints: [
        { original: "Led development", improved: "Architected platform serving 1M+ users", reasoning: "Adds impact" },
      ],
      skillGaps: {
        currentSkills: ["TypeScript", "React", "Node.js"],
        recommendedSkills: ["GraphQL", "Terraform"],
        marketDemandSkills: ["AI/ML", "Serverless"],
        courses: ["AWS Advanced Architecture"],
      },
    },
  });
  console.log(`✅ Created AI feedback (rating: ${aiFeedback.overallRating}/5)`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });