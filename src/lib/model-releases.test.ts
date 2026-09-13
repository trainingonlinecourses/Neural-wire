import { describe, expect, it } from 'vitest';
import {
  deriveCostTier,
  filterRecent,
  groupReleasesByDate,
  kindLabel,
  perMillion,
  releaseFromLiveModel,
  storyMentionsRelease,
} from './model-releases';
import type { LiveModel } from './live-models';

function fixture(m: Partial<LiveModel> & { id: string }): LiveModel {
  return {
    name: m.id.split('/').slice(1).join('/') || m.id,
    vendor: 'TestOrg',
    created: Math.floor(Date.now() / 1000) - 3 * 24 * 3600,
    benchmarks: [],
    ...m,
  };
}

describe('live model releases (real registry mappers)', () => {
  it('passes registry pricing through (already per-1M tokens)', () => {
    expect(perMillion(6)).toBe(6);
    expect(perMillion(undefined)).toBeUndefined();
  });

  it('derives a real cost tier from actual pricing', () => {
    expect(deriveCostTier(0, 0)).toBe('free');
    expect(deriveCostTier(0.6, 0.6)).toBe('low'); // $1.2/M combined
    expect(deriveCostTier(3, 3)).toBe('medium'); // $6/M combined
    expect(deriveCostTier(25, 5)).toBe('high'); // $30/M combined
  });

  it('classifies open weights when an HF repo exists, else frontier API', () => {
    const open = releaseFromLiveModel(
      fixture({ id: 'Qwen/Qwen3.8-27B', hfUrl: 'https://huggingface.co/Qwen/Qwen3.8-27B' }),
    );
    expect(open.openSource).toBe(true);
    expect(open.source).toBe('https://huggingface.co/Qwen/Qwen3.8-27B');
    const frontier = releaseFromLiveModel(
      fixture({ id: 'gpt-5.1', modelsdevUrl: 'https://openrouter.ai/gpt-5.1' }),
    );
    expect(frontier.openSource).toBe(false);
    expect(frontier.source).toBe('https://openrouter.ai/gpt-5.1');
  });

  it('keeps genuinely recent releases and drops dated or undated ones', () => {
    const now = Date.now() / 1000;
    const recent = releaseFromLiveModel(fixture({ id: 'A/a', created: now - 5 * 86400 }));
    const stale = releaseFromLiveModel(fixture({ id: 'B/b', created: now - 400 * 86400 }));
    const nodate = releaseFromLiveModel(fixture({ id: 'C/c', created: 0 }));
    const out = filterRecent([stale, recent, nodate], 30);
    expect(out.map((r) => r.id)).toEqual(['A/a']);
  });

  it('defaults to a 30-day freshness window', () => {
    const now = Date.now() / 1000;
    const thisMonth = releaseFromLiveModel(fixture({ id: 'A/a', created: now - 20 * 86400 }));
    const stale2 = releaseFromLiveModel(fixture({ id: 'B/b', created: now - 60 * 86400 }));
    expect(filterRecent([thisMonth, stale2]).map((r) => r.id)).toEqual(['A/a']);
  });

  it('groups fresh releases into LAST 24 HOURS / THIS WEEK / THIS MONTH', () => {
    const now = Date.now();
    const mk = (id: string, hoursAgo: number) =>
      releaseFromLiveModel(fixture({ id, created: Math.floor(now / 1000) - hoursAgo * 3600 }));
    const out = groupReleasesByDate([mk('C/c', 3 * 24), mk('B/b', 3 * 24), mk('A/a', 2)], now);
    expect(out.map((s) => s.label)).toEqual(['LAST 24 HOURS', 'THIS WEEK']);
    expect(out[0].releases.map((r) => r.id)).toEqual(['A/a']);
    expect(out[1].releases.map((r) => r.id)).toEqual(['C/c', 'B/b']); // newest first
  });

  it('puts 8-day-old releases in THIS MONTH and drops nothing stale', () => {
    const now = Date.now();
    const mk = (id: string, daysAgo: number) =>
      releaseFromLiveModel(fixture({ id, created: Math.floor(now / 1000) - daysAgo * 86400 }));
    const out = groupReleasesByDate([mk('A/a', 8), mk('B/b', 29)], now);
    expect(out.map((s) => s.label)).toEqual(['THIS MONTH']);
    expect(out[0].releases.map((r) => r.id)).toEqual(['A/a', 'B/b']);
  });

  it('labels kinds readably', () => {
    expect(kindLabel(releaseFromLiveModel(fixture({ id: 'openai/gpt-5.1' })))).toBe('FRONTIER API');
  });

  it('matches story tags either way around', () => {
    const rel = releaseFromLiveModel(fixture({ id: 'NoOrg/GPT-5.1', name: 'GPT-5.1' }));
    expect(storyMentionsRelease(['GPT-5'], rel)).toBe(true);
    expect(storyMentionsRelease(['NVIDIA'], rel)).toBe(false);
  });
});