'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const KEYS: { key: string; href: string; label: string }[] = [
  { key: 'm', href: '/model-watch', label: 'Model Watch' },
  { key: 'b', href: '/brief', label: 'Today in AI' },
  { key: 'l', href: '/leaderboard', label: 'Leaderboard' },
  { key: 'g', href: '/github', label: 'GitHub Trending' },
  { key: 'h', href: '/huggingface', label: 'HF Hub' },
  { key: 'r', href: '/radar', label: 'Radar' },
  { key: 'w', href: '/watchlist', label: 'Watchlist' },
  { key: 's', href: '/saved', label: 'Saved' },
];

/** Global keyboard shortcuts + the `?` help modal. Mounted once in the root layout. */
export function Shortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;

      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === '?' && !typing) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const hit = KEYS.find((k) => e.key.toLowerCase() === k.key);
      if (hit) {
        e.preventDefault();
        router.push(hit.href);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="help-modal" role="dialog" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()}>
        <div className="help-head">
          ⌨ KEYBOARD SHORTCUTS
          <button onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="help-grid">
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
      </div>
    </div>
  );
}
