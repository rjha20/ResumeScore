import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS class names with conflict resolution.
 * Uses clsx for conditional classes + tailwind-merge to handle conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string or Date object into a readable format.
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", options);
}

/**
 * Format a number as a percentage.
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength = 100): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/**
 * Parse a JSON string safely, returning undefined on failure.
 */
export function safeJsonParse<T>(json: string | null | undefined): T | undefined {
  if (!json) return undefined;
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}

/**
 * Get file extension from filename.
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

/**
 * Check if file type is allowed.
 */
export function isAllowedFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["pdf", "docx"].includes(ext);
}

/**
 * Generate a score color based on value (0-100).
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

/**
 * Generate a score badge variant based on value.
 */
export function getScoreVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}