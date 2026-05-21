import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * Get the current authenticated user's ID from Clerk.
 * Throws if not authenticated.
 */
export async function getAuthUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/**
 * Get the current user from the database, synced with Clerk.
 * Creates a local DB record if one doesn't exist.
 */
export async function getCurrentDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const dbUser = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || undefined,
      imageUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || undefined,
      imageUrl: clerkUser.imageUrl,
    },
  });

  return dbUser;
}

/**
 * Require authentication and return the DB user.
 * Throws if not authenticated.
 */
export async function requireAuth() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) throw new Error("Not authenticated");
  return dbUser;
}