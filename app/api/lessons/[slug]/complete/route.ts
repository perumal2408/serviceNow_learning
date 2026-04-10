import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/index";
import { z } from "zod";

const schema = z.object({ timeSpent: z.number().int().min(0).default(0) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { timeSpent } = schema.parse(body);

  const snippet = await prisma.snippet.findUnique({ where: { slug }, select: { id: true } });
  if (!snippet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const progress = await prisma.userSnippetProgress.upsert({
    where: { userId_snippetId: { userId, snippetId: snippet.id } },
    update: {
      status: "COMPLETED",
      completedAt: new Date(),
      timeSpent: { increment: timeSpent },
    },
    create: {
      userId,
      snippetId: snippet.id,
      status: "COMPLETED",
      completedAt: new Date(),
      timeSpent,
    },
  });

  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.learningStreak.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  });

  return NextResponse.json({ progress });
}
