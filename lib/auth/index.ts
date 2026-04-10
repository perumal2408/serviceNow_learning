// Re-export JWT utilities from edge-safe module
export { createSessionToken, verifySessionToken } from "./jwt";
export type { JWTPayload } from "./jwt";

// Node.js-only exports (cannot be used in Edge middleware)
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySessionToken } from "./jwt";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  return prisma.user.findUnique({ where: { id: payload.sub } });
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  return payload?.sub ?? null;
}
