"use client";

import { useEffect, useRef } from "react";
import type { editor } from "monaco-editor";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function CodeEditorDesktop({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    let disposed = false;

    async function init() {
      const monaco = await import("monaco-editor");
      if (disposed || !containerRef.current) return;

      const ed = monaco.editor.create(containerRef.current, {
        value: valueRef.current,
        language: "javascript",
        theme: document.documentElement.classList.contains("dark") ? "vs-dark" : "vs",
        fontSize: 14,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
        fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
      });

      editorRef.current = ed;
      ed.onDidChangeModelContent(() => {
        onChange(ed.getValue());
      });
    }

    init();

    return () => {
      disposed = true;
      editorRef.current?.dispose();
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes (e.g., reset)
  useEffect(() => {
    const ed = editorRef.current;
    if (ed && ed.getValue() !== value) {
      ed.setValue(value);
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="flex-1 rounded-lg border overflow-hidden min-h-[400px]"
      aria-label="Code editor"
      role="textbox"
      aria-multiline
    />
  );
}
