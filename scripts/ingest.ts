#!/usr/bin/env npx tsx
/**
 * Content Ingestion Script
 *
 * Usage:
 *   npx tsx scripts/ingest.ts
 *   npx tsx scripts/ingest.ts --skip-ai   # parse only, no AI content generation
 *   npx tsx scripts/ingest.ts --category "Client-Side Components"  # single category
 *   npx tsx scripts/ingest.ts --resume    # skip snippets that already have AI content
 */

import * as path from "path";
import { parseRepository } from "../lib/ingestion/parser";
import { generateLessonContent, checkOllamaHealth } from "../lib/ingestion/ollama-client";
import { classifyDifficulty, estimateMinutes } from "../lib/ingestion/difficulty-classifier";
import "dotenv/config";
import { prisma } from "../lib/db";

const REPO_PATH = process.env.CONTENT_REPO_PATH ?? "/Users/akash/Downloads/code-snippets-main";

const skipAI = process.argv.includes("--skip-ai");
const resumeMode = process.argv.includes("--resume");
const categoryFilter = (() => {
  const idx = process.argv.indexOf("--category");
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

const CATEGORY_COLORS: Record<string, string> = {
  "client-side-components": "#6366f1",
  "core-servicenow-apis": "#0ea5e9",
  integration: "#f59e0b",
  "modern-development": "#10b981",
  "server-side-components": "#ef4444",
  "specialized-areas": "#8b5cf6",
};

const CATEGORY_ICONS: Record<string, string> = {
  "client-side-components": "Monitor",
  "core-servicenow-apis": "Database",
  integration: "Globe",
  "modern-development": "Sparkles",
  "server-side-components": "Server",
  "specialized-areas": "Layers",
};

async function main() {
  console.log("🚀 ServiceNow Learning Platform — Content Ingestion");
  console.log(`📁 Repo: ${REPO_PATH}`);
  console.log(`🤖 AI generation: ${skipAI ? "SKIPPED" : "ENABLED"}`);
  console.log(`🔄 Resume mode: ${resumeMode}`);
  if (categoryFilter) console.log(`🔍 Category filter: "${categoryFilter}"`);
  console.log();

  // Check Ollama connectivity (unless skipping AI)
  if (!skipAI) {
    const ollamaOk = await checkOllamaHealth();
    if (!ollamaOk) {
      console.error("❌ Cannot reach Ollama at", process.env.OLLAMA_BASE_URL ?? "http://localhost:11434");
      console.error("   Start Ollama with: ollama serve");
      console.error("   Or run with --skip-ai to ingest without AI generation\n");
      process.exit(1);
    }
    console.log("✅ Ollama reachable\n");
  }

  const syncRecord = await prisma.contentSync.create({
    data: { status: "in_progress" },
  });

  let totalNew = 0;
  let totalUpdated = 0;
  let errors: string[] = [];

  try {
    const categories = parseRepository(REPO_PATH);
    console.log(`📂 Found ${categories.length} categories\n`);

    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci];
      if (categoryFilter && !cat.name.toLowerCase().includes(categoryFilter.toLowerCase())) {
        continue;
      }

      console.log(`\n[${ci + 1}/${categories.length}] 📁 ${cat.name} (${cat.topics.length} topics)`);

      // Upsert category
      const dbCategory = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: {
          name: cat.name,
          slug: cat.slug,
          color: CATEGORY_COLORS[cat.slug] ?? "#64748b",
          icon: CATEGORY_ICONS[cat.slug] ?? "BookOpen",
          order: ci,
        },
      });

      for (let ti = 0; ti < cat.topics.length; ti++) {
        const topic = cat.topics[ti];
        console.log(`  📌 ${topic.name} (${topic.snippets.length} snippets)`);

        // Upsert topic
        const dbTopic = await prisma.topic.upsert({
          where: { slug: topic.slug },
          update: { name: topic.name, categoryId: dbCategory.id },
          create: {
            name: topic.name,
            slug: topic.slug,
            categoryId: dbCategory.id,
            order: ti,
          },
        });

        for (let si = 0; si < topic.snippets.length; si++) {
          const snippet = topic.snippets[si];
          process.stdout.write(`    [${si + 1}/${topic.snippets.length}] ${snippet.title}...`);

          try {
            const existing = await prisma.snippet.findUnique({
              where: { slug: snippet.slug },
              select: { id: true, sourceHash: true, overview: true },
            });

            const difficulty = classifyDifficulty({
              category: cat.name,
              topic: topic.name,
              codeFiles: snippet.sourceCode,
              readme: snippet.sourceReadme,
            });
            const estimatedMinutes = estimateMinutes(snippet.sourceCode, snippet.sourceReadme);

            let lessonContent = {};

            if (!skipAI) {
              // Skip AI generation if in resume mode and already has content
              const needsAI = !existing?.overview || existing?.sourceHash !== snippet.sourceHash;
              if (needsAI) {
                try {
                  const content = await generateLessonContent(
                    cat.name,
                    topic.name,
                    snippet.title,
                    snippet.sourceReadme,
                    snippet.sourceCode
                  );
                  lessonContent = content;
                  process.stdout.write(" ✨");
                } catch (e) {
                  process.stdout.write(" ⚠️ AI failed");
                  errors.push(`AI failed for ${snippet.slug}: ${e}`);
                }
              } else if (resumeMode) {
                process.stdout.write(" ⏭️ skipped");
              }
            }

            if (existing) {
              await prisma.snippet.update({
                where: { id: existing.id },
                data: {
                  title: snippet.title,
                  topicId: dbTopic.id,
                  difficulty,
                  estimatedMinutes,
                  sourceReadme: snippet.sourceReadme,
                  sourceCode: snippet.sourceCode as object[],
                  sourcePath: snippet.sourcePath,
                  sourceHash: snippet.sourceHash,
                  order: si,
                  ...lessonContent,
                },
              });
              totalUpdated++;
            } else {
              await prisma.snippet.create({
                data: {
                  title: snippet.title,
                  slug: snippet.slug,
                  topicId: dbTopic.id,
                  difficulty,
                  estimatedMinutes,
                  sourceReadme: snippet.sourceReadme,
                  sourceCode: snippet.sourceCode as object[],
                  sourcePath: snippet.sourcePath,
                  sourceHash: snippet.sourceHash,
                  order: si,
                  ...lessonContent,
                },
              });
              totalNew++;
            }

            process.stdout.write(" ✅\n");
          } catch (e) {
            process.stdout.write(" ❌\n");
            errors.push(`Failed ${snippet.slug}: ${e}`);
          }
        }
      }
    }

    await prisma.contentSync.update({
      where: { id: syncRecord.id },
      data: {
        status: errors.length === 0 ? "success" : "success_with_errors",
        snippetsNew: totalNew,
        snippetsUpdated: totalUpdated,
        error: errors.length > 0 ? errors.slice(0, 10).join("\n") : null,
        completedAt: new Date(),
      },
    });

    console.log(`\n✅ Done! New: ${totalNew}, Updated: ${totalUpdated}`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} errors:`);
      errors.slice(0, 5).forEach((e) => console.log("  -", e));
    }
  } catch (e) {
    await prisma.contentSync.update({
      where: { id: syncRecord.id },
      data: { status: "failed", error: String(e), completedAt: new Date() },
    });
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
