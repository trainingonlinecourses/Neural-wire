'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { glossaryById } from '@/lib/glossary';

/**
 * Inline definition tooltip. Renders its children with a dotted-underline
 * affordance; hovering or focusing opens a bubble with the glossary
 * definition for `entryId`. Closes on ESC or outside click. Safe to nest
 * inside a row link (a plain span, never a button).
 */
export function TermTip({
  entryId,
  align = 'center',
  children,
}: {
  entryId: string;
  align?: 'center' | 'start' | 'end';
  children: React.ReactNode;
}) {
  const entry = glossaryById(entryId);
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  // Unknown id — render children untouched so the UI never breaks.
  if (!entry) return <>{children}</>;

  return (
    <span
      ref={ref}
      className={'termtip' + (open ? ' open' : '')}
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={tipId}
    >
      {children}
      <span className="termtip-dot" aria-hidden="true">
        ?
      </span>
      {open && (
        <span id={tipId} role="tooltip" className={'termtip-bubble align-' + align}>
          <b>{entry.term}</b>
          <span className="termtip-def">{entry.short}</span>
          {entry.long && <em>{entry.long}</em>}
        </span>
      )}
    </span>
  );
}
