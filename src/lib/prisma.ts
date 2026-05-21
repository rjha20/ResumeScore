import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "3");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "15");
  }

  return new PrismaClient({
    datasourceUrl: url.toString(),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`Prisma query failed (attempt ${attempt + 1}/${retries + 1}), retrying...`);
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Unreachable");
}