import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeTerm,
  storySearchText,
  storyMatchesTerm,
  matchStories,
  loadWatchTerms,
  saveWatchTerms,
  WATCH_STORAGE_KEY,
  MAX_WATCH_TERMS,
} from './watch';
import type { Story } from '@/lib/types';

function story(id: string, over: Partial<Story> = {}): Story {
  return {
    id,
    title: 'A generic headline',
    link: 'https://example.com/' + id,
    description: '',
    date: new Date('2026-08-15T10:00:00Z'),
    img: '',
    points: null,
    comments: null,
    discussion: null,
    sourceId: 'hn',
    models: [],
    topics: [],
    benchmarks: [],
    isModel: false,
    ...over,
  };
}

describe('normalizeTerm', () => {
  it('trims, lowercases and collapses spaces', () => {
    expect(normalizeTerm('  MiStRal   AI ')).toBe('mistral ai');
    expect(normalizeTerm('')).toBe('');
  });
});

describe('storySearchText', () => {
  it('spans title, snippet, models and topics', () => {
    const s = story('1', { title: 'Claude goes fishing', description: 'anthropic updates', models: ['Claude'], topics: ['SECURITY'] });
    const txt = storySearchText(s);
    expect(txt).toContain('claude goes fishing');
    expect(txt).toContain('anthropic updates');
    expect(txt).toContain('claude');
    expect(txt).toContain('security');
  });
});

describe('storyMatchesTerm', () => {
  it('matches case-insensitively in the title', () => {
    expect(storyMatchesTerm(story('1', { title: 'OpenAI releases GPT-5' }), 'openai')).toBe(true);
  });

  it('matches multi-word terms', () => {
    expect(storyMatchesTerm(story('1', { title: 'Mistral AI releases a new model' }), 'mistral ai')).toBe(true);
  });

  it('rejects non-matches and empty terms', () => {
    expect(storyMatchesTerm(story('1', { title: 'NVIDIA earnings' }), 'microsoft')).toBe(false);
    expect(storyMatchesTerm(story('1', { title: 'Anything' }), '   ')).toBe(false);
  });

  it('matches models and topics', () => {
    expect(storyMatchesTerm(story('1', { models: ['Gemini'] }), 'gemini')).toBe(true);
    expect(storyMatchesTerm(story('1', { topics: ['REGULATION'] }), 'regulation')).toBe(true);
  });
});

describe('matchStories', () => {
  it('returns one alert per matching story', () => {
    const s1 = story('1', { title: 'OpenAI news' });
    const s2 = story('2', { title: 'OpenAI plus Anthropic' });
    const s3 = story('3', { title: 'unrelated' });
    const out = matchStories([s1, s2, s3], ['openai']);
    expect(out.map((o) => o.story.id).sort()).toEqual(['1', '2']);
    expect(out.every((o) => o.term === 'openai')).toBe(true);
  });

  it('flags a story for its first matching term only', () => {
    const s = story('1', { title: 'Anthropic OpenAI deal' });
    const out = matchStories([s], ['anthropic', 'openai']);
    expect(out).toHaveLength(1);
    expect(['anthropic', 'openai']).toContain(out[0].term);
  });
});

describe('persistence', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips terms', () => {
    saveWatchTerms(['OpenAI', '  mistral ai ']);
    expect(loadWatchTerms()).toEqual(['openai', 'mistral ai']);
  });

  it('ignores garbage in storage', () => {
    store.set(WATCH_STORAGE_KEY, 'not-json');
    expect(loadWatchTerms()).toEqual([]);
    store.set(WATCH_STORAGE_KEY, JSON.stringify([1, 2]));
    expect(loadWatchTerms()).toEqual([]);
  });

  it('caps at MAX_WATCH_TERMS', () => {
    const many = Array.from({ length: MAX_WATCH_TERMS + 5 }, (_, i) => 'term' + i);
    saveWatchTerms(many);
    expect(loadWatchTerms()).toHaveLength(MAX_WATCH_TERMS);
  });
});
