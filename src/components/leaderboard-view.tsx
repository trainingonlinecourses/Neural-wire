'use client';

import { useState } from 'react';
import { BENCHMARKS, benchById, modelsForBench, vendorFlag } from '@/lib/benchmarks';

/** Compare flagship models on genuinely-sourced benchmark scores. */
export function LeaderboardView() {
  const [benchId, setBenchId] = useState(BENCHMARKS[0].id);
  const bench = benchById(benchId) ?? BENCHMARKS[0];
  const rows = modelsForBench(benchId);

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <select
            className="field"
            value={benchId}
            onChange={(e) => setBenchId(e.target.value)}
            aria-label="Benchmark"
          >
            {BENCHMARKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <span className="bench-desc">{bench.desc}</span>
        </div>
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>
            {rows.length} MODELS · {bench.name} — best-first
          </span>
          <span className="meta-right bench-honesty" title="Every number links to the vendor's official model card / announcement">
            ✓ GENUINE — from official model cards
          </span>
        </div>
      </div>
      <div className="wrap">
        <div className="bench-table" role="table" aria-label={bench.name + ' comparison'}>
          <div className="bench-row head" role="row">
            <span>#</span>
            <span>MODEL</span>
            <span>VENDOR</span>
            <span>RELEASED</span>
            <span className="bench-score-head">SCORE</span>
            <span>SOURCE</span>
          </div>
          {rows.map((m, i) => {
            const v = m.scores[benchId as keyof typeof m.scores];
            const max = rows[0]?.scores[benchId as keyof typeof rows[0]['scores']] ?? v ?? 1;
            return (
              <div className={'bench-row' + (i === 0 ? ' top' : '')} role="row" key={m.model}>
                <span className="bench-rank">{i + 1}</span>
                <span className="bench-model">{m.model}</span>
                <span className="bench-vendor" title={m.vendor}>
                  <span className="bench-flag" aria-hidden="true">
                    {vendorFlag(m.vendor)}
                  </span>{' '}
                  {m.vendor}
                </span>
                <span className="bench-date">{m.released}</span>
                <span className="bench-score">
                  <span className="bench-num">{v != null ? v.toFixed(1) : '—'}{v != null ? bench.unit : ''}</span>
                  <span className="bench-bar">
                    <i style={{ width: (v != null ? (100 * v) / max : 0) + '%' }} />
                  </span>
                </span>
                <span className="bench-src">
                  <a href={m.source} target="_blank" rel="noopener noreferrer" title={'Official: ' + m.source}>
                    CARD ↗
                  </a>
                </span>
              </div>
            );
          })}
        </div>
        <p className="empty bench-note">
          Scores are exactly as reported by each vendor at release — the SOURCE link opens the official model card or
          announcement for every row. Labs use different harnesses (5-shot vs CoT, etc.), so treat cross-model deltas as
          directional, not exact.
        </p>
      </div>
    </>
  );
}
