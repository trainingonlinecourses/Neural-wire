'use client';

import { useCallback, useEffect, useState } from 'react';
import { HfCard, type HfItem } from './hf-card';
import { ago } from '@/lib/utils';

type Kind = 'models' | 'spaces';
type TimeRange = 'day' | 'week' | 'month' | 'all';
type HfSortKey = 'trending' | 'likes' | 'downloads' | 'recent' | 'name';

const RANGE_LABELS: Record<TimeRange, string> = { day: '24H', week: '7D', month: '1M', all: 'ALL' };
const HF_SORT_LABELS: Record<HfSortKey, string> = {
  trending: '🔥 Trending', likes: '❤ Likes', downloads: '⇣ Downloads', recent: '🆕 Newest', name: 'A-Z Name',
};

interface HfData {
  items: HfItem[];
  at: number;
}

const CACHE_TTL = 5 * 60 * 1000;
const cache: Partial<Record<string, HfData>> = {};

interface RawHF {
  id?: string;
  modelId?: string;
  model_id?: string;
  likes?: number;
  downloads?: number;
  pipeline_tag?: string;
  library_name?: string;
  sdk?: string;
  trendingScore?: number;
  createdAt?: number;
  created_at?: number;
  lastModified?: number;
  tags?: string[];
}

function normHF(m: RawHF): HfItem {
  const id = m.id || m.modelId || m.model_id || '';
  return {
    id,
    likes: m.likes == null ? 0 : m.likes,
    downloads: m.downloads == null ? null : m.downloads,
    pipe: m.pipeline_tag || '',
    lib: m.library_name || '',
    sdk: m.sdk || '',
    score: m.trendingScore == null ? null : m.trendingScore,
    created: m.createdAt || m.created_at || m.lastModified || Date.now(),
    tags: m.tags || [],
  };
}

async function hfFetch(url: string): Promise<RawHF[]> {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HF ' + r.status);
  return r.json();
}

export function HFView() {
  const [kind, setKind] = useState<Kind>('models');
  const [range, setRange] = useState<TimeRange>('week');
  const [data, setData] = useState<HfItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [at, setAt] = useState(0);
  const [pipeFilter, setPipeFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<HfSortKey>('trending');

  const load = useCallback((k: Kind, r: TimeRange, force = false) => {
    const cacheKey = `${k}-${r}`;
    if (!force && cache[cacheKey] && Date.now() - cache[cacheKey].at < CACHE_TTL) {
      setData(cache[cacheKey].items);
      setAt(cache[cacheKey].at);
      return;
    }
    setLoading(true);
    setError(null);

    const limit = 60;

    const urls = [
      `https://huggingface.co/api/${k}?sort=trendingScore&limit=${limit}&full=false`,
      `https://huggingface.co/api/${k}?sort=likes&limit=${limit}&full=false`,
      `https://huggingface.co/api/${k}?sort=downloads&limit=${limit}&full=false`,
    ];

    const tryUrl = (i: number): Promise<RawHF[]> =>
      hfFetch(urls[i]).catch(() => {
        if (i + 1 < urls.length) return tryUrl(i + 1);
        throw new Error('HF API unreachable');
      });

    tryUrl(0)
      .then((j) => {
        const items = j.map(normHF);
        cache[cacheKey] = { items, at: Date.now() };
        setData(items);
        setAt(Date.now());
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(kind, range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, range]);

  const switchKind = (k: Kind) => {
    setKind(k);
    setPipeFilter('all');
  };

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="seg">
            <button className={'seg-btn' + (kind === 'models' ? ' active' : '')} onClick={() => switchKind('models')}>
              🤖 MODELS
            </button>
            <button className={'seg-btn' + (kind === 'spaces' ? ' active' : '')} onClick={() => switchKind('spaces')}>
              🚀 SPACES
            </button>
          </div>
          <div className="seg" role="group" aria-label="Time range">
            {(Object.keys(RANGE_LABELS) as TimeRange[]).map((r) => (
              <button
                key={r}
                className={'seg-btn' + (range === r ? ' active' : '')}
                onClick={() => setRange(r)}
                aria-pressed={range === r}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Sort order">
            {(Object.keys(HF_SORT_LABELS) as HfSortKey[]).map((k) => (
              <button
                key={k}
                className={'seg-btn' + (sortKey === k ? ' active' : '')}
                onClick={() => setSortKey(k)}
                aria-pressed={sortKey === k}
              >
                {HF_SORT_LABELS[k]}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={() => load(kind, range, true)} disabled={loading}>
            {loading ? 'PULLING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>HUGGINGFACE {kind.toUpperCase()} — LAST {RANGE_LABELS[range]} · sort={HF_SORT_LABELS[sortKey]}</span>
          <span className="dim">{at ? 'fetched ' + ago(new Date(at)) : ''}</span>
        </div>
        {data && kind === 'models' && data.length > 0 && (() => {
          const pipes = [...new Set(data.map((m) => m.pipe).filter(Boolean))].sort();
          if (pipes.length < 2) return null;
          return (
            <div className="hf-pipeline-chips">
              <button className={'chip' + (pipeFilter === 'all' ? ' on' : '')} onClick={() => setPipeFilter('all')}>
                ALL · {data.length}
              </button>
              {pipes.slice(0, 8).map((p) => {
                const count = data.filter((m) => m.pipe === p).length;
                return (
                  <button key={p} className={'chip' + (pipeFilter === p ? ' on' : '')} onClick={() => setPipeFilter(p)}>
                    {p} · {count}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>
      <div className="wrap grid">
        {(() => {
          let filtered = (data || []).filter((m) => kind !== 'models' || pipeFilter === 'all' || m.pipe === pipeFilter);
          // Client-side sort
          switch (sortKey) {
            case 'trending': filtered = [...filtered].sort((a, b) => (b.score || 0) - (a.score || 0)); break;
            case 'likes': filtered = [...filtered].sort((a, b) => b.likes - a.likes); break;
            case 'downloads': filtered = [...filtered].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)); break;
            case 'recent': filtered = [...filtered].sort((a, b) => b.created - a.created); break;
            case 'name': filtered = [...filtered].sort((a, b) => a.id.localeCompare(b.id)); break;
          }
          return filtered.map((m) => (
            <HfCard key={m.id} m={m} isModel={kind === 'models'} />
          ));
        })()}
        {loading && !data && <p className="empty">Pulling live from the HF Hub API…</p>}
        {error && !data && (
          <p className="empty">
            <b>HF API unreachable ({error})</b>
            <br />
            Check connection and retry.
          </p>
        )}
      </div>
    </>
  );
}
