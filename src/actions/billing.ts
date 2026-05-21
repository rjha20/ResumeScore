"use server";

import { requireAuth } from "@/lib/auth";
import { getBillingSummary } from "@/lib/billing";

export async function getCurrentBillingSummary() {
  try {
    const user = await requireAuth();
    const summary = await getBillingSummary(user.id);
    return { success: true as const, data: summary };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load billing summary";
    return { success: false as const, error: message };
  }
}
