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

/**
 * Normalize a batch, dropping empty titles and deduplicating by normalized
 * title (same story covered by multiple sources → keep the first one).
 */
export function normBatch(raws: RawFeedItem[], src: Source, seenTitles?: Set<string>): Story[] {
  const localSeen = seenTitles || new Set<string>();
  const results: Story[] = [];
  for (const r of raws) {
    const title = stripHtml(r.title || '').trim();
    if (!title) continue;
    // Normalize title for dedup: lowercase, strip punctuation, collapse whitespace
    const norm = title.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, ' ').trim();
    if (norm.length < 5) continue; // skip very short titles (noise)
    if (localSeen.has(norm)) continue; // duplicate title across sources
    localSeen.add(norm);
    results.push(normItem(r, src));
  }
  return results;
}
