import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const sessionCookie = request.cookies.get("session");

  // If session cookie exists and is valid, pass through
  if (sessionCookie?.value) {
    const payload = await verifySessionToken(sessionCookie.value);
    if (payload) return response;
  }

  // No valid session — create anonymous user via API redirect
  // We can't call Prisma from middleware (Edge runtime), so redirect to
  // an API route that creates the anon user and sets cookie, then redirects back
  const initUrl = new URL("/api/auth/init", request.url);
  initUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(initUrl);
}

export const config = {
  matcher: [
    // Only run on pages, not on API routes, static files, or _next
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)",
  ],
};
