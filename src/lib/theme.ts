export type Theme = 'dark' | 'light';

/** localStorage key holding an explicit user choice (absent = follow the system). */
export const THEME_KEY = 'nw-theme';

/** Explicit stored preference wins; otherwise fall back to the system setting. */
export function resolveTheme(stored: string | null, prefersLight: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersLight ? 'light' : 'dark';
}

/** Persist the explicit choice so it survives reloads and overrides system changes. */
export function storeTheme(theme: Theme): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
}

/** Merge a theme into a user-prefs object (jsonb-safe, preserves other keys). */
export function withThemePref(existing: Record<string, unknown>, theme: Theme): Record<string, unknown> {
  return { ...existing, theme };
}

/** Normalize a server-sent theme value to a Theme, or null when absent/invalid. */
export function parseTheme(value: unknown): Theme | null {
  return value === 'dark' || value === 'light' ? value : null;
}

/** Apply the theme to the document root (no-op on the server). */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

const TRANSITION_CLASS = 'theme-transition';
const TRANSITION_MS = 400;
let transitionTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Temporarily enable the global theme-transition CSS rule so the next theme
 * change eases instead of snapping. The class is removed after the transition
 * so hover effects keep their own transitions. No-op on the server.
 */
export function beginThemeTransition(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add(TRANSITION_CLASS);
  if (transitionTimer) clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_MS);
}
