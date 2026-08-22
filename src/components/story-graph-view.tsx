'use client';

import { useCallback, useEffect, useState } from 'react';
import { ago } from '@/lib/utils';

/**
 * Story Graph — visual knowledge graph showing how AI stories connect
 * through shared models, topics, and entities. Pure CSS node layout
 * with a force-directed-inspired grid arrangement.
 */

interface GraphNode {
  id: string;
  label: string;
  type: 'story' | 'model' | 'entity' | 'topic' | 'source' | 'benchmark';
  degree: number;
  size: number;
  story?: { title: string; link: string; sourceId: string; date: string };
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  label: string;
}

interface GraphCluster {
  id: string;
  label: string;
  nodeIds: string[];
  theme: string;
  cohesion: number;
}

interface GraphPayload {
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    clusters: GraphCluster[];
    stats: { totalNodes: number; totalEdges: number; totalClusters: number; avgDegree: number };
  };
  highlights: {
    topModels: GraphNode[];
    topTopics: GraphNode[];
    topSources: GraphNode[];
  };
  demo: boolean;
  generatedAt: number;
}

const TYPE_COLORS: Record<string, string> = {
  story: '#3b82f6',
  model: '#f59e0b',
  topic: '#8b5cf6',
  source: '#22c55e',
  entity: '#ec4899',
  benchmark: '#06b6d4',
};

const TYPE_ICONS: Record<string, string> = {
  story: '📰',
  model: '🧠',
  topic: '🏷',
  source: '📡',
  entity: '🏢',
  benchmark: '📊',
};

export function StoryGraphView() {
  const [data, setData] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'clusters' | 'highlights'>('highlights');

  const load = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    fetch('/api/story-graph', { cache: force ? 'no-store' : 'default' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json() as Promise<GraphPayload>;
      })
      .then((j) => setData(j))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data && loading) {
    return (
      <div className="wrap">
        <p className="empty">⟳ Building knowledge graph…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap">
        <p className="empty"><b>Graph unavailable ({error})</b></p>
        <button className="btn" onClick={() => load(true)}>RETRY</button>
      </div>
    );
  }

  if (!data) return null;

  const { graph, highlights } = data;

  // Filter nodes
  const visibleNodes = filter === 'all'
    ? graph.nodes
    : graph.nodes.filter((n) => n.type === filter);

  // Get connected edges for visible nodes
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = graph.edges.filter(
    (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
  );

  // Find neighbors of selected node
  const selectedNeighbors = selectedNode
    ? graph.edges
        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
        .map((e) => e.source === selectedNode.id ? e.target : e.source)
    : [];

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            {['all', 'story', 'model', 'topic', 'source'].map((f) => (
              <button
                key={f}
                className={'seg-btn' + (filter === f ? ' active' : '')}
                onClick={() => { setFilter(f); setSelectedNode(null); }}
              >
                {f === 'all' ? '🌐 ALL' : `${TYPE_ICONS[f] || ''} ${f.toUpperCase()}S`}
              </button>
            ))}
          </div>
          <div className="seg">
            <button
              className={'seg-btn' + (viewMode === 'highlights' ? ' active' : '')}
              onClick={() => setViewMode('highlights')}
            >
              ⭐ HIGHLIGHTS
            </button>
            <button
              className={'seg-btn' + (viewMode === 'clusters' ? ' active' : '')}
              onClick={() => setViewMode('clusters')}
            >
              🔗 CLUSTERS
            </button>
            <button
              className={'seg-btn' + (viewMode === 'graph' ? ' active' : '')}
              onClick={() => setViewMode('graph')}
            >
              🕸 GRAPH
            </button>
          </div>
          <button className="btn primary" onClick={() => load(true)} disabled={loading}>
            {loading ? 'BUILDING…' : '⟳ REBUILD'}
          </button>
        </div>
      </div>

      <div className="wrap">
        <div className="stats">
          <div className="stat"><b>{graph.stats.totalNodes}</b> nodes</div>
          <div className="stat"><b>{graph.stats.totalEdges}</b> connections</div>
          <div className="stat"><b>{graph.stats.totalClusters}</b> clusters</div>
          <div className="stat"><b>{graph.stats.avgDegree}</b> avg connections</div>
        </div>
      </div>

      {viewMode === 'highlights' && (
        <div className="wrap graph-highlights">
          <div className="graph-section">
            <h3>🧠 Top Models in the Graph</h3>
            <div className="graph-node-list">
              {highlights.topModels.map((n) => (
                <button
                  key={n.id}
                  className={'graph-node-chip' + (selectedNode?.id === n.id ? ' selected' : '')}
                  style={{ borderColor: TYPE_COLORS.model }}
                  onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n)}
                >
                  <span className="gnc-icon">{TYPE_ICONS[n.type]}</span>
                  <span className="gnc-label">{n.label}</span>
                  <span className="gnc-degree">{n.degree}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="graph-section">
            <h3>🏷 Hot Topics</h3>
            <div className="graph-node-list">
              {highlights.topTopics.map((n) => (
                <button
                  key={n.id}
                  className={'graph-node-chip' + (selectedNode?.id === n.id ? ' selected' : '')}
                  style={{ borderColor: TYPE_COLORS.topic }}
                  onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n)}
                >
                  <span className="gnc-icon">{TYPE_ICONS[n.type]}</span>
                  <span className="gnc-label">{n.label}</span>
                  <span className="gnc-degree">{n.degree}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="graph-section">
            <h3>📡 Active Sources</h3>
            <div className="graph-node-list">
              {highlights.topSources.map((n) => (
                <button
                  key={n.id}
                  className={'graph-node-chip' + (selectedNode?.id === n.id ? ' selected' : '')}
                  style={{ borderColor: TYPE_COLORS.source }}
                  onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n)}
                >
                  <span className="gnc-icon">{TYPE_ICONS[n.type]}</span>
                  <span className="gnc-label">{n.label}</span>
                  <span className="gnc-degree">{n.degree}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedNode && (
            <div className="graph-detail">
              <h3>{TYPE_ICONS[selectedNode.type]} {selectedNode.label} — Connected Stories</h3>
              <div className="graph-neighbor-list">
                {selectedNeighbors.slice(0, 10).map((nid) => {
                  const n = graph.nodes.find((x) => x.id === nid);
                  if (!n) return null;
                  return (
                    <div key={nid} className="graph-neighbor" style={{ borderLeftColor: TYPE_COLORS[n.type] }}>
                      <span className="gn-type">{TYPE_ICONS[n.type]} {n.type}</span>
                      <span className="gn-label">
                        {n.story ? (
                          <a href={n.story.link} target="_blank" rel="noopener noreferrer">{n.label}</a>
                        ) : n.label}
                      </span>
                      {n.story && <span className="gn-date dim">{ago(new Date(n.story.date))}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'clusters' && (
        <div className="wrap graph-clusters">
          {graph.clusters.length === 0 && (
            <p className="empty">No multi-source clusters detected. Stories may be too diverse.</p>
          )}
          {graph.clusters.slice(0, 8).map((c) => (
            <article key={c.id} className="card">
              <div className="card-accent" style={{ background: 'var(--accent, #3b82f6)' }} />
              <div className="card-body">
                <h3>🔗 {c.label}</h3>
                <div className="models-row">
                  <span className="model-pill">{c.nodeIds.length} connected stories</span>
                  <span className="topic-pill">Cohesion: {Math.round(c.cohesion * 100)}%</span>
                </div>
                <p className="dim">Theme: {c.theme}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {viewMode === 'graph' && (
        <div className="wrap">
          <div className="graph-canvas">
            <div className="graph-legend">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <span key={type} className="gl-item" style={{ color }}>
                  <span className="gl-dot" style={{ background: color }} />
                  {type}
                </span>
              ))}
            </div>
            <div className="graph-nodes">
              {visibleNodes.slice(0, 60).map((n) => (
                <button
                  key={n.id}
                  className={
                    'graph-node' +
                    (selectedNode?.id === n.id ? ' selected' : '') +
                    (selectedNeighbors.includes(n.id) ? ' neighbor' : '')
                  }
                  style={{
                    borderColor: TYPE_COLORS[n.type] || '#666',
                    fontSize: `${10 + n.size * 8}px`,
                    opacity: selectedNode && selectedNode.id !== n.id && !selectedNeighbors.includes(n.id) ? 0.25 : 1,
                  }}
                  title={`${n.label} (${n.type}, degree: ${n.degree})`}
                  onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n)}
                >
                  <span className="gn-icon">{TYPE_ICONS[n.type]}</span>
                  <span className="gn-text">{n.label}</span>
                </button>
              ))}
            </div>
            <p className="dim" style={{ textAlign: 'center', marginTop: 12 }}>
              {visibleEdges.length} connections · click a node to see its neighbors
            </p>
          </div>
        </div>
      )}
    </>
  );
}
