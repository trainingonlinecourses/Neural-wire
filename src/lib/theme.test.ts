import { afterEach, describe, expect, it, vi } from 'vitest';
import { beginThemeTransition, resolveTheme } from './theme';

describe('resolveTheme', () => {
  it('prefers an explicit stored choice', () => {
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
  });
  it('falls back to the system when nothing is stored', () => {
    expect(resolveTheme(null, true)).toBe('light');
    expect(resolveTheme(null, false)).toBe('dark');
  });
  it('treats an empty or invalid stored value as no preference', () => {
    expect(resolveTheme('', true)).toBe('light');
    expect(resolveTheme('neon', false)).toBe('dark');
  });
});

describe('beginThemeTransition', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('adds the transition class to the document root and removes it after the timeout', () => {
    vi.useFakeTimers();
    const classes = new Set<string>();
    vi.stubGlobal('document', {
      documentElement: {
        classList: {
          add: (c: string) => classes.add(c),
          remove: (c: string) => classes.delete(c),
        },
      },
    });
    beginThemeTransition();
    expect(classes.has('theme-transition')).toBe(true);
    vi.advanceTimersByTime(400);
    expect(classes.has('theme-transition')).toBe(false);
  });

  it('is a no-op without a document (server side)', () => {
    expect(() => beginThemeTransition()).not.toThrow();
  });
});
