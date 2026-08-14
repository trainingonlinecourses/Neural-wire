'use client';

import { useEffect, useState } from 'react';
import {
  applyTheme,
  beginThemeTransition,
  parseMode,
  resolveTheme,
  storeMode,
  THEME_KEY,
  type ThemeMode,
} from '@/lib/theme';

const SEGS: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: 'light', icon: '☀️', label: 'Light theme' },
  { mode: 'dark', icon: '🌙', label: 'Dark theme' },
  { mode: 'system', icon: '🖥️', label: 'Follow system theme' },
];

const prefersLight = () => window.matchMedia('(prefers-color-scheme: light)').matches;

/**
 * Light / Dark / System theme control. An explicit choice is pinned to
 * localStorage and (when signed in) synced to the account; the System mode
 * (also the default with no stored choice) follows the OS preference live.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => applyTheme(resolveTheme(localStorage.getItem(THEME_KEY), mq.matches));

    apply();
    setMode(parseMode(localStorage.getItem(THEME_KEY)) ?? 'system');

    const onSystemChange = () => {
      if (!localStorage.getItem(THEME_KEY)) {
        beginThemeTransition();
        apply();
      }
    };
    mq.addEventListener('change', onSystemChange);

    // Account-level preference: canonical when signed in, overrides this device.
    fetch('/api/prefs/theme')
      .then((r) => r.json())
      .then((j: { theme?: unknown }) => {
        const t = parseMode(j.theme);
        if (!t) return;
        storeMode(t);
        beginThemeTransition();
        applyTheme(resolveTheme(t, prefersLight()));
        setMode(t);
      })
      .catch(() => {
        /* offline / demo — keep the local behavior */
      });

    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  const select = (m: ThemeMode) => {
    beginThemeTransition();
    storeMode(m);
    applyTheme(resolveTheme(m, prefersLight()));
    setMode(m);
    fetch('/api/prefs/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: m }),
    }).catch(() => {
      /* offline / demo — the local choice still applies */
    });
  };

  return (
    <div className="seg theme-seg" role="group" aria-label="Theme">
      {SEGS.map((s) => (
        <button
          key={s.mode}
          className={'seg-btn' + (mode === s.mode ? ' active' : '')}
          onClick={() => select(s.mode)}
          aria-label={s.label}
          aria-pressed={mode === s.mode}
          title={s.label}
        >
          {s.icon}
        </button>
      ))}
    </div>
  );
}
