"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreakpoint } from "@/lib/hooks/use-breakpoint";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("./code-editor-desktop"), { ssr: false });
const MobileEditor = dynamic(() => import("./code-editor-mobile"), { ssr: false });

interface SnippetData {
  id: string;
  title: string;
  slug: string;
  practicePrompt: string;
  practiceSolution: string | null;
  topic: { category: { slug: string }; slug: string };
}

interface EvalResult {
  totalScore: number;
  scores: { logic: number; apiUsage: number; concept: number; quality: number };
  feedback: string;
  improvements: string[];
  mistakes: string[];
  alternativeSolution?: string;
}

const STARTER_CODE = `// Write your ServiceNow code here
// Hint: Use GlideRecord, GlideSystem, and other ServiceNow APIs

(function() {
  
})();`;

interface Props {
  snippet: SnippetData;
}

export function PlaygroundView({ snippet }: Props) {
  const [code, setCode] = useState(STARTER_CODE);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const breakpoint = useBreakpoint();
  const catSlug = snippet.topic.category.slug;
  const topicSlug = snippet.topic.slug;

  const handleSubmit = useCallback(async () => {
    if (!code.trim() || evaluating) return;
    setEvaluating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snippetSlug: snippet.slug, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Evaluation failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setEvaluating(false);
    }
  }, [code, snippet.slug, evaluating]);

  const InstructionsPanel = (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-2">Exercise</h2>
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm leading-relaxed">
          {snippet.practicePrompt}
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          Your code will be evaluated by AI on logic correctness, API usage, concept understanding, and code quality.
        </p>
      </div>
    </div>
  );

  const EditorPanel = (
    <div className="flex flex-col gap-3 h-full">
      {breakpoint === "desktop" ? (
        <MonacoEditor value={code} onChange={setCode} />
      ) : (
        <MobileEditor value={code} onChange={setCode} />
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCode(STARTER_CODE)}
          aria-label="Reset code"
        >
          <RotateCcw className="w-4 h-4" aria-hidden />
          Reset
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={evaluating || !code.trim()}
        >
          {evaluating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Evaluating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" aria-hidden />
              Submit for Evaluation
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const ResultsPanel = result ? (
    <div className="space-y-4">
      {/* Score */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold">Total Score</span>
          <span className={cn(
            "text-2xl font-bold",
            result.totalScore >= 80 ? "text-green-600 dark:text-green-400" :
            result.totalScore >= 60 ? "text-amber-600 dark:text-amber-400" :
            "text-red-600 dark:text-red-400"
          )}>
            {result.totalScore}/100
          </span>
        </div>
        <Progress
          value={result.totalScore}
          aria-label={`Score: ${result.totalScore}/100`}
          className={cn(
            result.totalScore >= 80 ? "[&>div]:bg-green-500" :
            result.totalScore >= 60 ? "[&>div]:bg-amber-500" :
            "[&>div]:bg-red-500"
          )}
        />
        {/* Sub-scores */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {Object.entries(result.scores).map(([key, val]) => (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</span>
                <span>{val}/25</span>
              </div>
              <Progress value={(val / 25) * 100} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div>
        <p className="font-medium text-sm mb-2">Feedback</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.feedback}</p>
      </div>

      {/* Mistakes */}
      {result.mistakes.length > 0 && (
        <div>
          <p className="font-medium text-sm mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-destructive" aria-hidden />
            Issues Found
          </p>
          <ul className="space-y-1">
            {result.mistakes.map((m, i) => (
              <li key={i} className="text-sm text-destructive/80 flex gap-2">
                <span aria-hidden>•</span>{m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <div>
          <p className="font-medium text-sm mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-primary" aria-hidden />
            Suggestions
          </p>
          <ul className="space-y-1">
            {result.improvements.map((imp, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span aria-hidden>→</span>{imp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ) : error ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {error}
    </div>
  ) : (
    <div className="text-center text-muted-foreground text-sm py-12">
      Submit your code to see AI evaluation results here.
    </div>
  );

  // Mobile: tabbed layout
  if (breakpoint === "mobile") {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/learn/${catSlug}/${topicSlug}/${snippet.slug}`} aria-label="Back to lesson">
              <ArrowLeft className="w-4 h-4" aria-hidden />
            </Link>
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Practice</p>
            <p className="font-semibold text-sm line-clamp-1">{snippet.title}</p>
          </div>
        </div>

        <Tabs defaultValue="instructions">
          <TabsList className="w-full">
            <TabsTrigger value="instructions" className="flex-1">Instructions</TabsTrigger>
            <TabsTrigger value="editor" className="flex-1">Editor</TabsTrigger>
            <TabsTrigger value="results" className="flex-1">Results</TabsTrigger>
          </TabsList>
          <TabsContent value="instructions">{InstructionsPanel}</TabsContent>
          <TabsContent value="editor">{EditorPanel}</TabsContent>
          <TabsContent value="results">{ResultsPanel}</TabsContent>
        </Tabs>
      </div>
    );
  }

  // Tablet: tabbed layout (less compact)
  if (breakpoint === "tablet") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/learn/${catSlug}/${topicSlug}/${snippet.slug}`}>
              <ArrowLeft className="w-4 h-4" />
              Back to lesson
            </Link>
          </Button>
          <h1 className="font-bold text-lg">{snippet.title}</h1>
        </div>
        <Tabs defaultValue="editor">
          <TabsList>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="editor">Code Editor</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          <TabsContent value="instructions" className="mt-4">{InstructionsPanel}</TabsContent>
          <TabsContent value="editor" className="mt-4 min-h-[500px]">{EditorPanel}</TabsContent>
          <TabsContent value="results" className="mt-4">{ResultsPanel}</TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop: split-screen
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/learn/${catSlug}/${topicSlug}/${snippet.slug}`}>
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to lesson
          </Link>
        </Button>
        <h1 className="font-bold text-xl">{snippet.title} — Practice</h1>
      </div>

      <div className="grid grid-cols-[340px_1fr] gap-6 h-[calc(100vh-180px)]">
        {/* Left: instructions + results */}
        <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Exercise</CardTitle>
            </CardHeader>
            <CardContent>{InstructionsPanel}</CardContent>
          </Card>
          {(result || error) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Evaluation Results</CardTitle>
              </CardHeader>
              <CardContent>{ResultsPanel}</CardContent>
            </Card>
          )}
        </div>

        {/* Right: editor */}
        <div className="flex flex-col gap-3">
          {EditorPanel}
        </div>
      </div>
    </div>
  );
}
