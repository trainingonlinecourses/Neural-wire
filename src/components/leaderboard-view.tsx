'use client';

import { useState } from 'react';
import { BENCHMARKS, benchById, modelsForBench, rosterByNewest, vendorFlag } from '@/lib/benchmarks';

type Tab = 'latest' | 'compare';

const BENCH_NAME: Record<string, string> = {
  mmlu: 'MMLU',
  humaneval: 'HumanEval',
  gsm8k: 'GSM8K',
  swebench: 'SWE-bench',
};

/** Newest-first roster with each model's own reported benchmarks. */
export function LeaderboardView() {
  const [tab, setTab] = useState<Tab>('latest');
  // Only offer benchmarks the current (2025+) roster actually reports.
  const available = BENCHMARKS.filter((b) => modelsForBench(b.id).length >= 2);
  const defaultBench = available.find((b) => b.id === 'swebench')?.id ?? available[0]?.id ?? BENCHMARKS[0].id;
  const [benchId, setBenchId] = useState(defaultBench);
  const bench = benchById(benchId) ?? BENCHMARKS[0];
  const compareRows = modelsForBench(benchId);
  const latest = rosterByNewest();

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="tabbar" role="tablist" aria-label="Leaderboard view">
            <button
              role="tab"
              aria-selected={tab === 'latest'}
              className={'tab' + (tab === 'latest' ? ' on' : '')}
              onClick={() => setTab('latest')}
            >
              LATEST MODELS
            </button>
            <button
              role="tab"
              aria-selected={tab === 'compare'}
              className={'tab' + (tab === 'compare' ? ' on' : '')}
              onClick={() => setTab('compare')}
            >
              COMPARE BY BENCHMARK
            </button>
          </div>
          {tab === 'compare' && (
            <select
              className="field"
              value={benchId}
              onChange={(e) => setBenchId(e.target.value)}
              aria-label="Benchmark"
            >
              {available.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          {tab === 'compare' && <span className="bench-desc">{bench.desc}</span>}
        </div>
      </div>

      {tab === 'latest' ? (
        <div className="wrap">
          <div className="meta-row">
            <span>
              {latest.length} MODELS · 2025+ releases, newest first — every score links to the official source
            </span>
            <span className="meta-right bench-honesty" title="Every number links to the vendor's official model card / announcement">
              ✓ GENUINE — from official model cards
            </span>
          </div>
          <div className="bench-table" role="table" aria-label="Latest flagship models">
            <div className="bench-row head" role="row">
              <span>#</span>
              <span>MODEL</span>
              <span>VENDOR</span>
              <span>RELEASED</span>
              <span className="bench-score-head">REPORTED SCORES</span>
              <span>SOURCE</span>
            </div>
            {latest.map((m, i) => (
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
                <span className="bench-scores-cell">
                  {Object.entries(m.scores)
                    .filter(([, v]) => v != null)
                    .map(([bid, v]) => (
                      <span className="bench-chip" key={bid} title={(BENCH_NAME[bid] ?? bid.toUpperCase()) + ' — official number'}>
                        {BENCH_NAME[bid] ?? bid.toUpperCase()} {(v as number).toFixed(1)}
                      </span>
                    ))}
                </span>
                <span className="bench-src">
                  <a href={m.source} target="_blank" rel="noopener noreferrer" title={'Official: ' + m.source}>
                    CARD ↗
                  </a>
                </span>
              </div>
            ))}
          </div>
          <p className="empty bench-note">
            Scores from official model cards — SOURCE links to the original announcement.
          </p>
        </div>
      ) : (
        <div className="wrap">
          <div className="meta-row">
            <span>
              {compareRows.length} MODELS · {bench.name} (2025+ releases) — best-first
            </span>
            <span className="meta-right bench-honesty" title="Every number links to the vendor's official model card / announcement">
              ✓ GENUINE — from official model cards
            </span>
          </div>
          <div className="bench-table" role="table" aria-label={bench.name + ' comparison'}>
            <div className="bench-row head" role="row">
              <span>#</span>
              <span>MODEL</span>
              <span>VENDOR</span>
              <span>RELEASED</span>
              <span className="bench-score-head">SCORE</span>
              <span>SOURCE</span>
            </div>
            {compareRows.map((m, i) => {
              const v = m.scores[benchId as keyof typeof m.scores];
              const max = compareRows[0]?.scores[benchId as keyof typeof compareRows[0]['scores']] ?? v ?? 1;
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
            2025+ flagships only — modern benchmarks replace legacy evaluations.
          </p>
        </div>
      )}
    </>
  );
}
