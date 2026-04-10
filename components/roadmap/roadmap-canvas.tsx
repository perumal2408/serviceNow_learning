"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { buildFlowGraph, type RoadmapCategory } from "@/lib/roadmap/graph-data";
import { RoadmapNode } from "./roadmap-node";
import { CategoryHeaderNode } from "./category-header-node";
import { TopicLabelNode } from "./topic-label-node";
import { useRouter } from "next/navigation";

const nodeTypes: NodeTypes = {
  snippetNode: RoadmapNode,
  categoryHeader: CategoryHeaderNode,
  topicLabel: TopicLabelNode,
};

interface Props {
  categories: RoadmapCategory[];
}

export function RoadmapCanvas({ categories }: Props) {
  const router = useRouter();
  const { nodes: initialNodes, edges: initialEdges } = buildFlowGraph(categories);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string; data: { snippet?: { slug: string }; categorySlug?: string; topicSlug?: string } }) => {
      if (node.data?.snippet) {
        const d = node.data as { snippet: { slug: string }; categorySlug: string; topicSlug: string };
        router.push(`/learn/${d.categorySlug}/${d.topicSlug}/${d.snippet.slug}`);
      }
    },
    [router]
  );

  return (
    <div className="h-[75vh] w-full rounded-lg border overflow-hidden bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick as (e: React.MouseEvent, node: Parameters<typeof onNodeClick>[1]) => void}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        aria-label="Learning roadmap graph"
      >
        <Background gap={20} size={1} />
        <Controls
          showInteractive={false}
          aria-label="Roadmap controls"
        />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bg-card !border"
          aria-label="Roadmap minimap"
        />
      </ReactFlow>
    </div>
  );
}
