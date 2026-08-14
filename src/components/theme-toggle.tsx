'use client';

import { useEffect, useState } from 'react';
import { applyTheme, resolveTheme, storeTheme, THEME_KEY, type Theme } from '@/lib/theme';

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
      if (!localStorage.getItem(THEME_KEY)) apply();
    };
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    storeTheme(next);
    applyTheme(next);
    setTheme(next);
  };

  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button className="btn theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '◐'}
    </button>
  );
}
