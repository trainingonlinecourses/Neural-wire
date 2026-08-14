import { describe, expect, it } from 'vitest';
import { resolveTheme } from './theme';

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
