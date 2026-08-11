import { describe, expect, it } from 'vitest';
import { normBatch, normItem } from './normalize';
import type { RawFeedItem, Source } from './types';

const src: Source = {
  id: 'fixture',
  name: 'Fixture',
  short: 'FX',
  color: '#fff',
  grad: '#000',
  kind: 'rss',
  url: 'https://example.com/feed',
};

describe('normItem', () => {
  it('builds a canonical story with detectors applied', () => {
    const raw: RawFeedItem = {
      title: 'OpenAI releases GPT-5',
      link: 'https://example.com/gpt5',
      pubDate: 'Tue, 05 Aug 2026 10:00:00 GMT',
      description: '<p>OpenAI announced <b>GPT-5</b> with SWE-bench Verified 92.1%</p>',
      thumbnail: 'https://example.com/img.png',
    };
    const story = normItem(raw, src);
    expect(story.id).toBe('fixture::https://example.com/gpt5');
    expect(story.sourceId).toBe('fixture');
    expect(story.title).toBe('OpenAI releases GPT-5');
    expect(story.models).toContain('GPT-5');
    expect(story.isModel).toBe(true);
    expect(story.topics).toContain('PRODUCT');
    expect(story.description).not.toContain('<');
    expect(story.benchmarks).toEqual([{ benchmark: 'SWE-bench Verified', score: 92.1, unit: '%' }]);
    expect(story.img).toBe('https://example.com/img.png');
    expect(story.date.toISOString()).toBe('2026-08-05T10:00:00.000Z');
  });

  it('falls back to now on an invalid date', () => {
    const story = normItem({ title: 'x', link: 'https://example.com/x', pubDate: 'not a date' }, src);
    expect(story.date.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it('strips HTML from description', () => {
    const story = normItem({ title: 'x', link: 'https://example.com/x', description: '<b>hi</b> &amp; bye' }, src);
    expect(story.description).toContain('hi');
    expect(story.description).toContain('&');
    expect(story.description).not.toContain('<');
  });
});

describe('normBatch', () => {
  it('drops empty-titled items', () => {
    const batch = normBatch(
      [
        { title: '', link: 'https://example.com/1' },
        { title: '   ', link: 'https://example.com/2' },
        { title: 'Real story', link: 'https://example.com/3' },
      ],
      src,
    );
    expect(batch).toHaveLength(1);
    expect(batch[0].title).toBe('Real story');
  });
});
