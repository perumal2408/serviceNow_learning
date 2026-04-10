"use client";

import { useCallback } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function CodeEditorMobile({ value, onChange }: Props) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value),
    [onChange]
  );

  return (
    <div className="rounded-lg border overflow-hidden bg-[#1e1e2e]">
      <div className="px-3 py-1.5 border-b border-white/10 text-xs text-white/40 font-mono">
        JavaScript
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        className="w-full min-h-[300px] p-4 bg-transparent text-[#cdd6f4] font-mono text-base leading-relaxed resize-none outline-none"
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        aria-label="Code editor"
        style={{
          // 16px prevents iOS auto-zoom
          fontSize: "16px",
          WebkitTextSizeAdjust: "none",
        }}
      />
    </div>
  );
}
