'use client';

import { useState } from 'react';
import type { Story } from '@/lib/types';
import { srcById } from '@/lib/sources';
import { ago } from '@/lib/utils';

/**
 * "Same story, N sources" chip. Renders the coverage count; expanding lists
 * the other stories covering the same item with their source badges.
 */
export function CoverageChip({ members }: { members: Story[] }) {
  const [open, setOpen] = useState(false);
  if (!members.length) return null;
  return (
    <div className={'coverage' + (open ? ' open' : '')}>
      <button className="coverage-chip" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="coverage-icon">⌘</span> {members.length} {members.length === 1 ? 'SOURCE' : 'SOURCES'} COVERING
        <span className={'coverage-caret' + (open ? ' up' : '')}>▾</span>
      </button>
      {open && (
        <div className="coverage-panel">
          {members.map((m) => {
            const s = srcById[m.sourceId];
            return (
              <a key={m.id} className="coverage-item" href={m.link} target="_blank" rel="noopener noreferrer">
                <span className="coverage-src" style={{ background: s?.color || '#4f7cff' }}>
                  {s?.short || m.sourceId.toUpperCase()}
                </span>
                <span className="coverage-title">{m.title}</span>
                <span className="coverage-time">{ago(m.date)}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
