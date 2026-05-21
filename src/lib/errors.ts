/**
 * Centralized error handling system for the AI Resume Analyzer.
 * Provides typed error classes and a standardized response format.
 */

// ─── Error Types ────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AuthError extends AppError {
  constructor(message = "Not authenticated") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "AuthError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded") {
    super(message, "RATE_LIMITED", 429);
    this.name = "RateLimitError";
  }
}

export class AIError extends AppError {
  constructor(message = "AI service error") {
    super(message, "AI_ERROR", 502);
    this.name = "AIError";
  }
}

// ─── Standardized Response Helpers ─────────────────────────────────

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ActionResult<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Wrap a server action handler with standardized error handling.
 * Catches any thrown errors and returns an ErrorResponse.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof AppError) {
      return {
        success: false,
        error: err.message,
        code: err.code,
        details: err.details,
      };
    }
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return {
      success: false,
      error: message,
      code: "INTERNAL_ERROR",
    };
  }
}

/**
 * Sanitize an error message for client-facing responses.
 * Strips internal details from non-AppError exceptions.
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    // Only show generic message for unknown errors
    return "An unexpected error occurred";
  }
  return "An unexpected error occurred";
}