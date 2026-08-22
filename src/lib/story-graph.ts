/**
 * Story Graph — builds a knowledge graph of AI stories showing hidden
 * connections between stories that share entities, models, topics, or
 * source coverage. Pure functions, fully unit-testable.
 *
 * The graph reveals clusters of related stories: e.g. when OpenAI, Google
 * and Anthropic all publish papers on the same benchmark, the graph shows
 * a triangle of connections between those stories — something no list view
 * can convey.
 */

import type { Story } from './types';

/* ── Graph types ─────────────────────────────────────────────────────── */

export interface GraphNode {
  id: string;
  label: string;
  type: 'story' | 'model' | 'entity' | 'topic' | 'source' | 'benchmark';
  /** Number of connections (degree centrality). */
  degree: number;
  /** Size multiplier for visual rendering (0-1). */
  size: number;
  /** Story-level metadata (only for story nodes). */
  story?: {
    title: string;
    link: string;
    sourceId: string;
    date: string;
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  /** Edge weight: higher = stronger connection. */
  weight: number;
  /** Label for the edge (e.g. "shares model", "same entity"). */
  label: string;
}

export interface StoryGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Pre-computed clusters: groups of nodes that are tightly connected. */
  clusters: GraphCluster[];
  /** Summary stats. */
  stats: {
    totalNodes: number;
    totalEdges: number;
    totalClusters: number;
    avgDegree: number;
  };
}

export interface GraphCluster {
  id: string;
  label: string;
  nodeIds: string[];
  /** Primary topic/entity that defines this cluster. */
  theme: string;
  /** Strength: how tightly connected (0-1). */
  cohesion: number;
}

/* ── Graph building ──────────────────────────────────────────────────── */

/**
 * Build a complete story graph from a set of stories. The graph includes:
 * - Story nodes (one per story)
 * - Model nodes (one per unique model mentioned)
 * - Entity nodes (one per unique entity/company)
 * - Topic nodes (one per unique topic tag)
 * - Source nodes (one per unique source)
 * - Benchmark nodes (one per unique benchmark)
 * - Edges connecting stories to their models, entities, topics, sources, benchmarks
 * - Edges between stories that share multiple connections (cross-links)
 */
export function buildStoryGraph(stories: Story[]): StoryGraph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  // Helper: add an edge if not already present
  const addEdge = (source: string, target: string, label: string, weight = 1) => {
    const key = source < target ? `${source}|${target}` : `${target}|${source}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ source, target, weight, label });
  };

  // Helper: ensure a node exists
  const ensureNode = (id: string, label: string, type: GraphNode['type'], meta?: Partial<GraphNode>) => {
    if (!nodes.has(id)) {
      nodes.set(id, { id, label, type, degree: 0, size: 0, ...meta });
    }
    return nodes.get(id)!;
  };

  // 1. Create story nodes
  for (const s of stories) {
    ensureNode(s.id, s.title, 'story', {
      story: {
        title: s.title,
        link: s.link,
        sourceId: s.sourceId,
        date: s.date.toISOString(),
      },
    });
  }

  // 2. Create model/entity/topic/source/benchmark nodes + story→X edges
  for (const s of stories) {
    // Models
    for (const m of s.models) {
      const nodeId = `model:${m}`;
      ensureNode(nodeId, m, 'model');
      addEdge(s.id, nodeId, 'mentions model', 2);
    }

    // Topics
    for (const t of s.topics) {
      const nodeId = `topic:${t}`;
      ensureNode(nodeId, t, 'topic');
      addEdge(s.id, nodeId, 'tagged', 1);
    }

    // Source
    const srcNodeId = `source:${s.sourceId}`;
    ensureNode(srcNodeId, s.sourceId, 'source');
    addEdge(s.id, srcNodeId, 'published by', 1);

    // Benchmarks
    for (const b of s.benchmarks) {
      const nodeId = `bench:${b.benchmark}`;
      ensureNode(nodeId, b.benchmark, 'benchmark');
      addEdge(s.id, nodeId, 'references benchmark', 2);
    }
  }

  // 3. Cross-link stories that share models (stronger signal = shared model)
  const modelStories = new Map<string, string[]>();
  for (const s of stories) {
    for (const m of s.models) {
      if (!modelStories.has(m)) modelStories.set(m, []);
      modelStories.get(m)!.push(s.id);
    }
  }
  for (const [, storyIds] of modelStories) {
    if (storyIds.length < 2 || storyIds.length > 20) continue;
    for (let i = 0; i < storyIds.length; i++) {
      for (let j = i + 1; j < storyIds.length; j++) {
        addEdge(storyIds[i], storyIds[j], 'same model', 3);
      }
    }
  }

  // 4. Cross-link stories that share multiple topics
  const topicStories = new Map<string, string[]>();
  for (const s of stories) {
    for (const t of s.topics) {
      if (!topicStories.has(t)) topicStories.set(t, []);
      topicStories.get(t)!.push(s.id);
    }
  }
  for (const [, storyIds] of topicStories) {
    if (storyIds.length < 2 || storyIds.length > 15) continue;
    for (let i = 0; i < storyIds.length; i++) {
      for (let j = i + 1; j < storyIds.length; j++) {
        addEdge(storyIds[i], storyIds[j], 'same topic', 1);
      }
    }
  }

  // 5. Compute degree centrality
  for (const e of edges) {
    const src = nodes.get(e.source);
    const tgt = nodes.get(e.target);
    if (src) src.degree += e.weight;
    if (tgt) tgt.degree += e.weight;
  }

  // 6. Normalize sizes (0-1 based on max degree)
  const maxDegree = Math.max(1, ...[...nodes.values()].map((n) => n.degree));
  for (const n of nodes.values()) {
    n.size = Math.min(1, n.degree / maxDegree);
  }

  // 7. Detect clusters using a simple connected-component + topic overlap approach
  const clusters = detectClusters(nodes, edges);

  const nodeList = [...nodes.values()];
  const avgDegree = nodeList.length > 0 ? nodeList.reduce((s, n) => s + n.degree, 0) / nodeList.length : 0;

  return {
    nodes: nodeList,
    edges,
    clusters,
    stats: {
      totalNodes: nodeList.length,
      totalEdges: edges.length,
      totalClusters: clusters.length,
      avgDegree: Math.round(avgDegree * 10) / 10,
    },
  };
}

/* ── Cluster detection ───────────────────────────────────────────────── */

/**
 * Detect clusters by finding connected components among story nodes,
 * then labeling each cluster by its most common topic/model.
 */
function detectClusters(
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
): GraphCluster[] {
  // Build adjacency list for story nodes only
  const adj = new Map<string, Set<string>>();
  for (const n of nodes.values()) {
    if (n.type === 'story') adj.set(n.id, new Set());
  }
  for (const e of edges) {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.add(e.target);
      adj.get(e.target)!.add(e.source);
    }
  }

  // BFS to find connected components (clusters)
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const component: string[] = [];
    const queue = [start];
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node)) continue;
      visited.add(node);
      component.push(node);
      for (const neighbor of adj.get(node) || []) {
        if (!visited.has(neighbor)) queue.push(neighbor);
      }
    }
    if (component.length >= 2) components.push(component);
  }

  // Label each cluster by its most frequent topic or model
  return components.map((memberIds, i) => {
    const topicCounts = new Map<string, number>();
    const modelCounts = new Map<string, number>();

    for (const id of memberIds) {
      const node = nodes.get(id);
      if (!node?.story) continue;
      // Count topics and models from connected nodes
      for (const e of edges) {
        const other = e.source === id ? e.target : e.target === id ? e.source : null;
        if (!other) continue;
        const otherNode = nodes.get(other);
        if (!otherNode) continue;
        if (otherNode.type === 'topic') {
          topicCounts.set(otherNode.label, (topicCounts.get(otherNode.label) || 0) + 1);
        }
        if (otherNode.type === 'model') {
          modelCounts.set(otherNode.label, (modelCounts.get(otherNode.label) || 0) + 1);
        }
      }
    }

    // Pick the most common topic or model as the cluster label
    let theme = 'Related Stories';
    const allCounts = [
      ...[...topicCounts.entries()].map(([k, v]) => ({ label: k, count: v, type: 'topic' })),
      ...[...modelCounts.entries()].map(([k, v]) => ({ label: k, count: v, type: 'model' })),
    ].sort((a, b) => b.count - a.count);

    if (allCounts.length > 0) {
      theme = allCounts[0].label;
    }

    // Cohesion: ratio of actual edges to possible edges within the component
    let internalEdges = 0;
    for (const e of edges) {
      if (memberIds.includes(e.source) && memberIds.includes(e.target)) internalEdges++;
    }
    const possibleEdges = (memberIds.length * (memberIds.length - 1)) / 2;
    const cohesion = possibleEdges > 0 ? Math.min(1, internalEdges / possibleEdges) : 0;

    return {
      id: `cluster-${i}`,
      label: theme,
      nodeIds: memberIds,
      theme,
      cohesion: Math.round(cohesion * 100) / 100,
    };
  }).sort((a, b) => b.nodeIds.length - a.nodeIds.length);
}

/* ── Graph query helpers ─────────────────────────────────────────────── */

/** Get the N most connected (highest degree) nodes of a given type. */
export function topNodes(graph: StoryGraph, type: GraphNode['type'], n = 10): GraphNode[] {
  return graph.nodes
    .filter((n) => n.type === type)
    .sort((a, b) => b.degree - a.degree)
    .slice(0, n);
}

/** Get all edges connected to a specific node. */
export function nodeEdges(graph: StoryGraph, nodeId: string): GraphEdge[] {
  return graph.edges.filter((e) => e.source === nodeId || e.target === nodeId);
}

/** Get the neighbors of a node (the other end of each edge). */
export function neighbors(graph: StoryGraph, nodeId: string): GraphNode[] {
  const neighborIds = new Set<string>();
  for (const e of graph.edges) {
    if (e.source === nodeId) neighborIds.add(e.target);
    if (e.target === nodeId) neighborIds.add(e.source);
  }
  return [...neighborIds].map((id) => graph.nodes.find((n) => n.id === id)).filter(Boolean) as GraphNode[];
}

/** Compute betweenness centrality approximation for the top N nodes. */
export function centralityRanking(graph: StoryGraph, n = 10): { node: GraphNode; centrality: number }[] {
  // Simplified: use degree centrality as a proxy for betweenness
  const storyNodes = graph.nodes.filter((n) => n.type === 'story');
  const maxDeg = Math.max(1, ...storyNodes.map((n) => n.degree));
  return storyNodes
    .map((node) => ({ node, centrality: node.degree / maxDeg }))
    .sort((a, b) => b.centrality - a.centrality)
    .slice(0, n);
}
