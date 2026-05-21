"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers";
import { cn } from "@/lib/utils";
import { Menu, X, Upload, Sun, Moon } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-4xl font-semibold text-foreground">Resume</span>
            <span className="text-4xl font-semibold text-primary">Score</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded text-sm transition-colors duration-150",
                  pathname === link.href
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {isSignedIn ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/resume-new">
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-7 w-7",
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="px-5 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-3 py-2 rounded text-sm transition-colors duration-150",
                    pathname === link.href
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 space-y-2">
                {isSignedIn ? (
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href="/dashboard/resume-new">
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <UserButton
                      appearance={{
                        elements: { avatarBox: "h-7 w-7" },
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/sign-in">Sign in</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/sign-up">Get started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
