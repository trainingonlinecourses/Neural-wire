/** Tiny global bus so any component can open/close the desk overlay (glossary + shortcuts). */
export const DESK_OVERLAY_EVENT = 'nw:desk-overlay';

export function openDeskOverlay(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DESK_OVERLAY_EVENT, { detail: { open: true } }));
}

export function closeDeskOverlay(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DESK_OVERLAY_EVENT, { detail: { open: false } }));
}
