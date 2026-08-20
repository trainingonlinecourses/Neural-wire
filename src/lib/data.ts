import { SOURCES, srcById } from './sources';
import type { BenchRef, Source, SourceStatus, Story } from './types';
import { fetchAllSources } from './feeds';
import { normBatch } from './normalize';
import { isSupabaseConfigured } from './supabase/admin';
import { createClient } from './supabase/server';

export interface SourceRow {
  id: string;
  name: string;
  short: string;
  color: string;
  status: SourceStatus;
  count: number;
}

export interface NewsData {
  stories: Story[];
  sources: SourceRow[];
  demo: boolean;
  fetchedAt: number;
}

const DEMO_TTL = 180_000;
let demoCache: NewsData | null = null;

/** DEMO_MODE: fetch live feeds directly (no DB). 3-min in-memory cache. */
async function demoNews(): Promise<NewsData> {
  if (demoCache && Date.now() - demoCache.fetchedAt < DEMO_TTL) return demoCache;
  const map = await fetchAllSources([]);
  const stories: Story[] = [];
  const sources: SourceRow[] = SOURCES.map((s) => ({
    id: s.id,
    name: s.name,
    short: s.short,
    color: s.color,
    status: 'on',
    count: 0,
  }));
  for (const [id, items] of map) {
    const src = srcById[id];
    if (!src) continue;
    const batch = normBatch(items, src);
    stories.push(...batch);
    const row = sources.find((x) => x.id === id);
    if (row) row.count = batch.length;
  }
  stories.sort((a, b) => b.date.getTime() - a.date.getTime());
  demoCache = { stories, sources, demo: true, fetchedAt: Date.now() };
  return demoCache;
}

/** Real path: stories from Postgres. Public read via anon client (RLS). */
async function dbNews(): Promise<NewsData> {
  const supabase = await createClient();
  const [{ data: stories, error }, { data: sources }] = await Promise.all([
    supabase.from('stories').select('*').order('published_at', { ascending: false }).limit(300),
    supabase.from('sources').select('*'),
  ]);
  if (error) throw error;
  const rows: SourceRow[] = (sources as Array<Record<string, unknown>> | null ?? []).map((s) => ({
    id: String(s.id),
    name: String(s.name),
    short: String(s.short),
    color: (s.color as string) || '',
    status: 'on',
    count: 0,
  }));
  const parsed: Story[] = (stories as Array<Record<string, unknown>> | null ?? []).map((s) => ({
    id: String(s.id),
    sourceId: String(s.source_id),
    title: String(s.title),
    link: String(s.link),
    description: String(s.description || ''),
    date: new Date(String(s.published_at)),
    img: String(s.thumbnail || ''),
    points: (s.points as number) ?? null,
    comments: (s.comments as number) ?? null,
    discussion: (s.discussion as string) || null,
    models: (s.models as string[]) || [],
    topics: (s.topics as string[]) || [],
    benchmarks: (s.benchmarks as BenchRef[]) || [],
    isModel: Boolean(s.is_model),
  }));
  for (const s of parsed) {
    const row = rows.find((r) => r.id === s.sourceId);
    if (row) row.count += 1;
  }
  const payload = { stories: parsed, sources: rows, demo: false, fetchedAt: Date.now() };
  return payload;
}

/** Primary server data accessor for the news feed. */
export async function getNewsData(): Promise<NewsData> {
  if (!isSupabaseConfigured()) return demoNews();
  try {
    return await dbNews();
  } catch {
    return demoNews();
  }
}

/** Per-source statuses merged with the news list (for the WIRES drawer). */
export function sourceRowFor(src: Source, data: NewsData): SourceRow {
  return (
    data.sources.find((r) => r.id === src.id) ?? {
      id: src.id,
      name: src.name,
      short: src.short,
      color: src.color,
      status: 'off',
      count: 0,
    }
  );
}
