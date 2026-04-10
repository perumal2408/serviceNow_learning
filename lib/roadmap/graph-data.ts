import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

export interface RoadmapSnippet {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  estimatedMinutes: number;
  prerequisites: string[];
  overview: string | null;
  status: string;
  score: number | null;
}

export interface RoadmapTopic {
  id: string;
  name: string;
  slug: string;
  snippets: RoadmapSnippet[];
}

export interface RoadmapCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  topics: RoadmapTopic[];
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;
const CATEGORY_HEADER_HEIGHT = 50;

export function buildFlowGraph(categories: RoadmapCategory[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB",
    ranksep: 80,
    nodesep: 40,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const slugToId: Record<string, string> = {};

  // Build slug → node id map first
  for (const cat of categories) {
    for (const topic of cat.topics) {
      for (const snippet of topic.snippets) {
        slugToId[snippet.slug] = snippet.id;
      }
    }
  }

  // Add nodes per category group
  for (const cat of categories) {
    // Category group node
    const catNodeId = `cat-${cat.id}`;
    g.setNode(catNodeId, { width: NODE_WIDTH + 40, height: CATEGORY_HEADER_HEIGHT });

    nodes.push({
      id: catNodeId,
      type: "categoryHeader",
      data: { label: cat.name, color: cat.color, icon: cat.icon },
      position: { x: 0, y: 0 },
    });

    let prevTopicId: string | null = null;

    for (const topic of cat.topics) {
      const topicNodeId = `topic-${topic.id}`;
      g.setNode(topicNodeId, { width: NODE_WIDTH, height: 40 });

      nodes.push({
        id: topicNodeId,
        type: "topicLabel",
        data: { label: topic.name },
        position: { x: 0, y: 0 },
      });

      // Link category header → first topic
      if (prevTopicId === null) {
        g.setEdge(catNodeId, topicNodeId);
        edges.push({
          id: `e-${catNodeId}-${topicNodeId}`,
          source: catNodeId,
          target: topicNodeId,
          type: "smoothstep",
          style: { opacity: 0.3 },
        });
      } else {
        g.setEdge(prevTopicId, topicNodeId);
        edges.push({
          id: `e-${prevTopicId}-${topicNodeId}`,
          source: prevTopicId,
          target: topicNodeId,
          type: "smoothstep",
          style: { opacity: 0.3 },
        });
      }
      prevTopicId = topicNodeId;

      let prevSnippetId: string | null = null;

      for (const snippet of topic.snippets) {
        g.setNode(snippet.id, { width: NODE_WIDTH, height: NODE_HEIGHT });

        nodes.push({
          id: snippet.id,
          type: "snippetNode",
          data: {
            snippet,
            categoryColor: cat.color,
            categorySlug: cat.slug,
            topicSlug: topic.slug,
          },
          position: { x: 0, y: 0 },
        });

        // Sequential edge from topic label
        if (prevSnippetId === null) {
          g.setEdge(topicNodeId, snippet.id);
          edges.push({
            id: `e-${topicNodeId}-${snippet.id}`,
            source: topicNodeId,
            target: snippet.id,
            type: "smoothstep",
          });
        } else {
          g.setEdge(prevSnippetId, snippet.id);
          edges.push({
            id: `e-${prevSnippetId}-${snippet.id}`,
            source: prevSnippetId,
            target: snippet.id,
            type: "smoothstep",
          });
        }
        prevSnippetId = snippet.id;

        // Explicit prerequisite cross-edges
        for (const prereqSlug of snippet.prerequisites) {
          const prereqId = slugToId[prereqSlug];
          if (prereqId && prereqId !== prevSnippetId) {
            edges.push({
              id: `e-prereq-${prereqId}-${snippet.id}`,
              source: prereqId,
              target: snippet.id,
              type: "smoothstep",
              animated: true,
              style: { stroke: "#f59e0b", strokeDasharray: "5,3" },
            });
          }
        }
      }
    }
  }

  dagre.layout(g);

  // Apply dagre positions to nodes
  return {
    nodes: nodes.map((node) => {
      const pos = g.node(node.id);
      return {
        ...node,
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      };
    }),
    edges,
  };
}
