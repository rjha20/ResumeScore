/**
 * AI response cache to reduce API costs.
 * Caches AI analysis results based on resume hashes.
 * In-memory with configurable TTL.
 */

import crypto from "crypto";

interface CacheEntry {
  data: unknown;
  createdAt: number;
  expiresAt: number;
  hits: number;
}

// ─── Configuration ──────────────────────────────────────────────────

const DEFAULT_TTL = {
  /** Full AI analysis: 24 hours */
  aiAnalysis: 24 * 60 * 60 * 1000,
  /** ATS analysis: 24 hours */
  atsAnalysis: 24 * 60 * 60 * 1000,
  /** Parsing results: 7 days (resume content rarely changes) */
  resumeParse: 7 * 24 * 60 * 60 * 1000,
  /** Error results: 1 hour (don't cache errors too long) */
  error: 60 * 60 * 1000,
} as const;

const MAX_CACHE_SIZE = 200;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ─── In-Memory Store ───────────────────────────────────────────────

const cache = new Map<string, CacheEntry>();
let lastCleanup = Date.now();

function ensureCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  let deleted = 0;
  for (const [key, entry] of cache) {
    if (now >= entry.expiresAt) {
      cache.delete(key);
      deleted++;
    }
  }

  // Evict least-used entries if over limit
  if (cache.size > MAX_CACHE_SIZE) {
    const sorted = [...cache.entries()]
      .filter(([, e]) => e.hits > 0)
      .sort(([, a], [, b]) => a.hits - b.hits);

    const toEvict = cache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < toEvict && i < sorted.length; i++) {
      cache.delete(sorted[i][0]);
    }
  }

  if (deleted > 0 || cache.size > MAX_CACHE_SIZE) {
    console.debug(
      `[Cache] Cleaned ${deleted} expired entries. Cache size: ${cache.size}/${MAX_CACHE_SIZE}`,
    );
  }
}

// ─── Key Generation ────────────────────────────────────────────────

/**
 * Generate a deterministic cache key from resume text + options.
 */
export function generateCacheKey(
  prefix: string,
  rawText: string,
  options?: Record<string, unknown>,
): string {
  const hash = crypto
    .createHash("md5")
    .update(rawText.slice(0, 5000)) // First 5000 chars for speed
    .update(options ? JSON.stringify(options) : "")
    .digest("hex");

  return `${prefix}:${hash}`;
}

/**
 * Generate a cache key for a specific user + resume.
 */
export function generateUserCacheKey(
  prefix: string,
  userId: string,
  resumeId: string,
  options?: Record<string, unknown>,
): string {
  const raw = `${userId}:${resumeId}:${options ? JSON.stringify(options) : ""}`;
  const hash = crypto.createHash("md5").update(raw).digest("hex");
  return `${prefix}:${hash}`;
}

// ─── Cache API ─────────────────────────────────────────────────────

export interface CacheResult<T> {
  found: boolean;
  data?: T;
}

/**
 * Get a cached value.
 */
export function cacheGet<T>(key: string): CacheResult<T> {
  ensureCleanup();

  const entry = cache.get(key);
  if (!entry) return { found: false };

  // Check expiry
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return { found: false };
  }

  // Track hit count for eviction
  entry.hits++;

  return { found: true, data: entry.data as T };
}

/**
 * Set a cached value with the given TTL.
 */
export function cacheSet<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL.aiAnalysis,
): void {
  ensureCleanup();

  const now = Date.now();
  cache.set(key, {
    data,
    createdAt: now,
    expiresAt: now + ttl,
    hits: 0,
  });
}

/**
 * Attempt cached execution: check cache first, execute on miss.
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL.aiAnalysis,
  onCacheHit?: () => void,
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached.found && cached.data !== undefined) {
    onCacheHit?.();
    return cached.data;
  }

  const result = await fn();

  // Only cache successful results
  if (result !== null && result !== undefined) {
    cacheSet(key, result, ttl);
  }

  return result;
}

/**
 * Invalidate a specific cache key.
 */
export function cacheInvalidate(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache keys with a given prefix.
 */
export function cacheInvalidateByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache statistics.
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
  entries: Array<{ key: string; hits: number; age: number }>;
} {
  const now = Date.now();
  const entries = [...cache.entries()]
    .filter(([, e]) => now < e.expiresAt)
    .map(([key, entry]) => ({
      key: key.slice(0, 50),
      hits: entry.hits,
      age: Math.round((now - entry.createdAt) / 1000),
    }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 20);

  const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);

  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: cache.size > 0 ? Math.round((totalHits / cache.size) * 100) : 0,
    entries,
  };
}