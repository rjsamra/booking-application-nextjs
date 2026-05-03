import { auth } from "@/auth";
import { jsonError } from "@/lib/api-json";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";

export type AdminSessionResult =
  | { session: Session }
  | NextResponse;

export async function requireAdmin(): Promise<AdminSessionResult> {
  const session = await auth();
  if (!session?.user) {
    return jsonError(401, "UNAUTHORIZED", "Authentication required.");
  }
  if (session.user.role !== "ADMIN") {
    return jsonError(403, "FORBIDDEN", "Admin access required.");
  }
  return { session };
}
