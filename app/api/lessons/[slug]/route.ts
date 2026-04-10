import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/index";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userId = await getCurrentUserId();

  const snippet = await prisma.snippet.findUnique({
    where: { slug },
    include: {
      topic: {
        include: {
          category: true,
          snippets: { orderBy: { order: "asc" }, select: { id: true, slug: true, title: true, order: true } },
        },
      },
      progress: userId ? { where: { userId } } : false,
      bookmarks: userId ? { where: { userId }, take: 1 } : false,
    },
  });

  if (!snippet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Find prev/next in same topic
  const siblings = snippet.topic.snippets;
  const currentIdx = siblings.findIndex((s: { id: string }) => s.id === snippet.id);
  const prevLesson = currentIdx > 0 ? siblings[currentIdx - 1] : null;
  const nextLesson = currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

  // Related: snippets in same topic (excluding self) limited to 4
  const relatedLessons = await prisma.snippet.findMany({
    where: { topicId: snippet.topicId, id: { not: snippet.id } },
    orderBy: { order: "asc" },
    take: 4,
    select: { id: true, slug: true, title: true, difficulty: true, estimatedMinutes: true },
  });

  return NextResponse.json({
    snippet: {
      ...snippet,
      progress: undefined,
      bookmarks: undefined,
    },
    prevLesson,
    nextLesson,
    relatedLessons,
    userProgress: (snippet.progress as Array<{ status: string; score: number | null; timeSpent: number }>)?.[0] ?? null,
    isBookmarked: ((snippet.bookmarks as unknown[]) ?? []).length > 0,
  });
}
