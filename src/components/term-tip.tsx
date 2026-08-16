'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { glossaryById } from '@/lib/glossary';

interface Pos {
  x: number;
  bottom: number; // distance from the viewport bottom — bubble's bottom edge sits here
}

/**
 * Inline definition tooltip. Renders its children with a dotted-underline
 * affordance; hovering or focusing opens a bubble with the glossary
 * definition for `entryId`. Closes on ESC or outside click. The bubble is
 * measured from the trigger and positioned `fixed`, so scroll containers
 * (`overflow: auto` chip rows) can never clip it. Use `plain` when nesting
 * inside a button — it drops the focusable span so a11y stays clean.
 */
export function TermTip({
  entryId,
  align = 'center',
  plain = false,
  children,
}: {
  entryId: string;
  align?: 'center' | 'start' | 'end';
  /** Nest inside a button: no extra tab stop, hover-only affordance. */
  plain?: boolean;
  children: React.ReactNode;
}) {
  const entry = glossaryById(entryId);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const tipId = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const x = align === 'start' ? r.left : align === 'end' ? r.right : r.left + r.width / 2;
      setPos({ x, bottom: window.innerHeight - r.top + 8 });
    };
    measure();
    // Re-anchor while the page scrolls or resizes.
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open, align]);

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
      className={'termtip' + (open ? ' open' : '') + (plain ? ' plain' : '')}
      tabIndex={plain ? undefined : 0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={plain ? undefined : () => setOpen(true)}
      onBlur={plain ? undefined : () => setOpen(false)}
      aria-describedby={tipId}
    >
      {children}
      <span className="termtip-dot" aria-hidden="true">
        ?
      </span>
      {open && pos && (
        <span
          id={tipId}
          role="tooltip"
          className={'termtip-bubble align-' + align}
          style={{ left: pos.x, bottom: pos.bottom }}
        >
          <b>{entry.term}</b>
          <span className="termtip-def">{entry.short}</span>
          {entry.long && <em>{entry.long}</em>}
        </span>
      )}
    </span>
  );
}
