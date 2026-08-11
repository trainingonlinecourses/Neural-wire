import { describe, expect, it } from 'vitest';
import { buildIngestPayload } from './ingest';
import type { RawFeedItem } from './types';

describe('buildIngestPayload', () => {
  it('produces stories, entities, links and bench rows for a model story', () => {
    const map = new Map<string, RawFeedItem[]>([
      [
        'openai',
        [
          {
            title: 'OpenAI releases GPT-5 with Arena Elo 1423',
            link: 'https://openai.com/blog/gpt5',
            pubDate: '2026-08-05T10:00:00Z',
          },
        ],
      ],
    ]);

    const payload = buildIngestPayload(map);

    expect(payload.stories).toHaveLength(1);
    const story = payload.stories[0];
    expect(story.id).toBe('openai::https://openai.com/blog/gpt5');
    expect(story.source_id).toBe('openai');
    expect(story.models).toContain('GPT-5');
    expect(story.is_model).toBe(true);

    // GPT-5 is a dictionary entity → appears in entities + story_entities.
    expect(payload.entities.some((e) => e.name === 'GPT-5')).toBe(true);
    expect(payload.storyEntities.some((r) => r.story_id === story.id && r.entity_name === 'GPT-5')).toBe(true);

    // Benchmark row for GPT-5 on Arena Elo.
    expect(payload.benchRows).toEqual([
      {
        model: 'GPT-5',
        benchmark_id: 'arena-elo',
        score: 1423,
        unit: 'elo',
        story_id: story.id,
        reported_at: story.published_at,
      },
    ]);
  });

  it('skips benchmark rows when no known model co-occurs', () => {
    const map = new Map<string, RawFeedItem[]>([
      [
        'techcrunch',
        [
          {
            title: 'Startup raises $5M for warehouse robots',
            link: 'https://techcrunch.com/2026/08/05/robots',
            pubDate: '2026-08-05T10:00:00Z',
          },
        ],
      ],
    ]);
    const payload = buildIngestPayload(map);
    expect(payload.benchRows).toEqual([]);
    expect(payload.stories).toHaveLength(1);
    expect(payload.stories[0].entities).toEqual([]);
  });

  it('ignores unknown source ids', () => {
    const map = new Map<string, RawFeedItem[]>([['nope', [{ title: 'x', link: 'https://x' }]]]);
    expect(buildIngestPayload(map).stories).toEqual([]);
  });
});
