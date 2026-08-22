'use client';

/**
 * GlobalSearch — a Cmd+K search overlay that searches across all desk
 * content: stories, models, glossary terms, and page navigation.
 * Shows instant results with keyboard navigation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Story } from '@/lib/types';

interface SearchResult {
  type: 'page' | 'story' | 'model' | 'term';
  title: string;
  subtitle?: string;
  url: string;
  icon: string;
}

const PAGES: { href: string; label: string; icon: string; keywords: string[] }[] = [
  { href: '/', label: 'Newsroom', icon: '📰', keywords: ['news', 'feed', 'wire'] },
  { href: '/brief', label: 'Today in AI', icon: '⚡', keywords: ['brief', 'digest', 'summary'] },
  { href: '/trending', label: 'Trending', icon: '📈', keywords: ['trending', 'rising', 'hot'] },
  { href: '/model-watch', label: 'Model Watch', icon: '🧠', keywords: ['models', 'releases', 'new'] },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆', keywords: ['benchmarks', 'scores', 'compare'] },
  { href: '/github', label: 'GitHub Trending', icon: '🔥', keywords: ['repos', 'github', 'open-source'] },
  { href: '/huggingface', label: 'HF Hub', icon: '🤗', keywords: ['huggingface', 'models', 'spaces'] },
  { href: '/pulse', label: 'AI Pulse', icon: '⚡', keywords: ['signals', 'pulse', 'activity'] },
  { href: '/papers', label: 'Papers', icon: '📄', keywords: ['papers', 'arxiv', 'research'] },
  { href: '/graph', label: 'Story Graph', icon: '🕸', keywords: ['graph', 'connections', 'clusters'] },
  { href: '/timeline', label: 'Timeline', icon: '📅', keywords: ['timeline', 'history', 'events'] },
  { href: '/capability-matrix', label: 'Model Matrix', icon: '📊', keywords: ['matrix', 'radar', 'compare'] },
  { href: '/sentiment', label: 'Sentiment', icon: '📈', keywords: ['sentiment', 'momentum', 'mood'] },
  { href: '/breakthrough', label: 'Alerts', icon: '🚨', keywords: ['breakthrough', 'alerts', 'detection'] },
  { href: '/glossary', label: 'Glossary', icon: '📖', keywords: ['glossary', 'terms', 'definitions'] },
  { href: '/watchlist', label: 'Watchlist', icon: '👀', keywords: ['watchlist', 'follow', 'track'] },
  { href: '/saved', label: 'Saved', icon: '💾', keywords: ['saved', 'collections', 'bookmarks'] },
];

const MAX_RESULTS = 12;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);

  // Fetch stories on open (lazy load)
  useEffect(() => {
    if (open && stories.length === 0) {
      fetch('/api/news')
        .then((r) => r.json())
        .then((j) => {
          if (j.stories) {
            setStories(
              j.stories.map((s: Story & { date: string }) => ({
                ...s,
                date: new Date(s.date),
              })),
            );
          }
        })
        .catch(() => {});
    }
  }, [open, stories.length]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Show featured pages when empty query
      return PAGES.slice(0, MAX_RESULTS).map((p) => ({
        type: 'page' as const,
        title: p.label,
        url: p.href,
        icon: p.icon,
      }));
    }

    const items: SearchResult[] = [];

    // Search pages
    for (const p of PAGES) {
      const match =
        p.label.toLowerCase().includes(q) || p.keywords.some((k) => k.includes(q));
      if (match) {
        items.push({ type: 'page', title: p.label, url: p.href, icon: p.icon });
      }
    }

    // Search stories
    for (const s of stories) {
      const title = s.title.toLowerCase();
      const desc = (s.description ?? '').toLowerCase();
      const models = s.models?.join(' ').toLowerCase() ?? '';
      const topics = s.topics?.join(' ').toLowerCase() ?? '';
      if (title.includes(q) || desc.includes(q) || models.includes(q) || topics.includes(q)) {
        items.push({
          type: 'story',
          title: s.title,
          subtitle: s.sourceId,
          url: s.link,
          icon: '📰',
        });
      }
      if (items.length >= MAX_RESULTS) break;
    }

    // Search models from stories
    const modelSet = new Set<string>();
    for (const s of stories) {
      if (s.models) {
        for (const m of s.models) {
          if (m.toLowerCase().includes(q) && !modelSet.has(m)) {
            modelSet.add(m);
            items.push({
              type: 'model',
              title: m,
              url: `/model-watch`,
              icon: '🧠',
            });
          }
        }
      }
      if (items.length >= MAX_RESULTS) break;
    }

    return items.slice(0, MAX_RESULTS);
  }, [query, stories]);

  const navigate = useCallback(
    (url: string) => {
      setOpen(false);
      if (url.startsWith('http')) {
        window.open(url, '_blank');
      } else {
        router.push(url);
      }
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      navigate(results[activeIdx].url);
    }
  };

  if (!open) {
    return (
      <button className="search-trigger" onClick={() => setOpen(true)} title="Search (⌘K)">
        🔍 <span className="search-trigger-label">Search</span>
        <kbd className="search-trigger-kbd">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="search-overlay" onClick={() => setOpen(false)}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search stories, models, pages…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="search-esc" onClick={() => setOpen(false)}>
            ESC
          </kbd>
        </div>
        <div className="search-results">
          {results.length === 0 && query && (
            <div className="search-empty">No results for &ldquo;{query}&rdquo;</div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}:${r.url}:${r.title}`}
              className={'search-result' + (i === activeIdx ? ' active' : '')}
              onClick={() => navigate(r.url)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="search-result-icon">{r.icon}</span>
              <div className="search-result-text">
                <span className="search-result-title">{r.title}</span>
                {r.subtitle && <span className="search-result-sub">{r.subtitle}</span>}
              </div>
              <span className="search-result-type">{r.type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
