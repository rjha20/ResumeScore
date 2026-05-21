/**
 * Logging service for tracking AI usage, uploads, parsing, and errors.
 * In production, this can be extended to send logs to an external service.
 */

// ─── Log Levels ─────────────────────────────────────────────────────

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  userId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  durationMs?: number;
}

// ─── Event Types ────────────────────────────────────────────────────

export const LogEvent = {
  // AI Events
  AI_ANALYSIS_START: "ai.analysis.start",
  AI_ANALYSIS_COMPLETE: "ai.analysis.complete",
  AI_ANALYSIS_FAILED: "ai.analysis.failed",
  AI_RATE_LIMITED: "ai.rate_limited",
  AI_PROVIDER_SWITCH: "ai.provider.switch",
  AI_PROVIDER_FAILED: "ai.provider.failed",

  // Upload Events
  UPLOAD_START: "upload.start",
  UPLOAD_COMPLETE: "upload.complete",
  UPLOAD_FAILED: "upload.failed",
  UPLOAD_INVALID_FILE: "upload.invalid_file",

  // Parse Events
  PARSE_START: "parse.start",
  PARSE_COMPLETE: "parse.complete",
  PARSE_FAILED: "parse.failed",

  // Auth Events
  AUTH_SUCCESS: "auth.success",
  AUTH_FAILED: "auth.failed",
  AUTH_UNAUTHORIZED: "auth.unauthorized",

  // ATS Events
  ATS_ANALYSIS_START: "ats.analysis.start",
  ATS_ANALYSIS_COMPLETE: "ats.analysis.complete",
  ATS_ANALYSIS_FAILED: "ats.analysis.failed",

  // General
  API_ERROR: "api.error",
  VALIDATION_ERROR: "validation.error",
  RATE_LIMITED: "rate_limited",
  NOT_FOUND: "not_found",
} as const;

export type LogEventType = (typeof LogEvent)[keyof typeof LogEvent];

// ─── Logger Implementation ──────────────────────────────────────────

const MAX_LOG_ENTRIES = 1000;
const recentLogs: LogEntry[] = [];

function formatTimestamp(date: Date): string {
  return date.toISOString();
}

function addEntry(entry: LogEntry): void {
  recentLogs.push(entry);
  if (recentLogs.length > MAX_LOG_ENTRIES) {
    recentLogs.shift();
  }

  // Console output for development
  if (process.env.NODE_ENV === "development") {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.event}]`;
    if (entry.level === "error") {
      console.error(prefix, entry.message, entry.metadata ?? "");
    } else if (entry.level === "warn") {
      console.warn(prefix, entry.message, entry.metadata ?? "");
    } else {
      console.log(prefix, entry.message, entry.metadata ?? "");
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────────

export const logger = {
  info(
    event: LogEventType,
    message: string,
    options?: {
      userId?: string;
      metadata?: Record<string, unknown>;
      durationMs?: number;
    },
  ): void {
    addEntry({
      timestamp: formatTimestamp(new Date()),
      level: "info",
      event,
      message,
      userId: options?.userId,
      metadata: options?.metadata,
      durationMs: options?.durationMs,
    });
  },

  warn(
    event: LogEventType,
    message: string,
    options?: {
      userId?: string;
      metadata?: Record<string, unknown>;
      durationMs?: number;
    },
  ): void {
    addEntry({
      timestamp: formatTimestamp(new Date()),
      level: "warn",
      event,
      message,
      userId: options?.userId,
      metadata: options?.metadata,
      durationMs: options?.durationMs,
    });
  },

  error(
    event: LogEventType,
    message: string,
    options?: {
      userId?: string;
      metadata?: Record<string, unknown>;
      durationMs?: number;
    },
  ): void {
    addEntry({
      timestamp: formatTimestamp(new Date()),
      level: "error",
      event,
      message,
      userId: options?.userId,
      metadata: options?.metadata,
      durationMs: options?.durationMs,
    });
  },

  debug(
    event: LogEventType,
    message: string,
    options?: {
      userId?: string;
      metadata?: Record<string, unknown>;
    },
  ): void {
    if (process.env.NODE_ENV !== "development") return;
    addEntry({
      timestamp: formatTimestamp(new Date()),
      level: "debug",
      event,
      message,
      userId: options?.userId,
      metadata: options?.metadata,
    });
  },

  /** Get recent log entries (for admin dashboard or debugging) */
  getRecentLogs(count = 50): LogEntry[] {
    return recentLogs.slice(-count);
  },
};