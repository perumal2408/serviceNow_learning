import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";
import { createSessionToken } from "@/lib/auth/index";

export async function createAnonymousUser(): Promise<{ userId: string; token: string }> {
  const anonymousId = uuidv4();
  const user = await prisma.user.create({
    data: { anonymousId },
  });
  const token = await createSessionToken(user.id, true);
  return { userId: user.id, token };
}

export async function mergeAnonymousProgress(
  anonymousUserId: string,
  authenticatedUserId: string
): Promise<void> {
  // Transfer all progress from anon user to authenticated user
  // Skip conflicts (authenticated user already has progress for that snippet)
  const existingProgress = await prisma.userSnippetProgress.findMany({
    where: { userId: authenticatedUserId },
    select: { snippetId: true },
  });
  const existingSnippetIds = new Set(existingProgress.map((p) => p.snippetId));

  const anonProgress = await prisma.userSnippetProgress.findMany({
    where: { userId: anonymousUserId },
  });

  const toTransfer = anonProgress.filter((p) => !existingSnippetIds.has(p.snippetId));
  if (toTransfer.length > 0) {
    await prisma.userSnippetProgress.createMany({
      data: toTransfer.map((p) => ({
        userId: authenticatedUserId,
        snippetId: p.snippetId,
        status: p.status,
        score: p.score,
        timeSpent: p.timeSpent,
        completedAt: p.completedAt,
      })),
      skipDuplicates: true,
    });
  }

  // Transfer bookmarks
  const existingBookmarks = await prisma.bookmark.findMany({
    where: { userId: authenticatedUserId },
    select: { snippetId: true },
  });
  const existingBookmarkIds = new Set(existingBookmarks.map((b) => b.snippetId));
  const anonBookmarks = await prisma.bookmark.findMany({
    where: { userId: anonymousUserId },
  });
  const bookmarksToTransfer = anonBookmarks.filter(
    (b) => !existingBookmarkIds.has(b.snippetId)
  );
  if (bookmarksToTransfer.length > 0) {
    await prisma.bookmark.createMany({
      data: bookmarksToTransfer.map((b) => ({
        userId: authenticatedUserId,
        snippetId: b.snippetId,
        note: b.note,
      })),
      skipDuplicates: true,
    });
  }

  // Transfer streaks
  const anonStreaks = await prisma.learningStreak.findMany({
    where: { userId: anonymousUserId },
  });
  if (anonStreaks.length > 0) {
    await prisma.learningStreak.createMany({
      data: anonStreaks.map((s) => ({
        userId: authenticatedUserId,
        date: s.date,
      })),
      skipDuplicates: true,
    });
  }

  // Delete anon user (cascades all their remaining records)
  await prisma.user.delete({ where: { id: anonymousUserId } });
}
