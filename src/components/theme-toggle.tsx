'use client';

import { useEffect, useState } from 'react';
import { applyTheme, beginThemeTransition, parseTheme, resolveTheme, storeTheme, THEME_KEY, type Theme } from '@/lib/theme';

/**
 * Dark/light theme toggle. Without an explicit choice the theme follows the
 * OS preference live; clicking the toggle pins a choice to localStorage.
 * Renders a neutral glyph until mounted to avoid hydration mismatches.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const t = resolveTheme(localStorage.getItem(THEME_KEY), mq.matches);
      applyTheme(t);
      setTheme(t);
    };
    setMounted(true);
    apply();
    const onSystemChange = () => {
      if (!localStorage.getItem(THEME_KEY)) {
        beginThemeTransition();
        apply();
      }
    };
    mq.addEventListener('change', onSystemChange);

    // Account-level preference: when signed in, the server copy is canonical
    // and overrides this device's local choice so the theme follows the user.
    fetch('/api/prefs/theme')
      .then((r) => r.json())
      .then((j: { theme?: unknown }) => {
        const t = parseTheme(j.theme);
        if (!t) return;
        storeTheme(t);
        beginThemeTransition();
        applyTheme(t);
        setTheme(t);
      })
      .catch(() => {
        /* offline / demo — keep the local behavior */
      });

    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    beginThemeTransition();
    storeTheme(next);
    applyTheme(next);
    setTheme(next);
    fetch('/api/prefs/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {
      /* offline / demo — the local choice still applies */
    });
  };

  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button className="btn theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '◐'}
    </button>
  );
}
