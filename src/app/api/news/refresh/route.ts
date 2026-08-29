import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';
import { isSupabaseConfigured, createAdminClient } from '@/lib/supabase/admin';
import { fetchAllSources } from '@/lib/feeds';
import { normBatch } from '@/lib/normalize';
import { SOURCES } from '@/lib/sources';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Server-side in-memory timestamp of last live RSS refresh.
 * Prevents hammering feeds — minimum 5 minutes between refreshes.
 */
let lastLiveRefresh = 0;
const MIN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Live refresh endpoint — GET /api/news/refresh
 * 
 * When Supabase is configured:
 *   1. Checks if stories are stale (>5 min since last refresh)
 *   2. If stale: fetches live RSS from ALL sources in parallel
 *   3. Upserts fresh stories into Supabase
 *   4. Returns the merged dataset
 *   
 * When no Supabase (demo mode):
 *   Falls through to getNewsData() which live-fetches feeds.
 */
export async function GET() {
  const now = Date.now();
  const shouldRefresh = now - lastLiveRefresh > MIN_REFRESH_INTERVAL;

  // In DB mode, try to do a live refresh if enough time has passed
  if (isSupabaseConfigured() && shouldRefresh) {
    try {
      lastLiveRefresh = now; // Set immediately to prevent concurrent refreshes
      
      // Fetch live RSS from ALL sources in parallel
      const map = await fetchAllSources([]);
      const supabase = createAdminClient();
      
      let upsertedCount = 0;
      // Process in batches of 50 sources to avoid overwhelming the DB
      for (let i = 0; i < SOURCES.length; i += 50) {
        const batch = SOURCES.slice(i, i + 50);
        const rows: Array<Record<string, unknown>> = [];
        
        for (const src of batch) {
          const items = map.get(src.id) || [];
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
      }
      
      // Update source timestamps
      await supabase
        .from('sources')
        .update({ last_fetched_at: new Date().toISOString() })
        .in('id', SOURCES.map((s) => s.id));
      
      // Now read the updated data from DB
      const data = await getNewsData();
      return NextResponse.json({
        stories: data.stories.map((s) => ({ ...s, date: s.date.toISOString() })),
        sources: data.sources,
        demo: false,
        fetchedAt: data.fetchedAt,
        liveRefreshed: true,
        upserted: upsertedCount,
      });
    } catch (e) {
      // Live refresh failed — fall through to DB read
      lastLiveRefresh = now - MIN_REFRESH_INTERVAL + 60_000; // Allow retry in 1 min
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
