export type Theme = 'dark' | 'light';

/** A user's theme choice — 'system' means follow the OS preference live. */
export type ThemeMode = Theme | 'system';

/** localStorage key holding the user's mode (absent = follow the system). */
export const THEME_KEY = 'nw-theme';

/** Explicit mode wins; 'system' (or nothing) falls back to the OS setting. */
export function resolveTheme(stored: string | null, prefersLight: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersLight ? 'light' : 'dark';
}

/** Normalize a stored/server theme value to a mode, or null when absent/invalid. */
export function parseMode(value: unknown): ThemeMode | null {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}

/** Persist the mode so it survives reloads. 'system' re-enables OS-following. */
export function storeMode(mode: ThemeMode): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(THEME_KEY, mode);
}

/** Merge a theme mode into a user-prefs object (jsonb-safe, preserves other keys). */
export function withThemePref(existing: Record<string, unknown>, theme: ThemeMode): Record<string, unknown> {
  return { ...existing, theme };
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
