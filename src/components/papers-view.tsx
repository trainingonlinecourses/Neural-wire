'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ago } from '@/lib/utils';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  publishedAt: string;
  url: string;
  upvotes: number;
  commentCount: number;
}

interface PapersPayload {
  papers: Paper[];
  count: number;
  error?: string;
  fetchedAt: number;
}

const CACHE_TTL = 10 * 60 * 1000;
let cache: { papers: Paper[]; at: number } | null = null;

function authorList(authors: string[]): string {
  if (authors.length === 0) return 'Unknown authors';
  if (authors.length <= 3) return authors.join(', ');
  return authors.slice(0, 3).join(', ') + ` et al. (${authors.length})`;
}

type SortMode = 'upvotes' | 'comments' | 'newest' | 'oldest';

export function PapersView() {
  const [papers, setPapers] = useState<Paper[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [at, setAt] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortMode>('upvotes');

  const load = useCallback((force = false) => {
    if (!force && cache && Date.now() - cache.at < CACHE_TTL) {
      setPapers(cache.papers);
      setAt(cache.at);
      return;
    }
    setLoading(true);
    setError(null);
    fetch('/api/papers', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json() as Promise<PapersPayload>;
      })
      .then((j) => {
        setPapers(j.papers);
        setAt(j.fetchedAt);
        cache = { papers: j.papers, at: j.fetchedAt };
        if (j.error) setError(j.error);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const filtered = useMemo(() => {
    if (!papers) return [];
    let list = [...papers];
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.authors.some((a) => a.toLowerCase().includes(needle)) ||
          p.summary.toLowerCase().includes(needle),
      );
    }
    switch (sort) {
      case 'upvotes': list.sort((a, b) => b.upvotes - a.upvotes); break;
      case 'comments': list.sort((a, b) => b.commentCount - a.commentCount); break;
      case 'newest': list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()); break;
      case 'oldest': list.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()); break;
    }
    return list;
  }, [papers, q, sort]);

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <input
            className="field"
            placeholder="Search papers by title, author, or topic…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: '1 1 300px' }}
          />
          <select className="field" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
            <option value="upvotes">MOST UPVOTED</option>
            <option value="comments">MOST DISCUSSED</option>
            <option value="newest">NEWEST FIRST</option>
            <option value="oldest">OLDEST FIRST</option>
          </select>
          <button className="btn primary" onClick={() => load(true)} disabled={loading}>
            {loading ? 'PULLING…' : '⟳ REFRESH'}
          </button>
        </div>
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>{filtered.length} papers{q ? ` matching "${q}"` : ''}</span>
          <span className="meta-right dim">{at ? 'fetched ' + ago(new Date(at)) : ''}</span>
        </div>
      </div>
      {error && !papers && (
        <div className="wrap">
          <p className="empty">
            <b>Papers feed unavailable ({error})</b>
          </p>
        </div>
      )}
      {!papers && !loading && !error && (
        <div className="wrap">
          <p className="empty">Loading…</p>
        </div>
      )}
      {papers && papers.length === 0 && !error && (
        <div className="wrap">
          <p className="empty">No papers available right now.</p>
        </div>
      )}
      {papers && filtered.length === 0 && q && (
        <div className="wrap">
          <p className="empty">No papers match &ldquo;{q}&rdquo;. Try a different search.</p>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="wrap papers-list">
          {filtered.map((p, i) => {
            const isExpanded = expandedId === p.id;
            return (
              <article className="paper-card" key={p.id}>
                <div className="paper-rank">{i + 1}</div>
                <div className="paper-body">
                  <div className="paper-head">
                    <a
                      className="paper-title"
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {p.title}
                    </a>
                    <div className="paper-badges">
                      {p.upvotes > 0 && (
                        <span className="paper-badge upvotes" title="Community upvotes">
                          ▲ {p.upvotes}
                        </span>
                      )}
                      {p.commentCount > 0 && (
                        <span className="paper-badge comments" title="Comments">
                          💬 {p.commentCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="paper-authors">{authorList(p.authors)}</div>
                  {p.summary && (
                    <p className={'paper-summary' + (isExpanded ? ' expanded' : '')}>
                      {p.summary}
                    </p>
                  )}
                  {p.summary && p.summary.length > 200 && (
                    <button className="paper-toggle" onClick={() => toggle(p.id)}>
                      {isExpanded ? 'SHOW LESS' : 'READ MORE'}
                    </button>
                  )}
                  <div className="paper-meta">
                    <span className="dim">📅 {ago(new Date(p.publishedAt))}</span>
                    <a
                      className="open"
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      READ PAPER ↗
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
