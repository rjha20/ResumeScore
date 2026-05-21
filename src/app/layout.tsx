import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ResumeScore - AI-Powered Resume Analyzer",
    template: "%s | ResumeScore",
  },
  description:
    "Upload your resume, get ATS compatibility scores, AI-powered feedback, and career insights to land your dream job.",
  keywords: [
    "resume analyzer", "ATS score", "AI resume feedback", "job search",
    "career", "resume optimization", "AI career coach",
  ],
  openGraph: {
    title: "ResumeScore - AI-Powered Resume Analyzer",
    description: "Improve your ATS score and land more interviews with AI-powered resume analysis.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: "#6366f1" },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}
        >
          <Providers>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}