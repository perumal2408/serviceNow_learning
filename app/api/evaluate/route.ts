import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/index";
import { evaluateCode } from "@/lib/ingestion/ollama-client";
import { z } from "zod";

const schema = z.object({
  snippetSlug: z.string(),
  code: z.string().min(1).max(50_000),
});

// Simple in-memory queue to prevent Ollama overload
let evaluating = false;
const queue: (() => void)[] = [];

async function withQueue<T>(fn: () => Promise<T>): Promise<T> {
  if (!evaluating) {
    evaluating = true;
    try {
      return await fn();
    } finally {
      evaluating = false;
      queue.shift()?.();
    }
  }
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      evaluating = true;
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      } finally {
        evaluating = false;
        queue.shift()?.();
      }
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { snippetSlug, code } = schema.parse(body);
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const snippet = await prisma.snippet.findUnique({
      where: { slug: snippetSlug },
      select: { id: true, practicePrompt: true, practiceSolution: true },
    });

    if (!snippet) return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    if (!snippet.practicePrompt) {
      return NextResponse.json({ error: "No practice exercise for this snippet" }, { status: 400 });
    }

    const result = await withQueue(() =>
      evaluateCode(
        snippet.practicePrompt!,
        snippet.practiceSolution ?? "// No reference solution available",
        code
      )
    );

    // Persist attempt
    await prisma.practiceAttempt.create({
      data: {
        userId,
        snippetId: snippet.id,
        code,
        score: result.totalScore,
        feedback: result as object,
      },
    });

    // Auto-mark mastered if score >= 90
    if (result.totalScore >= 90) {
      await prisma.userSnippetProgress.upsert({
        where: { userId_snippetId: { userId, snippetId: snippet.id } },
        update: { status: "MASTERED", score: result.totalScore },
        create: { userId, snippetId: snippet.id, status: "MASTERED", score: result.totalScore },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error(err);
    const isOllamaError = String(err).includes("fetch") || String(err).includes("ECONNREFUSED");
    if (isOllamaError) {
      return NextResponse.json(
        { error: "AI evaluator is unavailable. Make sure Ollama is running." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
