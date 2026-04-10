import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/index";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [totalSnippets, progressRows, streaks, attempts] = await Promise.all([
    prisma.snippet.count(),
    prisma.userSnippetProgress.findMany({
      where: { userId },
      include: {
        snippet: {
          select: { title: true, slug: true, topic: { include: { category: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.learningStreak.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    }),
    prisma.practiceAttempt.findMany({
      where: { userId, score: { not: null } },
      select: { score: true },
    }),
  ]);

  const completedRows = progressRows.filter(
    (p) => p.status === "COMPLETED" || p.status === "MASTERED"
  );

  // Current streak: count consecutive days ending today or yesterday
  let currentStreak = 0;
  let longestStreak = 0;
  if (streaks.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = streaks.map((s) => new Date(s.date).getTime());
    dates.sort((a, b) => b - a);

    let dayMs = 86400000;
    let streak = 1;
    let longest = 1;
    let prev = dates[0];

    // Check if streak is still active (today or yesterday)
    const daysSinceLast = (today.getTime() - dates[0]) / dayMs;
    currentStreak = daysSinceLast <= 1 ? 1 : 0;

    for (let i = 1; i < dates.length; i++) {
      const diff = (prev - dates[i]) / dayMs;
      if (diff === 1) {
        streak++;
        longest = Math.max(longest, streak);
      } else {
        streak = 1;
      }
      prev = dates[i];
    }
    longestStreak = Math.max(longest, dates.length > 0 ? 1 : 0);
    if (currentStreak > 0) {
      // Recalculate current streak from today backwards
      let cs = 1;
      let d = dates[0];
      for (let i = 1; i < dates.length; i++) {
        if ((d - dates[i]) / dayMs === 1) { cs++; d = dates[i]; }
        else break;
      }
      currentStreak = cs;
    }
  }

  // Per-category progress
  const categories = await prisma.category.findMany({
    include: {
      topics: {
        include: {
          snippets: { select: { id: true } },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  const completedIds = new Set(completedRows.map((p) => p.snippetId));
  const categoryProgress = categories.map((cat) => {
    const snippetIds = cat.topics.flatMap((t) => t.snippets.map((s) => s.id));
    const completed = snippetIds.filter((id) => completedIds.has(id)).length;
    return {
      categorySlug: cat.slug,
      name: cat.name,
      color: cat.color,
      completed,
      total: snippetIds.length,
    };
  });

  const totalTimeSpent = progressRows.reduce((a, p) => a + p.timeSpent, 0);
  const scores = attempts.map((a) => a.score ?? 0);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const recentActivity = completedRows.slice(0, 10).map((p) => ({
    snippetSlug: p.snippet.slug,
    title: p.snippet.title,
    categoryName: p.snippet.topic.category.name,
    completedAt: p.completedAt?.toISOString() ?? p.updatedAt.toISOString(),
  }));

  // Next recommended: first NOT_STARTED snippet in order
  const nextRecommended = await prisma.snippet.findFirst({
    where: {
      id: { notIn: progressRows.filter((p) => p.status !== "NOT_STARTED").map((p) => p.snippetId) },
    },
    orderBy: [{ topic: { category: { order: "asc" } } }, { topic: { order: "asc" } }, { order: "asc" }],
    include: { topic: { include: { category: true } } },
  });

  return NextResponse.json({
    totalLessons: totalSnippets,
    completedLessons: completedRows.length,
    currentStreak,
    longestStreak,
    totalTimeSpent,
    averageScore,
    categoryProgress,
    recentActivity,
    nextRecommended: nextRecommended
      ? {
          slug: nextRecommended.slug,
          title: nextRecommended.title,
          categorySlug: nextRecommended.topic.category.slug,
          topicSlug: nextRecommended.topic.slug,
        }
      : null,
    streakDates: streaks.map((s) => s.date),
  });
}
