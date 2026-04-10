import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/index";
import { prisma } from "@/lib/db";

// Manual sync trigger for admins/development
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sync = await prisma.contentSync.create({
    data: { status: "in_progress" },
  });

  // Trigger async
  (async () => {
    try {
      const { execSync } = await import("child_process");
      execSync(`npx tsx scripts/ingest.ts --skip-ai --resume`, {
        cwd: process.cwd(),
        timeout: 30 * 60 * 1000,
        env: { ...process.env },
      });
      await prisma.contentSync.update({
        where: { id: sync.id },
        data: { status: "success", completedAt: new Date() },
      });
    } catch (e) {
      await prisma.contentSync.update({
        where: { id: sync.id },
        data: { status: "failed", error: String(e), completedAt: new Date() },
      });
    }
  })().catch(console.error);

  return NextResponse.json({ syncId: sync.id, message: "Sync started" });
}
