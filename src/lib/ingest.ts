import { entityDef } from './extract/entities';
import type { EntityKind, RawFeedItem } from './types';
import { srcById } from './sources';
import { normBatch } from './normalize';

/**
 * Pure ingest logic: raw feed items → DB-ready rows. No I/O — fully unit-testable.
 * The cron route calls this, then persists the rows with the service-role client.
 */

export interface IngestStoryRow {
  id: string; // sourceId::link (stories PK)
  source_id: string;
  title: string;
  link: string;
  description: string;
  thumbnail: string;
  points: number | null;
  comments: number | null;
  discussion: string | null;
  models: string[];
  topics: string[];
  entities: string[]; // canonical entity names detected
  is_model: boolean;
  published_at: string; // ISO
}

export interface IngestEntityRow {
  name: string;
  kind: EntityKind;
  aliases: string[];
}

export interface IngestEntityRef {
  story_id: string;
  entity_name: string;
}

export interface IngestBenchRow {
  model: string; // canonical entity name of the model
  benchmark_id: string;
  score: number;
  unit: string;
  story_id: string;
  reported_at: string; // ISO
}

export interface IngestPayload {
  stories: IngestStoryRow[];
  entities: IngestEntityRow[];
  storyEntities: IngestEntityRef[];
  benchRows: IngestBenchRow[];
}

/** Benchmark rule name → benchmark table id (matches the seed slugs). */
function benchId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function buildIngestPayload(itemsBySource: Map<string, RawFeedItem[]>): IngestPayload {
  const stories: IngestStoryRow[] = [];
  const entitySet = new Map<string, IngestEntityRow>();
  const storyEntities: IngestEntityRef[] = [];
  const benchRows: IngestBenchRow[] = [];

  for (const [sourceId, raws] of itemsBySource) {
    const src = srcById[sourceId];
    if (!src) continue;
    const batch = normBatch(raws, src);
    for (const s of batch) {
      stories.push({
        id: s.id,
        source_id: sourceId,
        title: s.title,
        link: s.link,
        description: s.description,
        thumbnail: s.img,
        points: s.points,
        comments: s.comments,
        discussion: s.discussion,
        models: s.models,
        topics: s.topics,
        entities: [], // filled below
        is_model: s.isModel,
        published_at: s.date.toISOString(),
      });

      // Canonical model entities detected on the story (from the dictionary).
      // Company/person entities are also detected at normalize time and could
      // be extended here; model entities are the priority for the leaderboard.
      const storyEntitiesRefs: string[] = [];
      for (const e of s.models) {
        const def = entityDef(e);
        if (def) {
          if (!entitySet.has(def.name)) entitySet.set(def.name, { name: def.name, kind: def.kind, aliases: def.aliases });
          if (!storyEntitiesRefs.includes(def.name)) storyEntitiesRefs.push(def.name);
        }
      }
      stories[stories.length - 1].entities = storyEntitiesRefs;
      for (const name of storyEntitiesRefs) storyEntities.push({ story_id: s.id, entity_name: name });

      // Benchmark scores: only where a known model entity AND a benchmark co-occur.
      if (storyEntitiesRefs.length && s.models.length) {
        for (const model of storyEntitiesRefs) {
          for (const b of s.benchmarks ?? []) {
            benchRows.push({
              model,
              benchmark_id: benchId(b.benchmark),
              score: b.score,
              unit: b.unit,
              story_id: s.id,
              reported_at: s.date.toISOString(),
            });
          }
        }
      }
    }
  }

  return { stories, entities: [...entitySet.values()], storyEntities, benchRows };
}
