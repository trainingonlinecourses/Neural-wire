import { NextResponse } from 'next/server';
import { tryClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** GET /api/notes?story_id=… — current user's notes on a story. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const storyId = url.searchParams.get('story_id');
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ notes: [], demo: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let q = supabase.from('story_notes').select('id, story_id, body, created_at').eq('user_id', user.id);
  if (storyId) q = q.eq('story_id', storyId);
  const { data } = await q.order('created_at', { ascending: false });
  return NextResponse.json({ notes: data || [] });
}

/** POST /api/notes {story_id, body} — create/update a note. */
export async function POST(req: Request) {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { story_id, body } = (await req.json()) as { story_id?: string; body?: string };
  if (!story_id || !body?.trim()) return NextResponse.json({ error: 'story_id and body required' }, { status: 400 });

  const { data, error } = await supabase
    .from('story_notes')
    .insert({ user_id: user.id, story_id, body: body.trim() })
    .select('id, story_id, body, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}

/** DELETE /api/notes {id} — delete a note. */
export async function DELETE(req: Request) {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await supabase.from('story_notes').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
