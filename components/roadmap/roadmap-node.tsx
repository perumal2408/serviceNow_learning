"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import Link from "next/link";
import { Clock, CheckCircle2, Circle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { RoadmapSnippet } from "@/lib/roadmap/graph-data";

const DIFFICULTY_COLORS = {
  BEGINNER: "bg-green-500/10 text-green-700 dark:text-green-400",
  INTERMEDIATE: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ADVANCED: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  EXPERT: "bg-red-500/10 text-red-700 dark:text-red-400",
} as const;

const STATUS_ICONS = {
  NOT_STARTED: Circle,
  IN_PROGRESS: Circle,
  COMPLETED: CheckCircle2,
  MASTERED: Star,
};

type NodeData = {
  snippet: RoadmapSnippet;
  categoryColor: string | null;
  categorySlug: string;
  topicSlug: string;
};

export const RoadmapNode = memo(function RoadmapNode({ data }: NodeProps) {
  const { snippet, categoryColor, categorySlug, topicSlug } = data as NodeData;
  const StatusIcon = STATUS_ICONS[snippet.status as keyof typeof STATUS_ICONS] ?? Circle;
  const isComplete = snippet.status === "COMPLETED" || snippet.status === "MASTERED";

  return (
    <Link
      href={`/learn/${categorySlug}/${topicSlug}/${snippet.slug}`}
      className={cn(
        "block w-[220px] rounded-lg border-2 bg-card p-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring",
        isComplete ? "border-green-500/50" : "border-border"
      )}
      style={isComplete ? {} : { borderLeftColor: categoryColor ?? "#6366f1", borderLeftWidth: 3 }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-medium leading-snug line-clamp-2 flex-1">{snippet.title}</p>
        <StatusIcon
          className={cn(
            "w-4 h-4 shrink-0 mt-0.5",
            isComplete ? "text-green-500" : "text-muted-foreground"
          )}
          aria-label={`Status: ${snippet.status}`}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", DIFFICULTY_COLORS[snippet.difficulty as keyof typeof DIFFICULTY_COLORS] ?? DIFFICULTY_COLORS.BEGINNER)}>
          {snippet.difficulty.charAt(0) + snippet.difficulty.slice(1).toLowerCase()}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" aria-hidden />
          {snippet.estimatedMinutes}m
        </span>
        {snippet.score !== null && (
          <span className="text-[10px] text-muted-foreground ml-auto">{snippet.score}%</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </Link>
  );
});
