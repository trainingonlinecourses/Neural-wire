'use client';

import { useEffect, useState } from 'react';
import type { LiveModel } from '@/lib/live-models';
import { fmtDownloads } from '@/lib/live-models';
import { vendorFlag } from '@/lib/benchmarks';

export function LiveModelsView() {
  const [models, setModels] = useState<LiveModel[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/models/live', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((j: { models: LiveModel[] }) => alive && setModels(j.models))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="wrap">
      <div className="meta-row">
        <span>NEW MODELS — LIVE · pulled fresh from Hugging Face + OpenRouter</span>
        <span className="meta-right dim">benchmarks extracted from each model&apos;s official card</span>
      </div>
      {failed && <p className="empty">Live model feed unavailable right now — try again in a moment.</p>}
      {!models && !failed && <p className="empty">⟳ polling Hugging Face + OpenRouter…</p>}
      {models && models.length === 0 && <p className="empty">No new models reported by the registries right now.</p>}
      {models && models.length > 0 && (
        <div className="live-models">
          {models.map((m) => {
            return (
              <article className="live-model" key={m.id}>
                <div className="live-model-head">
                  <span className="live-flag" aria-hidden="true">
                    {vendorFlag(m.vendor)}
                  </span>
                  <div className="live-model-titles">
                    <h4>{m.name}</h4>
                    <span className="live-vendor">
                      {m.vendor}
                      {m.created > 0 &&
                        ` · ${new Date(m.created * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </span>
                  </div>
                  <span className="live-model-links">
                    {m.hfUrl && (
                      <a className="open" href={m.hfUrl} target="_blank" rel="noopener noreferrer">
                        HF ↗
                      </a>
                    )}
                    {m.openrouterUrl && (
                      <a className="open" href={m.openrouterUrl} target="_blank" rel="noopener noreferrer">
                        OR ↗
                      </a>
                    )}
                  </span>
                </div>
                <div className="live-model-meta">
                  {m.context != null && (
                    <span className="live-stat" title="Context window">
                      ctx {Math.round(m.context / 1000)}k
                    </span>
                  )}
                  {m.downloads != null && (
                    <span className="live-stat" title="Downloads">
                      ⬇ {fmtDownloads(m.downloads)}
                    </span>
                  )}
                  {m.likes != null && (
                    <span className="live-stat" title="Likes">
                      ❤ {fmtDownloads(m.likes)}
                    </span>
                  )}
                  {m.trendingScore != null && (
                    <span className="live-stat" title="Trending score">
                      🔥 {Math.round(m.trendingScore)}
                    </span>
                  )}
                </div>
                {m.benchmarks.length > 0 && (
                  <div className="models-row">
                    {m.benchmarks.map((b) => (
                      <span className="bench-pill" key={b.name} title={'From the official model card' + (m.hfUrl ? ' — ' + m.hfUrl : '')}>
                        {b.name} {b.value.toFixed(1)}
                      </span>
                    ))}
                    {m.hfUrl && (
                      <a className="bench-card-link" href={m.hfUrl} target="_blank" rel="noopener noreferrer">
                        from card ↗
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
