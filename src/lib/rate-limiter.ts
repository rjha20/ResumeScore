/**
 * Simple in-memory rate limiter for server actions and API routes.
 * Uses a sliding window approach to prevent abuse.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export const RATE_LIMITS = {
  /** AI analysis: 5 per hour per user */
  aiAnalysis: { maxRequests: 5, windowMs: 3600_000 },
  /** ATS analysis: 10 per hour per user */
  atsAnalysis: { maxRequests: 10, windowMs: 3600_000 },
  /** Resume upload + parse: 5 per hour per user */
  resumeUpload: { maxRequests: 5, windowMs: 3600_000 },
  /** General API: 60 per minute per user */
  api: { maxRequests: 60, windowMs: 60_000 },
  /** Auth operations: 10 per minute per IP */
  auth: { maxRequests: 10, windowMs: 60_000 },
} as const;

export type RateLimitScope = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check if a request is within rate limits.
 *
 * @param scope - The rate limit scope to check against
 * @param key - A unique key for the requester (userId, IP, etc.)
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(
  scope: RateLimitScope,
  key: string,
): RateLimitResult {
  cleanup();

  const config = RATE_LIMITS[scope];
  const storeKey = `${scope}:${key}`;
  const now = Date.now();

  const entry = store.get(storeKey);

  // First request or window expired — reset
  if (!entry || now >= entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(storeKey, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
      limit: config.maxRequests,
    };
  }

  // Within window — increment
  entry.count++;
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    limit: config.maxRequests,
  };
}

/**
 * Rate limit wrapper for server actions. Returns a standardized error response
 * when the limit is exceeded.
 */
export function checkActionRateLimit(
  scope: RateLimitScope,
  key: string,
): { success: true } | { success: false; error: string } {
  const result = checkRateLimit(scope, key);

  if (!result.allowed) {
    const minutesUntilReset = Math.ceil(
      (result.resetAt - Date.now()) / 60_000,
    );
    return {
      success: false,
      error: `Rate limit exceeded. Please try again in ${minutesUntilReset} minute${minutesUntilReset !== 1 ? "s" : ""}.`,
    };
  }

  return { success: true };
}