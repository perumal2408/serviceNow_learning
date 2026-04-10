"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export const TopicLabelNode = memo(function TopicLabelNode({ data }: NodeProps) {
  const { label } = data as { label: string };
  return (
    <div className="px-3 py-1 rounded-full bg-muted border text-xs font-medium text-muted-foreground text-center">
      {label}
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
});
