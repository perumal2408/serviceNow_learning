"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeFile {
  filename: string;
  content: string;
  language: string;
}

interface CodeBlockProps {
  files: CodeFile[];
  highlightLines?: number[];
  className?: string;
}

export function CodeBlock({ files, highlightLines = [], className }: CodeBlockProps) {
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(files[activeFile]?.content ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [files, activeFile]);

  if (!files.length) return null;

  const current = files[activeFile];

  return (
    <div className={cn("rounded-lg border overflow-hidden bg-[#1e1e2e]", className)}>
      {/* File tabs */}
      {files.length > 1 && (
        <div className="flex items-center border-b border-white/10 overflow-x-auto scrollbar-hide px-2 pt-2 gap-1">
          {files.map((file, i) => (
            <button
              key={file.filename}
              onClick={() => setActiveFile(i)}
              className={cn(
                "px-3 py-1.5 text-xs font-mono rounded-t-md whitespace-nowrap min-h-[36px] transition-colors",
                i === activeFile
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {file.filename}
            </button>
          ))}
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs text-white/50 font-mono">
          {files.length === 1 ? current?.filename : current?.language}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 px-2 text-white/60 hover:text-white hover:bg-white/10"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-xs">{copied ? "Copied!" : "Copy"}</span>
        </Button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto custom-scrollbar">
        <pre className="p-4 text-sm font-mono leading-relaxed min-w-0">
          {current?.content.split("\n").map((line, i) => {
            const lineNum = i + 1;
            const isHighlighted = highlightLines.includes(lineNum);
            return (
              <div
                key={i}
                className={cn(
                  "flex gap-4",
                  isHighlighted && "bg-yellow-500/10 -mx-4 px-4 border-l-2 border-yellow-400"
                )}
              >
                <span
                  className="select-none text-white/25 text-right shrink-0 font-mono"
                  style={{ minWidth: "2rem" }}
                  aria-hidden
                >
                  {lineNum}
                </span>
                <span className="text-[#cdd6f4] whitespace-pre">{line || " "}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}
