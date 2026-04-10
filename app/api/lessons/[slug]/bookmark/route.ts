import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/index";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snippet = await prisma.snippet.findUnique({ where: { slug }, select: { id: true } });
  if (!snippet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.bookmark.findUnique({
    where: { userId_snippetId: { userId, snippetId: snippet.id } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  } else {
    await prisma.bookmark.create({ data: { userId, snippetId: snippet.id } });
    return NextResponse.json({ bookmarked: true });
  }
}
