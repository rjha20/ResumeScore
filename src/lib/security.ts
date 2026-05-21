/**
 * Input sanitization and security utilities for the AI Resume Analyzer.
 * Provides helpers for sanitizing user input, validating files, and protecting APIs.
 */

// ─── Input Sanitization ─────────────────────────────────────────────

/**
 * Sanitize a string by stripping potentially dangerous content.
 * Removes HTML tags, script content, and trims whitespace.
 */
export function sanitizeInput(input: string, maxLength = 10000): string {
  if (!input) return "";

  let sanitized = input
    // Remove HTML/XML tags
    .replace(/<[^>]*>/g, "")
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove event handlers
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\bon\w+\s*=\s*[^\s>]+/gi, "")
    // Remove javascript: URLs
    .replace(/javascript:\s*/gi, "")
    // Remove data: URLs that could be XSS vectors
    .replace(/data:\s*text\/html/gi, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize a filename to prevent path traversal attacks.
 * Removes directory separators and special characters.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "untitled";

  return filename
    // Remove directory separators
    .replace(/[/\\:*?"<>|]/g, "")
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove leading dots and spaces
    .replace(/^[.\s]+/, "")
    // Truncate to safe length
    .slice(0, 255)
    .trim() || "untitled";
}

// ─── File Validation ────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  error: string;
}

/**
 * Validate a file for resume upload.
 * Checks MIME type, extension, and size.
 */
export function validateResumeFile(
  file: { type: string; name: string; size: number },
): FileValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Only PDF and DOCX files are allowed.`,
    };
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return {
      valid: false,
      error: `Invalid file extension "${ext}". Only .pdf and .docx files are allowed.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of 10MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty.",
    };
  }

  return { valid: true, error: "" };
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── API Protection ─────────────────────────────────────────────────

/**
 * Get a safe client IP from request headers.
 * Handles proxies and load balancers.
 */
export function getClientIP(
  headers: Headers | Record<string, string | string[] | undefined>,
): string {
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) ?? undefined;
    }
    const val = headers[name];
    return Array.isArray(val) ? val[0] : val;
  };

  return (
    get("x-forwarded-for")?.split(",")[0]?.trim() ??
    get("x-real-ip") ??
    get("cf-connecting-ip") ??
    get("x-client-ip") ??
    "127.0.0.1"
  );
}

/**
 * Extract a safe client identifier for rate limiting.
 * Prefers user ID, falls back to IP.
 */
export function getClientIdentifier(
  userId: string | null | undefined,
  headers: Headers | Record<string, string | string[] | undefined>,
): string {
  if (userId) return `user:${userId}`;
  return `ip:${getClientIP(headers)}`;
}