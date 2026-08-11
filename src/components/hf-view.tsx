'use client';

import { useCallback, useEffect, useState } from 'react';
import { HfCard, type HfItem } from './hf-card';
import { ago } from '@/lib/utils';

type Kind = 'models' | 'spaces';

const CACHE_TTL = 5 * 60 * 1000;
const cache: Partial<Record<Kind, { items: HfItem[]; at: number }>> = {};

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
  };
}

async function hfFetch(url: string): Promise<RawHF[]> {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HF ' + r.status);
  return r.json();
}

export function HFView() {
  const [kind, setKind] = useState<Kind>('models');
  const [data, setData] = useState<HfItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [at, setAt] = useState(0);

  const load = useCallback((k: Kind, force = false) => {
    if (!force && cache[k] && Date.now() - cache[k].at < CACHE_TTL) {
      setData(cache[k].items);
      setAt(cache[k].at);
      return;
    }
    setLoading(true);
    setError(null);
    const urls = [
      'https://huggingface.co/api/' + k + '?sort=trendingScore&limit=18&full=false',
      'https://huggingface.co/api/' + k + '?sort=likes&limit=18&full=false',
    ];
    const idx = 0;
    const tryUrl = (i: number): Promise<RawHF[]> =>
      hfFetch(urls[i]).catch(() => {
        if (i + 1 < urls.length) return tryUrl(i + 1);
        throw new Error('HF API unreachable');
      });
    tryUrl(idx)
      .then((j) => {
        const items = j.map(normHF);
        cache[k] = { items, at: Date.now() };
        setData(items);
        setAt(Date.now());
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const switchKind = (k: Kind) => {
    setKind(k);
    load(k);
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
          <button className="btn primary" onClick={() => load(kind, true)} disabled={loading}>
            {loading ? 'PULLING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>Hugging Face Hub — real trending {kind}, live (sort=trendingScore)</span>
          <span className="dim">{at ? 'fetched ' + ago(new Date(at)) : ''}</span>
        </div>
      </div>
      <div className="wrap grid">
        {data?.map((m) => (
          <HfCard key={m.id} m={m} isModel={kind === 'models'} />
        ))}
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
