"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export const CategoryHeaderNode = memo(function CategoryHeaderNode({ data }: NodeProps) {
  const { label, color } = data as { label: string; color: string | null };
  return (
    <div
      className="px-4 py-2 rounded-lg font-bold text-sm text-white shadow"
      style={{ backgroundColor: color ?? "#6366f1", minWidth: 200, textAlign: "center" }}
    >
      {label}
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
});
