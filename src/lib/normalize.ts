import { extractStoryMeta } from './extract';
import type { RawFeedItem, Source, Story } from './types';
import { stripHtml } from './utils';

/**
 * Normalize a raw feed item into a canonical Story, running all detectors
 * (models, topics, entities, benchmarks). Port of the original `normItem`.
 */
export function normItem(raw: RawFeedItem, src: Source): Story {
  const title = stripHtml(raw.title || 'Untitled');
  const link = (raw.link || '').trim();
  const desc = stripHtml(raw.description || '').slice(0, 400);

  let date = new Date(raw.pubDate || Date.now());
  if (isNaN(date.getTime())) date = new Date();

  const meta = extractStoryMeta(title, desc);

  return {
    id: src.id + '::' + link,
    sourceId: src.id,
    title,
    link,
    description: desc,
    date,
    img: (raw.thumbnail || '').trim(),
    points: raw.points ?? null,
    comments: raw.comments ?? null,
    discussion: raw.discuss ?? null,
    models: meta.models,
    topics: meta.topics,
    benchmarks: meta.benchmarks,
    isModel: meta.isModel,
  };
}

/** Normalize a batch, dropping empty titles. */
export function normBatch(raws: RawFeedItem[], src: Source): Story[] {
  return raws
    .filter((r) => (r.title || '').trim().length > 0)
    .map((r) => normItem(r, src));
}
