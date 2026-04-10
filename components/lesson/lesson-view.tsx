"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  Clock,
  Code2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CodeBlock } from "./code-block";
import { useProgressStore } from "@/stores/progress-store";
import { useBreakpoint } from "@/lib/hooks/use-breakpoint";

interface SnippetData {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  estimatedMinutes: number;
  overview: string | null;
  theory: string | null;
  walkthrough: string | null;
  useCases: string | null;
  commonMistakes: string | null;
  bestPractices: string | null;
  practicePrompt: string | null;
  sourceCode: { filename: string; content: string; language: string }[];
  topic: { name: string; category: { name: string; slug: string }; slug: string };
}

interface LessonViewProps {
  data: {
    snippet: SnippetData;
    prevLesson: { slug: string; title: string } | null;
    nextLesson: { slug: string; title: string } | null;
    relatedLessons: { slug: string; title: string; difficulty: string }[];
    userProgress: { status: string; score: number | null; timeSpent: number } | null;
    isBookmarked: boolean;
  };
}

const DIFFICULTY_COLORS = {
  BEGINNER: "bg-green-500/10 text-green-700 dark:text-green-400",
  INTERMEDIATE: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ADVANCED: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  EXPERT: "bg-red-500/10 text-red-700 dark:text-red-400",
} as const;

const SECTIONS = ["Overview", "Theory", "Code", "Walkthrough", "Practice", "Related"];

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [open, setOpen] = useState(isMobile ? defaultOpen : true);

  if (!isMobile) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
      </section>
    );
  }

  return (
    <section className="mb-3 rounded-lg border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 font-semibold text-left min-h-[52px]"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && <div className="px-4 pb-4 border-t">{children}</div>}
    </section>
  );
}

export function LessonView({ data }: LessonViewProps) {
  const { snippet, prevLesson, nextLesson, relatedLessons, userProgress, isBookmarked: initialBookmarked } = data;
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const { markComplete, updateTimeSpent } = useProgressStore();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [completed, setCompleted] = useState(
    userProgress?.status === "COMPLETED" || userProgress?.status === "MASTERED"
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setScrollProgress(total > 0 ? Math.round((scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleComplete = async () => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    markComplete(snippet.slug);
    setCompleted(true);
    try {
      await fetch(`/api/lessons/${snippet.slug}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSpent }),
      });
    } catch (e) {
      console.error("Failed to sync completion:", e);
    }
  };

  const handleBookmark = async () => {
    setBookmarked((b) => !b);
    try {
      await fetch(`/api/lessons/${snippet.slug}/bookmark`, { method: "POST" });
    } catch {
      setBookmarked((b) => !b);
    }
  };

  const catSlug = snippet.topic.category.slug;
  const topicSlug = snippet.topic.slug;

  return (
    <div className="relative">
      {/* Thin scroll progress bar (mobile) */}
      {isMobile && (
        <div className="fixed top-14 left-0 right-0 z-30 h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${scrollProgress}%` }}
            role="progressbar"
            aria-valuenow={scrollProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
          />
        </div>
      )}

      {/* Desktop: 2-column layout */}
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-8">
        {/* Main content */}
        <article>
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-4 flex flex-wrap items-center gap-1.5" aria-label="Breadcrumb">
            <Link href="/roadmap" className="hover:text-foreground">Roadmap</Link>
            <span aria-hidden>/</span>
            <Link href={`/roadmap?category=${catSlug}`} className="hover:text-foreground">
              {snippet.topic.category.name}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-foreground font-medium">{snippet.topic.name}</span>
          </nav>

          {/* Header */}
          <header className="mb-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-2xl font-bold leading-snug">{snippet.title}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBookmark}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark lesson"}
                className="shrink-0 mt-0.5"
              >
                {bookmarked ? (
                  <BookmarkCheck className="w-5 h-5 text-primary" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-xs font-semibold px-2 py-1 rounded", DIFFICULTY_COLORS[snippet.difficulty as keyof typeof DIFFICULTY_COLORS] ?? DIFFICULTY_COLORS.BEGINNER)}>
                {snippet.difficulty.charAt(0) + snippet.difficulty.slice(1).toLowerCase()}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" aria-hidden />
                {snippet.estimatedMinutes} min read
              </span>
              {completed && (
                <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-3.5 h-3.5" />
                  Completed
                </span>
              )}
            </div>
          </header>

          {/* Overview */}
          {snippet.overview && (
            <CollapsibleSection title="Overview" defaultOpen>
              <p className="text-muted-foreground leading-relaxed">{snippet.overview}</p>
            </CollapsibleSection>
          )}

          {/* Theory */}
          {snippet.theory && (
            <CollapsibleSection title="Theory">
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {snippet.theory}
              </div>
            </CollapsibleSection>
          )}

          {/* Code */}
          {snippet.sourceCode.length > 0 && (
            <CollapsibleSection title="Code" defaultOpen>
              <CodeBlock files={snippet.sourceCode} />
            </CollapsibleSection>
          )}

          {/* Walkthrough */}
          {snippet.walkthrough && (
            <CollapsibleSection title="Walkthrough">
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {snippet.walkthrough}
              </div>
            </CollapsibleSection>
          )}

          {/* Use cases + Mistakes + Best practices */}
          {snippet.useCases && (
            <CollapsibleSection title="Real-World Use Cases">
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {snippet.useCases}
              </div>
            </CollapsibleSection>
          )}

          {snippet.commonMistakes && (
            <CollapsibleSection title="Common Mistakes">
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {snippet.commonMistakes}
              </div>
            </CollapsibleSection>
          )}

          {snippet.bestPractices && (
            <CollapsibleSection title="Best Practices">
              <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {snippet.bestPractices}
              </div>
            </CollapsibleSection>
          )}

          {/* Practice CTA */}
          {snippet.practicePrompt && (
            <CollapsibleSection title="Practice Exercise">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mb-4">
                <p className="text-sm font-medium mb-2">Exercise</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{snippet.practicePrompt}</p>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/practice/${snippet.slug}`}>
                  <Code2 className="w-4 h-4" aria-hidden />
                  Start Practice
                </Link>
              </Button>
            </CollapsibleSection>
          )}

          {/* Related lessons */}
          {relatedLessons.length > 0 && (
            <CollapsibleSection title="Related Lessons">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedLessons.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/learn/${catSlug}/${topicSlug}/${r.slug}`}
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors min-h-[52px]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.difficulty.toLowerCase()}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                  </Link>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Prev/Next navigation — desktop inline */}
          {!isMobile && (
            <div className="flex items-center justify-between pt-8 border-t mt-8">
              {prevLesson ? (
                <Button variant="outline" asChild>
                  <Link href={`/learn/${catSlug}/${topicSlug}/${prevLesson.slug}`}>
                    <ArrowLeft className="w-4 h-4" aria-hidden />
                    <span className="max-w-[160px] truncate">{prevLesson.title}</span>
                  </Link>
                </Button>
              ) : <div />}
              {nextLesson ? (
                <Button asChild>
                  <Link href={`/learn/${catSlug}/${topicSlug}/${nextLesson.slug}`}>
                    <span className="max-w-[160px] truncate">{nextLesson.title}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={completed}>
                  {completed ? <><Check className="w-4 h-4" /> Completed</> : "Mark Complete"}
                </Button>
              )}
            </div>
          )}
        </article>

        {/* Desktop sidebar (right) */}
        {!isMobile && (
          <aside className="hidden lg:block space-y-6 sticky top-6 self-start">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Reading Progress
              </p>
              <Progress value={scrollProgress} aria-label="Reading progress" />
              <p className="text-xs text-muted-foreground mt-2">{scrollProgress}% read</p>
            </div>

            {!completed && (
              <Button className="w-full" onClick={handleComplete}>
                <Check className="w-4 h-4" aria-hidden />
                Mark Complete
              </Button>
            )}

            {nextLesson && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next Lesson
                </p>
                <Link
                  href={`/learn/${catSlug}/${topicSlug}/${nextLesson.slug}`}
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-sm"
                >
                  <span className="flex-1 line-clamp-2">{nextLesson.title}</span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile: sticky bottom bar */}
      {isMobile && (
        <div className="fixed bottom-[64px] left-0 right-0 z-30 bg-card border-t px-4 py-3 flex gap-2 pb-safe">
          {prevLesson ? (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/learn/${catSlug}/${topicSlug}/${prevLesson.slug}`}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          ) : null}
          {!completed ? (
            <Button className="flex-1" onClick={handleComplete}>
              <Check className="w-4 h-4" aria-hidden />
              Mark Complete
            </Button>
          ) : nextLesson ? (
            <Button className="flex-1" asChild>
              <Link href={`/learn/${catSlug}/${topicSlug}/${nextLesson.slug}`}>
                Next Lesson
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </Button>
          ) : (
            <div className="flex-1 flex items-center justify-center text-green-600 text-sm font-medium gap-1">
              <Check className="w-4 h-4" />
              Section Complete
            </div>
          )}
        </div>
      )}
    </div>
  );
}
