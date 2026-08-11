import { NextResponse } from 'next/server';
import { fetchSource } from '@/lib/feeds';
import { normBatch } from '@/lib/normalize';
import { srcById } from '@/lib/sources';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/feeds/[id] — fetch one wire now, persist, return story count.
 * Used by on-demand "refresh this wire" actions.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const src = srcById[id];
  if (!src) return NextResponse.json({ error: 'unknown source' }, { status: 404 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  try {
    const raws = await fetchSource(id);
    const batch = normBatch(raws, src);
    const supabase = createAdminClient();
    const rows = batch.map((s) => ({
      id: s.id,
      source_id: id,
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
    }));
    await supabase.from('stories').upsert(rows, { onConflict: 'id' });
    await supabase.from('sources').update({ last_fetched_at: new Date().toISOString() }).eq('id', id);
    return NextResponse.json({ ok: true, source: id, stories: rows.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
