"use client";

import { useBreakpoint } from "@/lib/hooks/use-breakpoint";
import type { RoadmapCategory } from "@/lib/roadmap/graph-data";
import dynamic from "next/dynamic";
import { RoadmapMobile } from "./roadmap-mobile";
import { RoadmapTree } from "./roadmap-tree";

// Only load React Flow on desktop to avoid 5MB bundle on mobile
const RoadmapCanvas = dynamic(() => import("./roadmap-canvas").then((m) => ({ default: m.RoadmapCanvas })), {
  ssr: false,
  loading: () => <div className="h-[70vh] flex items-center justify-center text-muted-foreground">Loading graph...</div>,
});

interface Props {
  categories: RoadmapCategory[];
}

export function RoadmapAdapter({ categories }: Props) {
  const breakpoint = useBreakpoint();

  if (breakpoint === "mobile") return <RoadmapMobile categories={categories} />;
  if (breakpoint === "tablet") return <RoadmapTree categories={categories} />;
  return <RoadmapCanvas categories={categories} />;
}
