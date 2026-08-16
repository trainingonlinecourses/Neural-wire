'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NAV } from './nav';
import { GLOSSARY } from '@/lib/glossary';
import { srcById } from '@/lib/sources';

/** Custom event name so any trigger (topbar button, key, future surfaces) can open the palette. */
export const PALETTE_EVENT = 'nw-palette';

export function openPalette() {
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT));
}

interface StoryHit {
  id: string;
  title: string;
  sourceId: string;
  link: string;
  date?: string;
}

interface PaletteItem {
  id: string;
  group: 'PAGES' | 'STORIES' | 'GLOSSARY';
  title: string;
  sub?: string;
  href: string;
  icon: string;
}

const PAGE_ICONS: Record<string, string> = {
  '/': '📰',
  '/brief': '⚡',
  '/trending': '📈',
  '/model-watch': '🧠',
  '/leaderboard': '🏆',
  '/github': '🔥',
  '/huggingface': '🤗',
  '/pulse': '⚡',
  '/watchlist': '👀',
  '/saved': '💾',
  '/glossary': '📖',
};

/** Lazy story index: fetched once per session from the public news API. */
let storyIndex: StoryHit[] | null = null;
let storyIndexAt = 0;
const STORY_INDEX_TTL = 5 * 60 * 1000;

async function loadStories(): Promise<StoryHit[]> {
  if (storyIndex && Date.now() - storyIndexAt < STORY_INDEX_TTL) return storyIndex;
  const r = await fetch('/api/news/refresh', { cache: 'no-store' });
  if (!r.ok) throw new Error('news ' + r.status);
  const j = (await r.json()) as { stories: Array<Omit<StoryHit, 'link'> & { link: string }> };
  storyIndex = j.stories.map((s) => ({
    id: s.id,
    title: s.title,
    sourceId: s.sourceId,
    link: s.link,
    date: s.date,
  }));
  storyIndexAt = Date.now();
  return storyIndex;
}

export function Palette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const [stories, setStories] = useState<StoryHit[] | null>(null);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const openRef = useRef(false);

  const close = useCallback(() => {
    openRef.current = false;
    setOpen(false);
    setQ('');
    setIdx(0);
  }, []);

  // Open trigger: Ctrl/Cmd+K anywhere, or '/' when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (openRef.current) close();
        else openPalette();
        return;
      }
      if (e.key === '/' && !openRef.current) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
        e.preventDefault();
        openPalette();
      }
      if (openRef.current && e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const openPaletteInternal = useCallback(async () => {
    setQ('');
    setIdx(0);
    setFailed(false);
    setOpen(true);
    openRef.current = true;
    if (!storyIndex) {
      try {
        setStories(await loadStories());
      } catch {
        setFailed(true);
      }
    }
  }, []);

  useEffect(() => {
    const onEvent = () => void openPaletteInternal();
    window.addEventListener(PALETTE_EVENT, onEvent);
    return () => window.removeEventListener(PALETTE_EVENT, onEvent);
  }, [openPaletteInternal]);

  // Focus + scroll lock while open.
  useEffect(() => {
    if (!open) return;
    prevFocus.current = (document.activeElement as HTMLElement) ?? null;
    document.body.style.overflow = 'hidden';
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = '';
      prevFocus.current?.focus?.();
    };
  }, [open]);

  const needle = q.trim().toLowerCase();

  const pages: PaletteItem[] = useMemo(
    () =>
      NAV.map((n): PaletteItem => ({
        id: 'page:' + n.href,
        group: 'PAGES',
        title: n.label.replace(/^[^\s]+\s/, ''), // strip leading emoji
        sub: n.href === '/' ? 'the live wire' : n.href,
        href: n.href,
        icon: PAGE_ICONS[n.href] || '🔗',
      })).filter(
        (p) => !needle || p.title.toLowerCase().includes(needle) || p.sub!.includes(needle),
      ),
    [needle],
  );

  const glossaryItems: PaletteItem[] = useMemo(
    () =>
      GLOSSARY.filter(
        (e) =>
          !needle ||
          e.term.toLowerCase().includes(needle) ||
          e.short.toLowerCase().includes(needle),
      )
        .slice(0, 5)
        .map((e): PaletteItem => ({
          id: 'gloss:' + e.id,
          group: 'GLOSSARY',
          title: e.term,
          sub: e.short,
          href: '/glossary',
          icon: '📖',
        })),
    [needle],
  );

  const storyItems: PaletteItem[] = useMemo(() => {
    const src = stories ?? [];
    if (!needle) return [];
    return src
      .filter(
        (s) => s.title.toLowerCase().includes(needle) || s.sourceId.toLowerCase().includes(needle),
      )
      .slice(0, 6)
      .map((s): PaletteItem => ({
        id: 'story:' + s.id,
        group: 'STORIES',
        title: s.title,
        sub: (srcById[s.sourceId]?.name || s.sourceId) + ' · opens in a new tab',
        href: s.link,
        icon: '📰',
      }));
  }, [needle, stories]);

  const results: PaletteItem[] = useMemo(
    () => [...pages, ...storyItems, ...glossaryItems],
    [pages, storyItems, glossaryItems],
  );

  const groupLabels: PaletteItem['group'][] = ['PAGES', 'STORIES', 'GLOSSARY'];

  // Reset the selection whenever the result set changes shape.
  useEffect(() => {
    setIdx(0);
  }, [needle, results.length]);

  const select = (item: PaletteItem) => {
    close();
    if (item.href.startsWith('http')) {
      window.open(item.href, '_blank', 'noopener');
    } else {
      router.push(item.href);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[idx]) select(results[idx]);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  if (!open) return null;

  return (
    <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onClick={close}>
      <div className="palette-panel" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-row">
          <span className="palette-prefix">⌘K</span>
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search pages, stories, glossary…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Command palette search"
          />
          <button className="palette-close" onClick={close} aria-label="Close command palette">
            ✕
          </button>
        </div>
        <div className="palette-list">
          {failed && !stories && (
            <div className="palette-note">Story search is offline — pages and glossary still work.</div>
          )}
          {results.length === 0 && (
            <div className="palette-note">
              No matches for “{q}”. Try a page name, a headline or a glossary term.
            </div>
          )}
          {groupLabels.map((g) => {
            const items = results.filter((r) => r.group === g);
            if (items.length === 0) return null;
            const base = results.findIndex((r) => r.id === items[0].id);
            return (
              <div key={g}>
                <div className="palette-group">{g} · {items.length}</div>
                {items.map((it, i) => {
                  const gi = base + i;
                  return (
                    <button
                      key={it.id}
                      className={'palette-item' + (gi === idx ? ' sel' : '')}
                      onMouseEnter={() => setIdx(gi)}
                      onClick={() => select(it)}
                    >
                      <span className="palette-icon">{it.icon}</span>
                      <span className="palette-text">
                        <span className="palette-title">{it.title}</span>
                        {it.sub && <span className="palette-sub">{it.sub}</span>}
                      </span>
                      <span className="palette-go">↗</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
