import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Verify webhook signature
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (secret) {
    const sig = request.headers.get("x-hub-signature-256");
    if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 401 });

    const body = await request.text();
    const crypto = await import("crypto");
    const expected = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");

    // Timing-safe comparison
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = request.headers.get("x-github-event");
  if (event !== "push") return NextResponse.json({ message: "Ignoring non-push event" });

  // Trigger ingestion async (fire-and-forget)
  triggerIngestion().catch(console.error);

  return NextResponse.json({ message: "Sync triggered" });
}

async function triggerIngestion() {
  const sync = await prisma.contentSync.create({
    data: { status: "in_progress" },
  });

  try {
    // Dynamic import to avoid loading ingestion code in normal server bundle
    const { execSync } = await import("child_process");
    execSync(`npx tsx scripts/ingest.ts --resume`, {
      cwd: process.cwd(),
      timeout: 60 * 60 * 1000, // 1 hour max
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
}
