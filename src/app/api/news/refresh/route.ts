import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { isSupabaseConfigured, createAdminClient } from '@/lib/supabase/admin';
import { fetchSource } from '@/lib/feeds';
import { normBatch } from '@/lib/normalize';
import { SOURCES } from '@/lib/sources';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Rotating refresh: each call refreshes a different batch of sources.
 * Over 10 calls (~50 min), all sources are refreshed at least once.
 */
let refreshIndex = 0;
const BATCH_SIZE = 40; // sources per refresh cycle
const MIN_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes between refreshes
let lastLiveRefresh = 0;

/**
 * Live refresh endpoint — GET /api/news/refresh
 * 
 * Rotating refresh: each call fetches a different batch of ~40 sources,
 * so all 420 sources get refreshed over ~10 cycles (~30 min).
 * This keeps the function within Vercel's timeout limits.
 */
export async function GET() {
  const now = Date.now();
  const shouldRefresh = now - lastLiveRefresh > MIN_REFRESH_INTERVAL;

  if (isSupabaseConfigured() && shouldRefresh) {
    try {
      lastLiveRefresh = now;
      
      // Get the current batch of sources to refresh
      const start = refreshIndex % SOURCES.length;
      const batch = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        batch.push(SOURCES[(start + i) % SOURCES.length]);
      }
      refreshIndex += BATCH_SIZE;
      
      // Fetch this batch in parallel (fast — 40 sources)
      const results = await Promise.all(
        batch.map(async (src) => {
          try {
            const items = await fetchSource(src.id);
            return { src, items, error: null };
          } catch {
            return { src, items: [], error: 'fetch failed' };
          }
        })
      );
      
      const supabase = createAdminClient();
      let upsertedCount = 0;
      const rows: Array<Record<string, unknown>> = [];
      
      for (const { src, items } of results) {
        const normalized = normBatch(items, src);
        for (const s of normalized) {
          rows.push({
            id: s.id,
            source_id: src.id,
            title: s.title,
            link: s.link,
            description: s.description,
            thumbnail: s.img,
            points: s.points,
            comments: s.comments,
            discussion: s.discussion,
            models: s.models,
            topics: s.topics,
            entities: [],
            is_model: s.isModel,
            published_at: s.date.toISOString(),
          });
        }
      }
      
      if (rows.length) {
        const { error } = await supabase
          .from('stories')
          .upsert(rows, { onConflict: 'id' });
        if (!error) upsertedCount += rows.length;
      }
      
      // Update timestamps for refreshed sources
      const refreshedIds = batch.map((s) => s.id);
      await supabase
        .from('sources')
        .update({ last_fetched_at: new Date().toISOString() })
        .in('id', refreshedIds);
      
      // Read the updated data from DB
      const data = await getNewsData();
      return NextResponse.json({
        stories: data.stories.map((s) => ({ ...s, date: s.date.toISOString() })),
        sources: data.sources,
        demo: false,
        fetchedAt: data.fetchedAt,
        liveRefreshed: true,
        upserted: upsertedCount,
        batch: `${start}-${start + BATCH_SIZE}`,
        cycle: Math.floor(refreshIndex / SOURCES.length) + 1,
      });
    } catch {
      lastLiveRefresh = now - MIN_REFRESH_INTERVAL + 60_000;
    }
  }

  // Default: read from DB (fast path)
  const data = await getNewsData();
  return NextResponse.json({
    stories: data.stories.map((s) => ({ ...s, date: s.date.toISOString() })),
    sources: data.sources,
    demo: data.demo,
    fetchedAt: data.fetchedAt,
  });
}
