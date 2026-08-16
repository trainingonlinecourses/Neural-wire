'use client';

import { openDeskOverlay } from '@/lib/desk-overlay';

/** Topbar `?` button — opens the fullscreen desk overlay (glossary + shortcuts). */
export function DeskButton() {
  return (
    <button
      className="btn desk-btn"
      onClick={openDeskOverlay}
      aria-label="Open glossary and shortcuts"
      title="Glossary & shortcuts (?)"
    >
      ?
    </button>
  );
}
