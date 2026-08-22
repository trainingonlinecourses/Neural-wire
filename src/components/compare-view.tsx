'use client';

/**
 * Model Quick Compare — pick any two models and see a detailed
 * side-by-side comparison across all benchmarks and capability dimensions.
 * Visual bars show relative strength; winner highlighted per dimension.
 */

import { useMemo, useState } from 'react';
import { BENCH_MODELS, BENCHMARKS, vendorFlag, type ModelBenchEntry } from '@/lib/benchmarks';
import { buildCapabilityMatrix, compareModels, type ModelProfile } from '@/lib/capability-matrix';

const COST_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'FREE', color: '#22c55e' },
  low: { label: 'LOW', color: '#86efac' },
  medium: { label: 'MED', color: '#f59e0b' },
  high: { label: 'HIGH', color: '#f97316' },
  premium: { label: 'PREM', color: '#ef4444' },
};

/** Merge all known models into a unified list for the dropdown. */
function getAllModels(): { name: string; vendor: string; flag: string }[] {
  const map = new Map<string, { name: string; vendor: string; flag: string }>();
  // Capability matrix models (more complete profiles)
  for (const p of buildCapabilityMatrix().profiles) {
    if (!map.has(p.name)) {
      map.set(p.name, { name: p.name, vendor: p.vendor, flag: vendorFlag(p.vendor) });
    }
  }
  // Benchmark models (add any missing)
  for (const m of BENCH_MODELS) {
    if (!map.has(m.model)) {
      map.set(m.model, { name: m.model, vendor: m.vendor, flag: vendorFlag(m.vendor) });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** RadarChart SVG — renders two model polygons on the same axes. */
function RadarChart({ a, b, size = 220 }: { a: ModelProfile; b: ModelProfile; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 35;
  const dims = a.dimensions;
  const n = dims.length;

  const rings = [0.25, 0.5, 0.75, 1.0];
  const axes = dims.map((d, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (r + 22) * Math.cos(angle),
      ly: cy + (r + 22) * Math.sin(angle),
      label: d.icon + ' ' + d.label,
    };
  });

  const makePolygon = (profile: ModelProfile, color: string) => {
    const points = dims.map((d, i) => {
      const dim = profile.dimensions.find((x) => x.id === d.id);
      const score = dim ? dim.score / 100 : 0;
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return `${cx + r * score * Math.cos(angle)},${cy + r * score * Math.sin(angle)}`;
    });
    return { path: points.join(' '), color, name: profile.name };
  };

  const polyA = makePolygon(a, '#3b82f6');
  const polyB = makePolygon(b, '#ef4444');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar-svg">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={dims.map((_, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            return `${cx + r * ring * Math.cos(angle)},${cy + r * ring * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="var(--line)"
          strokeWidth="0.5"
          opacity="0.5"
        />
      ))}
      {axes.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="var(--line)" strokeWidth="0.5" opacity="0.4" />
      ))}
      {[polyA, polyB].map((m) => (
        <polygon key={m.name} points={m.path} fill={m.color} fillOpacity="0.15" stroke={m.color} strokeWidth="2" />
      ))}
      {axes.map((a, i) => (
        <text key={i} x={a.lx} y={a.ly} textAnchor="middle" dominantBaseline="middle"
          fill="var(--fg)" fontSize="7" fontFamily="var(--font-space)">
          {a.label}
        </text>
      ))}
    </svg>
  );
}

export function CompareView() {
  const allModels = useMemo(() => getAllModels(), []);
  const profiles = useMemo(() => buildCapabilityMatrix().profiles, []);

  const [nameA, setNameA] = useState('Claude Opus 4');
  const [nameB, setNameB] = useState('GPT-4o');

  const profileA = profiles.find((p) => p.name === nameA);
  const profileB = profiles.find((p) => p.name === nameB);

  const comparison = useMemo(() => {
    if (profileA && profileB) return compareModels(profiles, nameA, nameB);
    return null;
  }, [profiles, nameA, nameB, profileA, profileB]);

  // Benchmark scores for both models
  const benchA = useMemo(() => BENCH_MODELS.find((m) => m.model === nameA), [nameA]);
  const benchB = useMemo(() => BENCH_MODELS.find((m) => m.model === nameB), [nameB]);

  const swap = () => { setNameA(nameB); setNameB(nameA); };

  const ModelSelector = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <div className="cmp-sel">
      <label className="cmp-sel-label">{label}</label>
      <select className="cmp-sel-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {allModels.map((m) => (
          <option key={m.name} value={m.name}>{m.flag} {m.name} ({m.vendor})</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      {/* Model selectors */}
      <div className="wrap">
        <div className="cmp-selectors">
          <ModelSelector value={nameA} onChange={setNameA} label="MODEL A" />
          <button className="cmp-swap" onClick={swap} title="Swap models">⇄</button>
          <ModelSelector value={nameB} onChange={setNameB} label="MODEL B" />
        </div>
      </div>

      {/* Overall verdict */}
      {comparison && (
        <div className="wrap">
          <div className="cmp-verdict">
            <div className="cmp-verdict-scores">
              <span className="cmp-vs-score" style={{ color: '#3b82f6' }}>
                {comparison.modelA.composite}
              </span>
              <span className="cmp-vs-label">vs</span>
              <span className="cmp-vs-score" style={{ color: '#ef4444' }}>
                {comparison.modelB.composite}
              </span>
            </div>
            <div className="cmp-verdict-winner">
              {comparison.margin > 0
                ? <>🏆 <b>{comparison.winner}</b> leads by {comparison.margin} points</>
                : '⚖️ These models are evenly matched'}
            </div>
            <p className="cmp-verdict-rec">{comparison.recommendation}</p>
          </div>
        </div>
      )}

      {/* Radar chart */}
      {profileA && profileB && (
        <div className="wrap">
          <div className="cmp-radar-section">
            <RadarChart a={profileA} b={profileB} />
            <div className="cmp-radar-legend">
              <span className="cmp-legend-item" style={{ color: '#3b82f6' }}>● {profileA.name}</span>
              <span className="cmp-legend-item" style={{ color: '#ef4444' }}>● {profileB.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Capability dimension bars */}
      {profileA && profileB && (
        <div className="wrap">
          <h3 className="cmp-section-title">🎯 CAPABILITY DIMENSIONS</h3>
          <div className="cmp-dims">
            {profileA.dimensions.map((dim) => {
              const dimB = profileB.dimensions.find((x) => x.id === dim.id);
              const scoreB = dimB?.score ?? 0;
              const winner = dim.score > scoreB ? 'a' : scoreB > dim.score ? 'b' : 'tie';
              return (
                <div key={dim.id} className="cmp-dim-row">
                  <span className="cmp-dim-label">{dim.icon} {dim.label}</span>
                  <div className="cmp-dim-bars">
                    <div className="cmp-dim-bar-left">
                      <div
                        className="cmp-dim-bar"
                        style={{
                          width: `${dim.score}%`,
                          background: winner === 'a' ? '#3b82f6' : 'rgba(59,130,246,0.3)',
                        }}
                      />
                    </div>
                    <div className="cmp-dim-bar-right">
                      <div
                        className="cmp-dim-bar"
                        style={{
                          width: `${scoreB}%`,
                          background: winner === 'b' ? '#ef4444' : 'rgba(239,68,68,0.3)',
                        }}
                      />
                    </div>
                  </div>
                  <span className="cmp-dim-score" style={{ color: winner === 'a' ? '#3b82f6' : 'var(--mut)' }}>
                    {dim.score}
                  </span>
                  <span className="cmp-dim-score" style={{ color: winner === 'b' ? '#ef4444' : 'var(--mut)' }}>
                    {scoreB}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Benchmark scores */}
      <div className="wrap">
        <h3 className="cmp-section-title">📊 OFFICIAL BENCHMARKS</h3>
        <div className="cmp-bench-grid">
          {BENCHMARKS.map((bench) => {
            const scoreA = benchA?.scores[bench.id as keyof typeof benchA.scores];
            const scoreB = benchB?.scores[bench.id as keyof typeof benchB.scores];
            const hasA = scoreA != null;
            const hasB = scoreB != null;
            const maxVal = bench.id === 'arena-elo' ? 1500 : 100;
            const winner = hasA && hasB ? (scoreA! > scoreB! ? 'a' : scoreB! > scoreA! ? 'b' : 'tie') : null;

            return (
              <div key={bench.id} className="cmp-bench-card">
                <div className="cmp-bench-head">
                  <span className="cmp-bench-name">{bench.name}</span>
                  <span className="cmp-bench-unit">{bench.unit}</span>
                </div>
                <p className="cmp-bench-desc">{bench.desc}</p>
                <div className="cmp-bench-scores">
                  <div className="cmp-bench-model">
                    <span className="cmp-bench-flag" style={{ color: '#3b82f6' }}>
                      {hasA ? scoreA : '—'}
                    </span>
                    {hasA && hasB && winner === 'a' && <span className="cmp-bench-win">👑</span>}
                  </div>
                  <div className="cmp-bench-vs">vs</div>
                  <div className="cmp-bench-model">
                    {hasB && hasA && winner === 'b' && <span className="cmp-bench-win">👑</span>}
                    <span className="cmp-bench-flag" style={{ color: '#ef4444' }}>
                      {hasB ? scoreB : '—'}
                    </span>
                  </div>
                </div>
                {hasA && hasB && (
                  <div className="cmp-bench-bars">
                    <div className="cmp-bench-bar-row">
                      <div
                        className="cmp-bench-bar"
                        style={{
                          width: `${(scoreA! / maxVal) * 100}%`,
                          background: winner === 'a' ? '#3b82f6' : 'rgba(59,130,246,0.3)',
                        }}
                      />
                    </div>
                    <div className="cmp-bench-bar-row">
                      <div
                        className="cmp-bench-bar"
                        style={{
                          width: `${(scoreB! / maxVal) * 100}%`,
                          background: winner === 'b' ? '#ef4444' : 'rgba(239,68,68,0.3)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Model info cards */}
      <div className="wrap">
        <div className="cmp-info-grid">
          {profileA && (
            <div className="cmp-info-card" style={{ borderColor: '#3b82f6' }}>
              <h4 style={{ color: '#3b82f6' }}>{profileA.name}</h4>
              <div className="cmp-info-row"><span>Vendor</span><span>{profileA.vendor}</span></div>
              <div className="cmp-info-row"><span>Composite</span><span>{profileA.composite}</span></div>
              <div className="cmp-info-row"><span>Cost tier</span><span style={{ color: COST_LABELS[profileA.costTier]?.color }}>{COST_LABELS[profileA.costTier]?.label}</span></div>
              <div className="cmp-info-row"><span>Context</span><span>{profileA.contextWindow?.toLocaleString()} tokens</span></div>
              {benchA && <div className="cmp-info-row"><span>Arena Elo</span><span>{benchA.scores['arena-elo'] ?? '—'}</span></div>}
            </div>
          )}
          {profileB && (
            <div className="cmp-info-card" style={{ borderColor: '#ef4444' }}>
              <h4 style={{ color: '#ef4444' }}>{profileB.name}</h4>
              <div className="cmp-info-row"><span>Vendor</span><span>{profileB.vendor}</span></div>
              <div className="cmp-info-row"><span>Composite</span><span>{profileB.composite}</span></div>
              <div className="cmp-info-row"><span>Cost tier</span><span style={{ color: COST_LABELS[profileB.costTier]?.color }}>{COST_LABELS[profileB.costTier]?.label}</span></div>
              <div className="cmp-info-row"><span>Context</span><span>{profileB.contextWindow?.toLocaleString()} tokens</span></div>
              {benchB && <div className="cmp-info-row"><span>Arena Elo</span><span>{benchB.scores['arena-elo'] ?? '—'}</span></div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
