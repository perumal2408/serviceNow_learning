import { NextRequest, NextResponse } from "next/server";
import { createAnonymousUser } from "@/lib/auth/anonymous";

// This route creates an anonymous user and redirects back
// Called by middleware when no session exists
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const { token } = await createAnonymousUser();

  const response = NextResponse.redirect(new URL(redirect, request.url));
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return response;
}
