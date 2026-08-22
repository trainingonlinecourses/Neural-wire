'use client';

/**
 * KeyboardHelp — shows a floating help panel listing available keyboard
 * shortcuts. Appears when user presses ? and disappears on Escape.
 */

import { useEffect, useState } from 'react';

const SHORTCUTS = [
  { key: 'j', desc: 'Next story' },
  { key: 'k', desc: 'Previous story' },
  { key: 'o', desc: 'Open selected story' },
  { key: 'x', desc: 'Dismiss selected story' },
  { key: 'Esc', desc: 'Clear selection' },
  { key: '?', desc: 'Toggle this help' },
  { key: '/', desc: 'Focus search' },
  { key: '⌘K', desc: 'Global search' },
];

export function KeyboardHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '?' || (e.key === '/' && !e.metaKey && !e.ctrlKey)) {
        if (e.key === '?' || document.activeElement === document.body) {
          e.preventDefault();
          setOpen((prev) => !prev);
        }
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div className="kb-help-overlay" onClick={() => setOpen(false)}>
      <div className="kb-help-panel" onClick={(e) => e.stopPropagation()}>
        <div className="kb-help-head">
          <span>⌨️ Keyboard Shortcuts</span>
          <button className="kb-help-close" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="kb-help-list">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="kb-help-row">
              <kbd className="kb-help-key">{s.key}</kbd>
              <span className="kb-help-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
