'use client';

import { useCallback, useEffect, useState } from 'react';
import { BENCH_RULES } from '@/lib/extract/benchmarks';

interface Row {
  model: string;
  score: number;
  unit: string;
  reported_at: string;
}

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function LeaderboardView() {
  const [bench, setBench] = useState(slug(BENCH_RULES[0].name));
  const [rows, setRows] = useState<Row[]>([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback((b: string) => {
    setLoading(true);
    setErr('');
    fetch('/api/leaderboard?benchmark=' + encodeURIComponent(b))
      .then((r) => r.json())
      .then((j) => {
        if (j.demo) setDemo(true);
        setRows(j.rows || []);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(bench);
  }, [bench, load]);

  const maxScore = rows.length ? rows[0].score : 0;

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <select className="field" value={bench} onChange={(e) => setBench(e.target.value)}>
            {BENCH_RULES.map((b) => (
              <option key={slug(b.name)} value={slug(b.name)}>
                {b.name}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => load(bench)} disabled={loading}>
            {loading ? '…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>
            {BENCH_RULES.find((b) => slug(b.name) === bench)?.name || bench} — latest reported score per model
            {demo ? ' · DEMO (empty until Supabase ingest runs)' : ''}
          </span>
          {err && <span className="err">{err}</span>}
        </div>
      </div>
      <div className="wrap">
        <div className="card" style={{ cursor: 'default' }}>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="lb-scroll">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>MODEL</th>
                  <th>SCORE</th>
                  <th>UNIT</th>
                  <th>REPORTED</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.model + i}>
                    <td className="rank">
                      <span className="rk">
                        <span className="bar" style={{ width: `${Math.max(8, (r.score / (maxScore || 1)) * 100)}%` }} />
                        {i + 1}
                      </span>
                    </td>
                    <td className="model">{r.model}</td>
                    <td className="score">
                      {r.score.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      <span className="unit">{r.unit}</span>
                    </td>
                    <td className="unit-cell">{r.unit}</td>
                    <td className="date">{new Date(r.reported_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {loading && <p className="empty" style={{ margin: 0 }}>Loading…</p>}
            {!loading && rows.length === 0 && (
              <p className="empty" style={{ margin: 0 }}>
                No scores ingested for this benchmark yet. The hourly cron writes scores from model-release stories.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
