import { NextResponse } from 'next/server';
import { fetchSource } from '@/lib/feeds';
import { normBatch } from '@/lib/normalize';
import { srcById } from '@/lib/sources';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

/* ---- Simple in-memory rate limiter: 5 req/min per IP per source ---- */
const rateLimit = new Map<string, number[]>();
function isRateLimited(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (rateLimit.get(key) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  rateLimit.set(key, hits);
  // Evict old entries periodically
  if (rateLimit.size > 5000) {
    for (const [k, v] of rateLimit) {
      if (v.length === 0 || now - v[v.length - 1] > windowMs * 2) rateLimit.delete(k);
    }
  }
  return hits.length > limit;
}

/**
 * POST /api/feeds/[id] — fetch one wire now, persist, return story count.
 * Used by on-demand "refresh this wire" actions.
 * Rate-limited: 5 requests per minute per IP per source.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const src = srcById[id];
  if (!src) return NextResponse.json({ error: 'unknown source' }, { status: 404 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  // Rate limit per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(`${ip}:${id}`)) {
    return NextResponse.json({ error: 'rate limited — try again in 1 minute' }, { status: 429 });
  }

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
