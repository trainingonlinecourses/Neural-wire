'use client';

import { useCallback, useEffect, useState } from 'react';
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

/** Compact author list: first 3 names + "et al." when there are more. */
function authorList(authors: string[]): string {
  if (authors.length === 0) return 'Unknown authors';
  if (authors.length <= 3) return authors.join(', ');
  return authors.slice(0, 3).join(', ') + ` et al. (${authors.length})`;
}

export function PapersView() {
  const [papers, setPapers] = useState<Paper[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [at, setAt] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <button className="btn primary" onClick={() => load(true)} disabled={loading}>
            {loading ? 'PULLING…' : '⟳ REFRESH'}
          </button>
          <span className="dim" style={{ alignSelf: 'center' }}>
            {papers ? `${papers.length} papers` : ''}
          </span>
        </div>
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>
            HUGGINGFACE DAILY PAPERS — trending ML/AI research, ranked by community upvotes
          </span>
          <span className="meta-right dim">
            {at ? 'fetched ' + ago(new Date(at)) : ''}
          </span>
        </div>
      </div>
      {error && !papers && (
        <div className="wrap">
          <p className="empty">
            <b>Papers feed unavailable ({error})</b>
            <br />
            Check connection and retry.
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
      {papers && papers.length > 0 && (
        <div className="wrap papers-list">
          {papers.map((p, i) => {
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
