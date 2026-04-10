"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, CheckCircle2, Circle, Clock, Star, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { RoadmapCategory } from "@/lib/roadmap/graph-data";

const DIFFICULTY_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

const DIFFICULTY_COLORS = {
  BEGINNER: "text-green-600 dark:text-green-400",
  INTERMEDIATE: "text-amber-600 dark:text-amber-400",
  ADVANCED: "text-orange-600 dark:text-orange-400",
  EXPERT: "text-red-600 dark:text-red-400",
} as const;

interface Props {
  categories: RoadmapCategory[];
}

export function RoadmapMobile({ categories }: Props) {
  const [openCategory, setOpenCategory] = useState<string | null>(categories[0]?.id ?? null);

  // Find first incomplete lesson for CTA
  let nextLesson: { catSlug: string; topicSlug: string; snippet: { slug: string; title: string } } | null = null;
  outer: for (const cat of categories) {
    for (const topic of cat.topics) {
      for (const snippet of topic.snippets) {
        if (snippet.status === "NOT_STARTED") {
          nextLesson = { catSlug: cat.slug, topicSlug: topic.slug, snippet };
          break outer;
        }
      }
    }
  }

  const totalSnippets = categories.reduce(
    (a, c) => a + c.topics.reduce((b, t) => b + t.snippets.length, 0),
    0
  );
  const completedSnippets = categories.reduce(
    (a, c) =>
      a +
      c.topics.reduce(
        (b, t) =>
          b + t.snippets.filter((s) => s.status === "COMPLETED" || s.status === "MASTERED").length,
        0
      ),
    0
  );
  const overallProgress = totalSnippets > 0 ? Math.round((completedSnippets / totalSnippets) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Overall Progress</span>
          <span className="text-muted-foreground">{completedSnippets}/{totalSnippets} lessons</span>
        </div>
        <Progress value={overallProgress} aria-label="Overall progress" />
      </div>

      {/* Continue learning CTA */}
      {nextLesson && (
        <Link
          href={`/learn/${nextLesson.catSlug}/${nextLesson.topicSlug}/${nextLesson.snippet.slug}`}
          className="flex items-center gap-3 bg-primary text-primary-foreground rounded-lg p-4 min-h-[56px]"
        >
          <div className="flex-1">
            <p className="text-xs font-medium opacity-80">Continue Learning</p>
            <p className="font-semibold text-sm line-clamp-1">{nextLesson.snippet.title}</p>
          </div>
          <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
        </Link>
      )}

      {/* Category accordions */}
      <nav aria-label="Learning roadmap">
        {categories.map((cat) => {
          const catOpen = openCategory === cat.id;
          const catTotal = cat.topics.reduce((a, t) => a + t.snippets.length, 0);
          const catCompleted = cat.topics.reduce(
            (a, t) =>
              a + t.snippets.filter((s) => s.status === "COMPLETED" || s.status === "MASTERED").length,
            0
          );
          const catProgress = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;

          return (
            <div key={cat.id} className="rounded-lg border overflow-hidden mb-2">
              <button
                className="w-full flex items-center gap-3 p-4 text-left min-h-[60px] hover:bg-accent transition-colors"
                onClick={() => setOpenCategory(catOpen ? null : cat.id)}
                aria-expanded={catOpen}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color ?? "#6366f1" }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{catCompleted}/{catTotal} complete</p>
                </div>
                <ChevronDown
                  className={cn("w-4 h-4 text-muted-foreground transition-transform", catOpen && "rotate-180")}
                  aria-hidden
                />
              </button>

              {catOpen && (
                <div className="border-t">
                  {/* Per-category progress bar */}
                  <div className="px-4 py-2 bg-muted/30">
                    <Progress value={catProgress} className="h-1.5" aria-label={`${cat.name} progress`} />
                  </div>

                  {/* Each topic as vertical timeline */}
                  <div className="px-4 pb-4 space-y-3 pt-3">
                    {cat.topics.map((topic) => (
                      <div key={topic.id}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {topic.name}
                        </p>
                        <div className="space-y-2">
                          {topic.snippets.map((snippet) => {
                            const isComplete =
                              snippet.status === "COMPLETED" || snippet.status === "MASTERED";
                            const isMastered = snippet.status === "MASTERED";
                            return (
                              <Link
                                key={snippet.id}
                                href={`/learn/${cat.slug}/${topic.slug}/${snippet.slug}`}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg border transition-colors min-h-[56px]",
                                  isComplete
                                    ? "bg-green-500/5 border-green-500/20"
                                    : "bg-card hover:bg-accent"
                                )}
                              >
                                {isMastered ? (
                                  <Star className="w-4 h-4 text-yellow-500 shrink-0" aria-label="Mastered" />
                                ) : isComplete ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" aria-label="Completed" />
                                ) : (
                                  <Circle className="w-4 h-4 text-muted-foreground shrink-0" aria-label="Not started" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium line-clamp-1">{snippet.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={cn("text-[10px] font-medium", DIFFICULTY_COLORS[snippet.difficulty as keyof typeof DIFFICULTY_COLORS] ?? DIFFICULTY_COLORS.BEGINNER)}>
                                      {DIFFICULTY_LABELS[snippet.difficulty as keyof typeof DIFFICULTY_LABELS] ?? snippet.difficulty}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Clock className="w-3 h-3" aria-hidden />
                                      {snippet.estimatedMinutes}m
                                    </span>
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
