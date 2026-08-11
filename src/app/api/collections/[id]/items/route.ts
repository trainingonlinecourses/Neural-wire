import { NextResponse } from 'next/server';
import { tryClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** GET /api/collections/[id]/items — stories saved in a collection (joined with stories). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ items: [], demo: true });

  const { data: items } = await supabase
    .from('collection_items')
    .select('stories(id, title, link, description, thumbnail, published_at, source_id, models, topics, is_model)')
    .eq('collection_id', id)
    .order('position', { ascending: false });
  const out = (items || []).map((i: Record<string, unknown>) => i.stories as Record<string, unknown>);
  return NextResponse.json({ items: out });
}

/** POST /api/collections/[id]/items {story_id} — save a story into a collection. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { story_id } = (await req.json()) as { story_id?: string };
  if (!story_id) return NextResponse.json({ error: 'story_id required' }, { status: 400 });

  const { data: position } = await supabase
    .from('collection_items')
    .select('position')
    .eq('collection_id', id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from('collection_items')
    .upsert(
      { collection_id: id, story_id, position: ((position?.position as number) ?? 0) + 1 },
      { onConflict: 'collection_id,story_id' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/collections/[id]/items {story_id} — remove from collection. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { story_id } = (await req.json()) as { story_id?: string };
  if (!story_id) return NextResponse.json({ error: 'story_id required' }, { status: 400 });

  await supabase.from('collection_items').delete().eq('collection_id', id).eq('story_id', story_id);
  return NextResponse.json({ ok: true });
}
