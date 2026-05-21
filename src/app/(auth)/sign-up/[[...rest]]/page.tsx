"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard/resume-new";
  }

  return value;
}

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    router.replace(getSafeRedirect(searchParams.get("redirect_url")));
  }, [isLoaded, isSignedIn, router, searchParams]);

  if (isLoaded && isSignedIn) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Opening upload...</h1>
        <p className="mt-2 text-muted-foreground">
          Taking you to your resume upload page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Create Your Account
        </h1>
        <p className="text-muted-foreground">
          Start analyzing your resume with AI
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-lg border border-border w-full",
          },
        }}
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard/resume-new"
      />
    </div>
  );
}
