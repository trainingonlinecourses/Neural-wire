'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NewsData } from '@/lib/data';
import type { Story } from '@/lib/types';
import {
  groupReleasesByDate,
  kindLabel,
  storyMentionsRelease,
  type ModelKind,
  type ModelRelease,
} from '@/lib/model-releases';
import { vendorFlag } from '@/lib/benchmarks';
import { compactAge } from '@/lib/time-groups';
import { fmtDownloads } from '@/lib/live-models';
import { NewsCard } from './news-card';

const COST_LABELS: Record<string, string> = {
  free: 'FREE',
  low: 'LOW',
  medium: 'MED',
  high: 'HIGH',
  unknown: '—',
};

const KIND_TABS: { kind: ModelKind | 'all'; label: string }[] = [
  { kind: 'all', label: 'ALL' },
  { kind: 'frontier', label: '🔥 FRONTIER API' },
  { kind: 'open', label: '🌿 OPEN WEIGHTS (HF)' },
];

const fmtMoney = (n: number): string =>
  n >= 10_000 ? '$' + (n / 1000).toFixed(1) + 'k/M'
  : n >= 1 ? '$' + n.toFixed(2) + '/M'
  : n > 0 ? n.toFixed(3) + '/M'
  : '—';

/** Launch registry (REAL data from /api/models/releases) + news matching. */
export function ReleasesView({ data }: { data: NewsData }) {
  const [kind, setKind] = useState<ModelKind | 'all'>('all');
  const [q, setQ] = useState('');
  const [releases, setReleases] = useState<ModelRelease[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Pull live releases from OpenRouter + Hugging Face + Together + Groq.
  useEffect(() => {
    let alive = true;
    fetch('/api/models/releases', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((j: { releases: ModelRelease[] }) => alive && setReleases(j.releases))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const base = releases ?? [];
    const byKind = kind === 'all' ? base : base.filter((r) => (kind === 'open') === r.openSource);
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? byKind.filter((r) => r.name.toLowerCase().includes(needle) || r.vendor.toLowerCase().includes(needle))
      : byKind;
    return groupReleasesByDate(filtered);
  }, [releases, kind, q]);

  // Auto-expand the freshest few launch cards.
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const r of visible[0]?.releases.slice(0, 3) ?? []) next.add(r.id);
      return next;
    });
  }, [visible]);

  const storiesByRelease = useMemo(() => {
    const map = new Map<string, Story[]>();
    for (const s of visible) {
      for (const r of s.releases) {
        const hits = data.stories.filter((st) => storyMentionsRelease(st.models, r));
        if (hits.length > 0) map.set(r.id, hits);
      }
    }
    return map;
  }, [data.stories, visible]);

  const totalReleases = useMemo(
    () => visible.reduce((n, s) => n + s.releases.length, 0),
    [visible],
  );

  const totalNews = useMemo(
    () => [...storiesByRelease.values()].reduce((n, arr) => n + arr.length, 0),
    [storiesByRelease],
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <input
            className="field"
            placeholder="Filter by model or vendor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Filter releases"
          />
          <span className="dim" style={{ alignSelf: 'center' }}>
            {releases ? totalReleases + ' launches · ' + totalNews + ' news stories' : '⟳ fetching live registries…'}
          </span>
        </div>
      </div>

      <div className="wrap">
        <div className="chips" role="group" aria-label="Release kind">
          {KIND_TABS.map((t) => (
            <button
              key={t.kind}
              className={'chip' + (kind === t.kind ? ' active' : '')}
              onClick={() => setKind(t.kind)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="wrap">
        <div className="meta-row">
          <span>RECENTLY LAUNCHED MODELS — LIVE FROM OPENROUTER · HUGGING FACE · TOGETHER · GROQ</span>
          <span className="meta-right dim">frontier = API-only · open = public weights on HF</span>
        </div>
        {failed && <p className="empty">Live release registry unavailable right now — try again in a moment.</p>}
        {!releases && !failed && <p className="empty">⟳ polling OpenRouter + Hugging Face + Together + Groq…</p>}
        {releases && releases.length === 0 && <p className="empty">No recently-launched models found in the registries right now.</p>}
                {releases && releases.length > 0 && totalReleases === 0 && <p className="empty">No launches match the current filter.</p>}
        {visible.map((s) => (
          <section key={s.bucket} className="rel-section" aria-label={s.label}>
            <div className="rel-section-head">
              <h2>{s.label}</h2>
              <span className="dim">{s.releases.length} launch{s.releases.length !== 1 ? 'es' : ''}</span>
            </div>
            <div className="rel-grid">
              {s.releases.map((r) => (
                <ReleaseCard
                  key={r.id}
                  release={r}
                  newsCount={(storiesByRelease.get(r.id) || []).length}
                  expanded={expanded.has(r.id)}
                  onToggle={() => toggle(r.id)}
                  stories={storiesByRelease.get(r.id) || []}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

    <div className="wrap">
      <div className="meta-row">
        <span>LAUNCH NEWS · {totalNews} STORIES COVERING THESE RELEASES</span>
      </div>
    </div>
    {totalNews === 0 ? (
      <div className="wrap">
        <p className="empty">No wire stories mention these launches right now — check back after the next sync.</p>
      </div>
    ) : (
      <div className="model-time-groups">
        {visible.map((s) => (
          s.releases.some((r) => (storiesByRelease.get(r.id) || []).length > 0) && (
            <div key={s.bucket} className="rel-news-section">
              <div className="rel-section-head">
                <h2>{s.label} · LAUNCH NEWS</h2>
                <span className="dim">{s.releases.reduce((n, r) => n + (storiesByRelease.get(r.id) || []).length, 0)} stories</span>
              </div>
              {s.releases.map((r) => {
                const hits = storiesByRelease.get(r.id) || [];
                if (hits.length === 0) return null;
                const isOpen = expanded.has(r.id);
                return (
                  <div key={r.id} className="model-time-group">
                    <button className="mtg-header" onClick={() => toggle(r.id)} aria-expanded={isOpen}>
                      <span className="rel-flag" aria-hidden="true">{vendorFlag(r.vendor)}</span>
                      <span className="mtg-label">
                        {r.name}
                        <span className={`rel-kind${r.openSource ? ' open' : ' frontier'}`}>{kindLabel(r)}</span>
                      </span>
                      <span className="mtg-count">{hits.length} stor{hits.length !== 1 ? 'ies' : 'y'}</span>
                      <span className="mtg-chevron">{isOpen ? '▾' : '▸'}</span>
                    </button>
                    {isOpen && (
                      <div className="mtg-body grid">
                        {hits.map((st) => (
                          <NewsCard key={st.id} story={st} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ))}
      </div>
    )}
  </>
);
}

function ReleaseCard({
  release,
  newsCount,
  expanded,
  onToggle,
  stories,
}: {
  release: ModelRelease;
  newsCount: number;
  expanded: boolean;
  onToggle: () => void;
  stories: Story[];
}) {
  const fullDate = new Date(release.releasedAt * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const added = compactAge(release.releasedAt * 1000);

  return (
    <article className={'rel-card' + (release.openSource ? ' is-open' : ' is-frontier')}>
      <div className="rel-card-head">
        <span className="rel-flag" aria-hidden="true">{vendorFlag(release.vendor)}</span>
        <div className="rel-titles">
          <h3>{release.name}</h3>
          <span className="rel-vendor" title={'Listed ' + fullDate}>{release.vendor} · {added}</span>
        </div>
        <span className={`rel-kind${release.openSource ? ' open' : ' frontier'}`}>{kindLabel(release)}</span>
      </div>
      <div className="rel-stats">
        <span className="rel-stat" title="Cost tier from real OpenRouter pricing">💲 {COST_LABELS[release.costTier] ?? release.costTier}</span>
        {release.pricePromptPerM != null && (
          <span className="rel-stat" title="Real OpenRouter input price">{release.pricePromptPerM > 0 ? 'in ' + fmtMoney(release.pricePromptPerM) : 'in $0'}</span>
        )}
        {release.context && <span className="rel-stat" title="Context window">🧠 ctx {Math.round(release.context / 1000)}k</span>}
        {release.downloads != null && <span className="rel-stat" title="Downloads (HF)">⬇ {fmtDownloads(release.downloads)}</span>}
        {release.likes != null && <span className="rel-stat" title="Likes (HF)">❤ {fmtDownloads(release.likes)}</span>}
        {release.trendingScore != null && <span className="rel-stat" title="Trending score (HF)">🔥 {Math.round(release.trendingScore)}</span>}
        <button className="rel-toggle" onClick={onToggle} aria-expanded={expanded}>
          {expanded ? '▾ HIDE NEWS' : '▸ NEWS (' + newsCount + ')'}
        </button>
        {release.hfUrl && (
          <a className="open rel-src" href={release.hfUrl} target="_blank" rel="noopener noreferrer">HF ↗</a>
        )}
        {release.openrouterUrl && (
          <a className="open rel-src" href={release.openrouterUrl} target="_blank" rel="noopener noreferrer">OR ↗</a>
        )}
        {release.source && (
          <a className="open rel-src" href={release.source} target="_blank" rel="noopener noreferrer" title={release.source}>CARD ↗</a>
        )}
      </div>
      {expanded && stories.length > 0 && (
        <div className="rel-news">
          {stories.map((s) => (
            <NewsCard key={s.id} story={s} />
          ))}
        </div>
      )}
    </article>
  );
}
