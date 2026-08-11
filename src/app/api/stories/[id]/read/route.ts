import { NextResponse } from 'next/server';
import { tryClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** POST /api/stories/[id]/read — mark a story read for the current user. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('read_state')
    .upsert({ user_id: user.id, story_id: id, read_at: new Date().toISOString() }, { onConflict: 'user_id,story_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/stories/[id]/read — mark unread. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await supabase.from('read_state').delete().eq('user_id', user.id).eq('story_id', id);
  return NextResponse.json({ ok: true });
}
