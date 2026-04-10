"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "MASTERED";

interface SnippetProgress {
  status: ProgressStatus;
  score?: number;
  timeSpent: number;
  completedAt?: string;
}

interface ProgressState {
  progress: Record<string, SnippetProgress>; // key = snippetSlug
  setProgress: (slug: string, progress: SnippetProgress) => void;
  markComplete: (slug: string, score?: number) => void;
  updateTimeSpent: (slug: string, seconds: number) => void;
  getStatus: (slug: string) => ProgressStatus;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      setProgress: (slug, progress) =>
        set((state) => ({ progress: { ...state.progress, [slug]: progress } })),
      markComplete: (slug, score) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [slug]: {
              ...state.progress[slug],
              status: score && score >= 90 ? "MASTERED" : "COMPLETED",
              score,
              completedAt: new Date().toISOString(),
              timeSpent: state.progress[slug]?.timeSpent ?? 0,
            },
          },
        })),
      updateTimeSpent: (slug, seconds) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [slug]: {
              ...state.progress[slug],
              status: state.progress[slug]?.status ?? "IN_PROGRESS",
              timeSpent: (state.progress[slug]?.timeSpent ?? 0) + seconds,
            },
          },
        })),
      getStatus: (slug) => get().progress[slug]?.status ?? "NOT_STARTED",
    }),
    { name: "sn-progress" }
  )
);
