"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Star, List, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapCategory } from "@/lib/roadmap/graph-data";

interface Props {
  categories: RoadmapCategory[];
}

function SnippetIcon({ status }: { status?: string }) {
  if (status === "MASTERED")
    return <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" aria-label="Mastered" />;
  if (status === "COMPLETED" || status === "MASTERED")
    return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" aria-label="Completed" />;
  return <Circle className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" aria-label="Not started" />;
}

/** Flat grouped list — all topics/lessons visible at a glance */
function GroupedListView({ categories }: Props) {
  return (
    <div className="space-y-6" role="list" aria-label="Learning roadmap">
      {categories.map((cat) => {
        const total = cat.topics.reduce((a, t) => a + t.snippets.length, 0);
        const done = cat.topics.reduce(
          (a, t) => a + t.snippets.filter((s) => s.status === "COMPLETED" || s.status === "MASTERED").length,
          0
        );
        return (
          <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
            {/* Category header */}
            <div className="flex items-center gap-2.5 mb-3">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color ?? "#6366f1" }}
                aria-hidden
              />
              <h2 id={`cat-${cat.id}`} className="font-bold text-base flex-1">
                {cat.name}
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">{done}/{total}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-muted mb-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: total > 0 ? `${(done / total) * 100}%` : "0%",
                  backgroundColor: cat.color ?? "#6366f1",
                }}
              />
            </div>

            {/* Topics + snippets */}
            <div className="space-y-4">
              {cat.topics.map((topic) => (
                <div key={topic.id}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
                    {topic.name}
                  </p>
                  <ul className="rounded-lg border overflow-hidden divide-y">
                    {topic.snippets.map((snippet) => {
                      const isDone = snippet.status === "COMPLETED" || snippet.status === "MASTERED";
                      return (
                        <li key={snippet.id}>
                          <Link
                            href={`/learn/${cat.slug}/${topic.slug}/${snippet.slug}`}
                            className="flex items-center gap-3 px-3 py-3 hover:bg-accent transition-colors min-h-[44px] group"
                          >
                            <SnippetIcon status={snippet.status} />
                            <span
                              className={cn(
                                "flex-1 text-sm leading-snug group-hover:text-foreground transition-colors",
                                isDone ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""
                              )}
                            >
                              {snippet.title}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                              <Clock className="w-3 h-3" aria-hidden />
                              {snippet.estimatedMinutes}m
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Collapsible accordion tree (original behaviour) */
function AccordionTreeView({ categories }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([categories[0]?.id])
  );
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) =>
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleTopic = (id: string) =>
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <nav className="space-y-2" aria-label="Learning roadmap tree">
      {categories.map((cat) => {
        const catOpen = expandedCategories.has(cat.id);
        const total = cat.topics.reduce((a, t) => a + t.snippets.length, 0);
        const done = cat.topics.reduce(
          (a, t) => a + t.snippets.filter((s) => s.status === "COMPLETED" || s.status === "MASTERED").length,
          0
        );
        return (
          <div key={cat.id} className="rounded-lg border overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors min-h-[56px]"
              onClick={() => toggleCategory(cat.id)}
              aria-expanded={catOpen}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color ?? "#6366f1" }}
                aria-hidden
              />
              <span className="font-semibold flex-1">{cat.name}</span>
              <span className="text-xs text-muted-foreground">{done}/{total}</span>
              {catOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden />
              )}
            </button>

            {catOpen && (
              <div className="border-t bg-card/50">
                {cat.topics.map((topic) => {
                  const topicOpen = expandedTopics.has(topic.id);
                  return (
                    <div key={topic.id} className="border-b last:border-b-0">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors min-h-[48px] text-sm"
                        onClick={() => toggleTopic(topic.id)}
                        aria-expanded={topicOpen}
                      >
                        <span className="text-muted-foreground font-medium flex-1">{topic.name}</span>
                        <span className="text-xs text-muted-foreground">{topic.snippets.length} lessons</span>
                        {topicOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
                        )}
                      </button>

                      {topicOpen && (
                        <ul className="pl-6 pb-2">
                          {topic.snippets.map((snippet) => {
                            const isDone = snippet.status === "COMPLETED" || snippet.status === "MASTERED";
                            return (
                              <li key={snippet.id}>
                                <Link
                                  href={`/learn/${cat.slug}/${topic.slug}/${snippet.slug}`}
                                  className="flex items-center gap-2.5 py-2.5 px-3 rounded-md hover:bg-accent transition-colors text-sm min-h-[44px]"
                                >
                                  <SnippetIcon status={snippet.status} />
                                  <span className={cn("flex-1 line-clamp-1", isDone && "text-muted-foreground")}>
                                    {snippet.title}
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                                    <Clock className="w-3 h-3" aria-hidden />
                                    {snippet.estimatedMinutes}m
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function RoadmapTree({ categories }: Props) {
  const [view, setView] = useState<"list" | "tree">("list");

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-end gap-1 mb-4">
        <button
          onClick={() => setView("list")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            view === "list"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent"
          )}
          aria-pressed={view === "list"}
        >
          <List className="w-3.5 h-3.5" />
          List
        </button>
        <button
          onClick={() => setView("tree")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            view === "tree"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent"
          )}
          aria-pressed={view === "tree"}
        >
          <GitBranch className="w-3.5 h-3.5" />
          Tree
        </button>
      </div>

      {view === "list" ? (
        <GroupedListView categories={categories} />
      ) : (
        <AccordionTreeView categories={categories} />
      )}
    </div>
  );
}
