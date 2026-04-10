import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/index";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        topics: {
          orderBy: { order: "asc" },
          include: {
            snippets: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                estimatedMinutes: true,
                prerequisites: true,
                overview: true,
                progress: userId
                  ? { where: { userId }, select: { status: true, score: true } }
                  : false,
              },
            },
          },
        },
      },
    });

    // Flatten progress data
    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      topics: cat.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        slug: topic.slug,
        snippets: topic.snippets.map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          difficulty: s.difficulty,
          estimatedMinutes: s.estimatedMinutes,
          prerequisites: s.prerequisites,
          overview: s.overview,
          status: (s.progress as { status: string }[] | undefined)?.[0]?.status ?? "NOT_STARTED",
          score: (s.progress as { score: number | null }[] | undefined)?.[0]?.score ?? null,
        })),
      })),
    }));

    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
