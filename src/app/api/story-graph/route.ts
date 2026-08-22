import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { buildStoryGraph, topNodes } from '@/lib/story-graph';

export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * GET /api/story-graph
 * Returns a knowledge graph of AI stories showing connections via shared
 * entities, models, topics, and sources.
 */
export async function GET() {
  const data = await getNewsData();
  const graph = buildStoryGraph(data.stories);

  // Return top nodes by type for quick rendering
  const topModels = topNodes(graph, 'model', 15);
  const topTopics = topNodes(graph, 'topic', 10);
  const topSources = topNodes(graph, 'source', 10);

  return NextResponse.json({
    graph: {
      nodes: graph.nodes.filter((n) => n.type === 'story').slice(0, 100),
      edges: graph.edges.filter((e) => {
        const src = graph.nodes.find((n) => n.id === e.source);
        const tgt = graph.nodes.find((n) => n.id === e.target);
        return src?.type === 'story' || tgt?.type === 'story';
      }).slice(0, 300),
      clusters: graph.clusters,
      stats: graph.stats,
    },
    highlights: { topModels, topTopics, topSources },
    demo: data.demo,
    generatedAt: Date.now(),
  });
}
