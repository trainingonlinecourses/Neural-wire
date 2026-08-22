'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ago } from '@/lib/utils';

/**
 * Model Capability Matrix — interactive radar comparison of AI models
 * across 8 dimensions. Compare any two models head-to-head with a
 * visual radar chart rendered in pure CSS/SVG.
 */

interface CapabilityDimension {
  id: string;
  label: string;
  icon: string;
  score: number;
  source?: string;
}

interface ModelProfile {
  name: string;
  vendor: string;
  dimensions: CapabilityDimension[];
  composite: number;
  costTier: string;
  contextWindow?: number;
  sources: string[];
}

interface MatrixPayload {
  profiles: ModelProfile[];
  dimensions: { id: string; label: string; icon: string }[];
  valueRanking: { name: string; vendor: string; valueScore: number; composite: number }[];
  generatedAt: number;
}

const COST_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'FREE', color: '#22c55e' },
  low: { label: 'LOW', color: '#86efac' },
  medium: { label: 'MED', color: '#f59e0b' },
  high: { label: 'HIGH', color: '#f97316' },
  premium: { label: 'PREM', color: '#ef4444' },
};

function RadarChart({ profiles, dimensions, size = 200 }: {
  profiles: ModelProfile[];
  dimensions: { id: string; label: string; icon: string }[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 30;
  const n = dimensions.length;

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Axis lines + labels
  const axes = dimensions.map((d, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (r + 20) * Math.cos(angle),
      ly: cy + (r + 20) * Math.sin(angle),
      label: d.icon + ' ' + d.label,
    };
  });

  // Model polygons
  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

  const modelPaths = profiles.map((p, pi) => {
    const points = dimensions.map((d, i) => {
      const dim = p.dimensions.find((x) => x.id === d.id);
      const score = dim ? dim.score / 100 : 0;
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return `${cx + r * score * Math.cos(angle)},${cy + r * score * Math.sin(angle)}`;
    });
    return { path: points.join(' '), color: COLORS[pi % COLORS.length], name: p.name };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar-svg">
      {/* Grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={dimensions.map((_, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            return `${cx + r * ring * Math.cos(angle)},${cy + r * ring * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="var(--border, #374151)"
          strokeWidth="0.5"
          opacity="0.5"
        />
      ))}
      {/* Axis lines */}
      {axes.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="var(--border, #374151)" strokeWidth="0.5" opacity="0.4" />
      ))}
      {/* Model polygons */}
      {modelPaths.map((m) => (
        <polygon key={m.name} points={m.path} fill={m.color} fillOpacity="0.15" stroke={m.color} strokeWidth="2" />
      ))}
      {/* Axis labels */}
      {axes.map((a, i) => (
        <text key={i} x={a.lx} y={a.ly} textAnchor="middle" dominantBaseline="middle" fill="var(--fg, #e5e7eb)" fontSize="8" fontFamily="var(--font-space)">
          {a.label}
        </text>
      ))}
    </svg>
  );
}

export function CapabilityMatrixView() {
  const [data, setData] = useState<MatrixPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedA, setSelectedA] = useState<string>('GPT-4o');
  const [selectedB, setSelectedB] = useState<string>('Claude Opus 4');
  const [viewMode, setViewMode] = useState<'compare' | 'ranking' | 'value'>('compare');

  const load = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    fetch('/api/capability-matrix', { cache: force ? 'no-store' : 'default' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json() as Promise<MatrixPayload>;
      })
      .then((j) => setData(j))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const profileA = useMemo(() => data?.profiles.find((p) => p.name === selectedA), [data, selectedA]);
  const profileB = useMemo(() => data?.profiles.find((p) => p.name === selectedB), [data, selectedB]);

  if (!data && loading) {
    return (
      <div className="wrap">
        <p className="empty">⟳ Loading capability profiles…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap">
        <p className="empty"><b>Matrix unavailable ({error})</b></p>
        <button className="btn" onClick={() => load(true)}>RETRY</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            <button className={'seg-btn' + (viewMode === 'compare' ? ' active' : '')} onClick={() => setViewMode('compare')}>
              📊 COMPARE
            </button>
            <button className={'seg-btn' + (viewMode === 'ranking' ? ' active' : '')} onClick={() => setViewMode('ranking')}>
              🏆 RANKING
            </button>
            <button className={'seg-btn' + (viewMode === 'value' ? ' active' : '')} onClick={() => setViewMode('value')}>
              💰 VALUE
            </button>
          </div>
          <button className="btn primary" onClick={() => load(true)} disabled={loading}>
            {loading ? 'LOADING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>

      {viewMode === 'compare' && (
        <>
          <div className="wrap">
            <div className="capability-selectors">
              <div className="cap-sel">
                <label>MODEL A</label>
                <select value={selectedA} onChange={(e) => setSelectedA(e.target.value)}>
                  {data.profiles.map((p) => (
                    <option key={p.name} value={p.name}>{p.name} ({p.vendor})</option>
                  ))}
                </select>
              </div>
              <div className="cap-sel">VS</div>
              <div className="cap-sel">
                <label>MODEL B</label>
                <select value={selectedB} onChange={(e) => setSelectedB(e.target.value)}>
                  {data.profiles.map((p) => (
                    <option key={p.name} value={p.name}>{p.name} ({p.vendor})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="wrap">
            <div className="capability-compare">
              {profileA && profileB && (
                <>
                  <div className="cc-radar">
                    <RadarChart profiles={[profileA, profileB]} dimensions={data.dimensions} />
                    <div className="cc-legend">
                      <span className="cc-legend-item" style={{ color: '#3b82f6' }}>● {profileA.name}</span>
                      <span className="cc-legend-item" style={{ color: '#ef4444' }}>● {profileB.name}</span>
                    </div>
                  </div>
                  <div className="cc-dimensions">
                    {data.dimensions.map((d) => {
                      const aScore = profileA.dimensions.find((x) => x.id === d.id)?.score || 0;
                      const bScore = profileB.dimensions.find((x) => x.id === d.id)?.score || 0;
                      const winner = aScore > bScore ? 'a' : bScore > aScore ? 'b' : 'tie';
                      return (
                        <div key={d.id} className="cc-dim-row">
                          <span className="cc-dim-label">{d.icon} {d.label}</span>
                          <div className="cc-dim-bar-container">
                            <div className="cc-dim-bar left" style={{
                              width: `${aScore}%`,
                              background: winner === 'a' ? '#3b82f6' : '#1e3a5f',
                            }} />
                            <div className="cc-dim-bar right" style={{
                              width: `${bScore}%`,
                              background: winner === 'b' ? '#ef4444' : '#5f1e1e',
                            }} />
                          </div>
                          <span className="cc-dim-score a" style={{ color: winner === 'a' ? '#3b82f6' : undefined }}>
                            {aScore}
                          </span>
                          <span className="cc-dim-score b" style={{ color: winner === 'b' ? '#ef4444' : undefined }}>
                            {bScore}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="cc-summary">
                    <div className="cc-composite">
                      <span style={{ color: '#3b82f6' }}>{profileA.composite}</span>
                      <span className="dim">vs</span>
                      <span style={{ color: '#ef4444' }}>{profileB.composite}</span>
                    </div>
                    <span className="cc-cost">
                      {COST_LABELS[profileA.costTier]?.label} vs {COST_LABELS[profileB.costTier]?.label}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {viewMode === 'ranking' && (
        <div className="wrap">
          <div className="capability-ranking">
            {data.profiles.map((p, i) => (
              <div key={p.name} className="cr-row">
                <span className="cr-rank">#{i + 1}</span>
                <span className="cr-name">{p.name}</span>
                <span className="cr-vendor dim">{p.vendor}</span>
                <span className="cr-score">{p.composite}</span>
                <span className="cr-cost" style={{ color: COST_LABELS[p.costTier]?.color }}>
                  {COST_LABELS[p.costTier]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'value' && (
        <div className="wrap">
          <div className="meta-row">
            <span>VALUE RANKING — composite score × cost efficiency (higher = better bang for buck)</span>
            <span className="meta-right dim">updated {ago(new Date(data.generatedAt))}</span>
          </div>
          <div className="capability-ranking">
            {data.valueRanking.map((p, i) => (
              <div key={p.name} className="cr-row">
                <span className="cr-rank">#{i + 1}</span>
                <span className="cr-name">{p.name}</span>
                <span className="cr-vendor dim">{p.vendor}</span>
                <span className="cr-score">{p.valueScore}</span>
                <span className="cr-sub dim">({p.composite} quality)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wrap">
        <p className="dim" style={{ textAlign: 'center', marginTop: 16, fontSize: '0.7rem' }}>
          Scores from LMSYS Chatbot Arena, MMLU, HumanEval, MATH, MMMU, GPQA, and community benchmarks.
          Context windows from official documentation.
        </p>
      </div>
    </>
  );
}
