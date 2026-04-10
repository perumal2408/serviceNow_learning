import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, getCurrentUserId } from "@/lib/auth/index";
import { mergeAnonymousProgress } from "@/lib/auth/anonymous";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    // Merge anonymous progress if there's an existing anon session
    const anonUserId = await getCurrentUserId();
    if (anonUserId && anonUserId !== newUser.id) {
      const anonUser = await prisma.user.findUnique({ where: { id: anonUserId } });
      if (anonUser?.anonymousId) {
        await mergeAnonymousProgress(anonUserId, newUser.id);
      }
    }

    const token = await createSessionToken(newUser.id, false);
    const response = NextResponse.json({
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
