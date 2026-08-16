'use client';

import { openPalette } from './palette';

/** Topbar search button — opens the global command palette (⌘K). */
export function PaletteButton() {
  return (
    <button
      className="btn desk-btn"
      onClick={openPalette}
      aria-label="Search (command palette)"
      title="Search — Ctrl/Cmd+K or /"
    >
      🔍
    </button>
  );
}
