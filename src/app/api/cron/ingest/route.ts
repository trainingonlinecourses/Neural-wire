import { NextResponse } from 'next/server';
import { SOURCES } from '@/lib/sources';
import { fetchAllSources } from '@/lib/feeds';
import { buildIngestPayload } from '@/lib/ingest';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header =
    req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return header === secret;
}

/**
 * Vercel Cron → /api/cron/ingest
 * Fetches all wires server-side, normalizes, upserts stories/entities/benchmarks.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });
  }

  const supabase = createAdminClient();
  const map = await fetchAllSources([]);

  // Keep the sources table in sync with the app config.
  await supabase.from('sources').upsert(
    SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      short: s.short,
      color: s.color,
      grad: s.grad,
      kind: s.kind,
      url: s.url,
      enabled: true,
    })),
    { onConflict: 'id' }
  );

  const payload = buildIngestPayload(map);

  if (payload.stories.length) {
    const { error: storyErr } = await supabase
      .from('stories')
      .upsert(payload.stories, { onConflict: 'id' });
    if (storyErr) return NextResponse.json({ error: 'stories: ' + storyErr.message }, { status: 500 });
  }

  // Entities: upsert canonical rows, then resolve names → ids.
  if (payload.entities.length) {
    await supabase.from('entities').upsert(payload.entities, { onConflict: 'name' });
  }
  const names = payload.storyEntities.map((e) => e.entity_name);
  const { data: entityRows } = await supabase
    .from('entities')
    .select('id,name')
    .in('name', [...new Set(names)]);
  const entityIdByName = new Map<string, string>();
  for (const r of entityRows || []) entityIdByName.set(r.name as string, r.id as string);

  // Story ↔ entity links.
  const links = payload.storyEntities
    .map((e) => ({ story_id: e.story_id, entity_id: entityIdByName.get(e.entity_name) }))
    .filter((l): l is { story_id: string; entity_id: string } => !!l.entity_id);
  if (links.length) {
    await supabase.from('story_entities').upsert(links, { onConflict: 'story_id,entity_id' });
  }

  // Benchmark scores (dedupe within batch first).
  const seen = new Set<string>();
  const scores = payload.benchRows
    .map((b) => ({ ...b, model_entity_id: entityIdByName.get(b.model) }))
    .filter((b): b is typeof b & { model_entity_id: string } => !!b.model_entity_id)
    .filter((b) => {
      const k = `${b.model_entity_id}|${b.benchmark_id}|${b.story_id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map(({ model, story_id, ...rest }) => ({ ...rest, source_story_id: story_id }));
  if (scores.length) {
    await supabase
      .from('benchmark_scores')
      .upsert(scores, { onConflict: 'model_entity_id,benchmark_id,source_story_id' });
  }

  const now = new Date().toISOString();
  await supabase.from('sources').update({ last_fetched_at: now }).in('id', SOURCES.map((s) => s.id));

  return NextResponse.json({
    ok: true,
    stories: payload.stories.length,
    entities: payload.entities.length,
    storyLinks: links.length,
    benchmarks: scores.length,
    at: now,
  });
}
