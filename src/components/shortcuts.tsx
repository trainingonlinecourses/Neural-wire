'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GLOSSARY, type GlossaryCategory } from '@/lib/glossary';
import { DESK_OVERLAY_EVENT } from '@/lib/desk-overlay';

const KEYS: { key: string; href: string; label: string }[] = [
  { key: 'm', href: '/model-watch', label: 'Model Watch' },
  { key: 'b', href: '/brief', label: 'Today in AI' },
  { key: 't', href: '/trending', label: 'Trending' },
  { key: 'l', href: '/leaderboard', label: 'Leaderboard' },
  { key: 'g', href: '/github', label: 'GitHub Trending' },
  { key: 'h', href: '/huggingface', label: 'HF Hub' },
  { key: 'r', href: '/radar', label: 'Radar' },
  { key: 'w', href: '/watchlist', label: 'Watchlist' },
  { key: 's', href: '/saved', label: 'Saved' },
];

const CAT_ORDER: GlossaryCategory[] = ['ranking', 'desk', 'data', 'account'];
const CAT_LABEL: Record<GlossaryCategory, string> = {
  ranking: 'RANKING & SIGNALS',
  desk: 'THE DESK',
  data: 'SOURCES & ENTITIES',
  account: 'ACCOUNT & TOOLS',
};

type Tab = 'glossary' | 'keys';

/**
 * Global desk overlay — press `?` anywhere (except while typing) to open the
 * fullscreen glossary, or flip to the keyboard-shortcuts tab. ESC, ✕ or the
 * backdrop close it. Mounted once in the root layout.
 */
export function Shortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('glossary');
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  const close = () => {
    setOpen(false);
    setQ('');
  };

  // Allow other UI (e.g. the topbar ? button) to open/close the overlay.
  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      if (detail?.open === false) close();
      else {
        setQ('');
        setOpen(true);
      }
    };
    window.addEventListener(DESK_OVERLAY_EVENT, onEvent);
    return () => window.removeEventListener(DESK_OVERLAY_EVENT, onEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;

      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === '?' && !typing) {
        e.preventDefault();
        if (!open) setQ('');
        setOpen((v) => !v);
        return;
      }
      if (open) return; // overlay is up — don't hijack nav keys while typing in search
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const hit = KEYS.find((k) => e.key.toLowerCase() === k.key);
      if (hit) {
        e.preventDefault();
        router.push(hit.href);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, open]);

  // Focus management + body scroll lock while the overlay is up.
  useEffect(() => {
    if (!open) return;
    prevFocus.current = (document.activeElement as HTMLElement) ?? null;
    document.body.style.overflow = 'hidden';
    const id = window.setTimeout(() => searchRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = '';
      prevFocus.current?.focus?.();
    };
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return GLOSSARY;
    return GLOSSARY.filter(
      (e) =>
        e.term.toLowerCase().includes(needle) ||
        e.short.toLowerCase().includes(needle) ||
        (e.long || '').toLowerCase().includes(needle),
    );
  }, [q]);

  const grouped = useMemo(
    () =>
      CAT_ORDER.map((c) => ({
        cat: c,
        entries: filtered.filter((e) => e.category === c),
      })).filter((g) => g.entries.length > 0),
    [filtered],
  );

  if (!open) return null;

  return (
    <div className="gloss-overlay" role="dialog" aria-modal="true" aria-label="Desk glossary and shortcuts" onClick={close}>
      <div className="gloss-overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="gloss-overlay-head">
          <div className="gloss-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'glossary'}
              className={'gloss-tab' + (tab === 'glossary' ? ' on' : '')}
              onClick={() => setTab('glossary')}
            >
              GLOSSARY · {GLOSSARY.length}
            </button>
            <button
              role="tab"
              aria-selected={tab === 'keys'}
              className={'gloss-tab' + (tab === 'keys' ? ' on' : '')}
              onClick={() => setTab('keys')}
            >
              SHORTCUTS
            </button>
          </div>
          <div className="gloss-overlay-keys">
            <kbd>?</kbd>
            <kbd>ESC</kbd>
            <button onClick={close} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {tab === 'keys' ? (
          <div className="help-grid gloss-keys-grid">
            {KEYS.map((k) => (
              <div key={k.key}>
                <kbd>{k.key.toUpperCase()}</kbd> {k.label}
              </div>
            ))}
            <div>
              <kbd>?</kbd> Toggle this panel
            </div>
            <div>
              <kbd>ESC</kbd> Close
            </div>
          </div>
        ) : (
          <>
            <div className="gloss-overlay-search">
              <input
                ref={searchRef}
                className="field"
                placeholder="Search the glossary — movers, heat, radar, entity…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search glossary"
              />
              <span className="gloss-count">
                {filtered.length}/{GLOSSARY.length} TERMS
              </span>
            </div>
            <div className="gloss-overlay-body">
              {grouped.length > 0 ? (
                grouped.map(({ cat, entries }) => (
                  <section key={cat} className="gloss-ov-group">
                    <h4 className="gloss-ov-cat">
                      {CAT_LABEL[cat]} · {entries.length}
                    </h4>
                    {entries.map((e) => (
                      <article key={e.id} className="gloss-ov-entry">
                        <div className="gloss-ov-term">
                          <b>{e.term}</b>
                          <span className={`gloss-tag ${e.category}`}>{CAT_LABEL[e.category]}</span>
                        </div>
                        <p>{e.short}</p>
                        {e.long && <p className="gloss-ov-long">{e.long}</p>}
                        {e.see && e.see.length > 0 && (
                          <div className="gloss-ov-see">
                            {e.see.map((s) => (
                              <Link key={s.href} href={s.href} onClick={close}>
                                {s.label} ↗
                              </Link>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </section>
                ))
              ) : (
                <p className="empty">
                  <b>No terms match “{q}”.</b> Try another search.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
