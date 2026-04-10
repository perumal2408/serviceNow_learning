"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Flame, Star, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatTime } from "@/lib/utils";

interface StatsData {
  totalLessons: number;
  completedLessons: number;
  currentStreak: number;
  longestStreak: number;
  totalTimeSpent: number;
  averageScore: number | null;
  categoryProgress: {
    categorySlug: string;
    name: string;
    color: string | null;
    completed: number;
    total: number;
  }[];
  recentActivity: {
    snippetSlug: string;
    title: string;
    categoryName: string;
    completedAt: string;
  }[];
  nextRecommended: {
    slug: string;
    title: string;
    categorySlug: string;
    topicSlug: string;
  } | null;
  streakDates: string[];
}

function ProgressRing({
  value,
  size = 100,
  strokeWidth = 8,
  color = "hsl(var(--primary))",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={size} height={size} role="img" aria-label={`${value}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="text-sm font-bold fill-foreground">
        {value}%
      </text>
    </svg>
  );
}

export function DashboardView() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const overallPct = stats && stats.totalLessons > 0
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your ServiceNow learning progress</p>
      </div>

      {/* Continue learning CTA */}
      {stats?.nextRecommended && (
        <Link
          href={`/learn/${stats.nextRecommended.categorySlug}/${stats.nextRecommended.topicSlug}/${stats.nextRecommended.slug}`}
          className="flex items-center gap-3 bg-primary text-primary-foreground rounded-lg p-4 min-h-[64px] hover:bg-primary/90 transition-colors"
        >
          <Zap className="w-5 h-5 shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium opacity-80">Continue Learning</p>
            <p className="font-semibold text-sm line-clamp-1">{stats.nextRecommended.title}</p>
          </div>
          <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
        </Link>
      )}

      {/* Key stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <BookOpen className="w-5 h-5 text-primary mb-1" aria-hidden />
            <p className="text-2xl font-bold">{stats?.completedLessons ?? 0}</p>
            <p className="text-xs text-muted-foreground text-center">Lessons Complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Flame className="w-5 h-5 text-orange-500 mb-1" aria-hidden />
            <p className="text-2xl font-bold">{stats?.currentStreak ?? 0}</p>
            <p className="text-xs text-muted-foreground text-center">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Clock className="w-5 h-5 text-blue-500 mb-1" aria-hidden />
            <p className="text-2xl font-bold">{formatTime(stats?.totalTimeSpent ?? 0)}</p>
            <p className="text-xs text-muted-foreground text-center">Time Spent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Star className="w-5 h-5 text-yellow-500 mb-1" aria-hidden />
            <p className="text-2xl font-bold">{stats?.averageScore ?? "—"}{stats?.averageScore != null ? "%" : ""}</p>
            <p className="text-xs text-muted-foreground text-center">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall progress + category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {/* Ring */}
        <Card className="flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <ProgressRing value={overallPct} size={120} strokeWidth={10} />
            <div className="text-center">
              <p className="font-semibold">Overall Progress</p>
              <p className="text-xs text-muted-foreground">
                {stats?.completedLessons ?? 0} / {stats?.totalLessons ?? 0} lessons
              </p>
            </div>
          </div>
        </Card>

        {/* Category progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Progress by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.categoryProgress.map((cat) => {
              const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
              return (
                <div key={cat.categorySlug}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color ?? "#6366f1" }}
                        aria-hidden
                      />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {cat.completed}/{cat.total}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    aria-label={`${cat.name}: ${pct}% complete`}
                  />
                </div>
              );
            })}
            {!stats?.categoryProgress.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data yet — start a lesson to see your progress!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {stats.recentActivity.map((item) => (
                <li key={item.snippetSlug} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4 text-green-500" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                  </div>
                  <time className="text-xs text-muted-foreground shrink-0" dateTime={item.completedAt}>
                    {new Date(item.completedAt).toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/roadmap">
            <ArrowRight className="w-4 h-4" aria-hidden />
            View Roadmap
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/profile">
            <Star className="w-4 h-4" aria-hidden />
            View Bookmarks
          </Link>
        </Button>
      </div>
    </div>
  );
}
