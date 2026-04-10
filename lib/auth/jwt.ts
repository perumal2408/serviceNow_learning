// This module is safe for Edge runtime (no Node.js built-ins, no Prisma)
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-please-change"
);

export interface JWTPayload {
  sub: string;
  type: "session";
  anon?: boolean;
  iat?: number;
  exp?: number;
}

export async function createSessionToken(userId: string, anon = false): Promise<string> {
  return new SignJWT({ sub: userId, type: "session", anon })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
