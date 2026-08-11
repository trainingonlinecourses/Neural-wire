import { NextResponse } from 'next/server';
import { tryClient } from '@/lib/supabase/server';
import { entityDef } from '@/lib/extract/entities';

export const runtime = 'nodejs';

/** GET /api/watchlist — current user's followed entities + recent story timelines. */
export async function GET() {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ follows: [], demo: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: follows } = await supabase
    .from('watchlist')
    .select('entity_id, created_at, entities(name, kind)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const out = [];
  for (const f of follows || []) {
    const entityId = f.entity_id as string;
    const { data: items } = await supabase
      .from('story_entities')
      .select('stories(id, title, link, published_at, thumbnail, source_id)')
      .eq('entity_id', entityId)
      .order('stories(published_at)', { ascending: false })
      .limit(15);
    out.push({
      entity: f.entities,
      stories: (items || []).map((i: Record<string, unknown>) => (i.stories as Record<string, unknown>)) as never,
    });
  }
  return NextResponse.json({ follows: out });
}

/** POST /api/watchlist {entity_name} — follow an entity (upserts it if in the dictionary). */
export async function POST(req: Request) {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { entity_name } = (await req.json()) as { entity_name?: string };
  if (!entity_name) return NextResponse.json({ error: 'entity_name required' }, { status: 400 });

  const def = entityDef(entity_name);
  if (!def) return NextResponse.json({ error: 'unknown entity' }, { status: 404 });

  // Ensure the canonical entity row exists.
  const { data: existing } = await supabase
    .from('entities')
    .select('id')
    .eq('name', def.name)
    .maybeSingle();
  let entityId = existing?.id as string | undefined;
  if (!entityId) {
    const { data: created } = await supabase
      .from('entities')
      .insert({ name: def.name, kind: def.kind, aliases: def.aliases })
      .select('id')
      .single();
    entityId = created?.id as string | undefined;
  }
  if (!entityId) return NextResponse.json({ error: 'could not resolve entity' }, { status: 500 });

  const { error } = await supabase
    .from('watchlist')
    .upsert({ user_id: user.id, entity_id: entityId }, { onConflict: 'user_id,entity_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, entity_name: def.name });
}

/** DELETE /api/watchlist {entity_name} — unfollow. */
export async function DELETE(req: Request) {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { entity_name } = (await req.json()) as { entity_name?: string };
  if (!entity_name) return NextResponse.json({ error: 'entity_name required' }, { status: 400 });
  const def = entityDef(entity_name);
  if (!def) return NextResponse.json({ error: 'unknown entity' }, { status: 404 });

  const { data: ent } = await supabase.from('entities').select('id').eq('name', def.name).maybeSingle();
  if (!ent) return NextResponse.json({ ok: true });

  await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('entity_id', ent.id as string);
  return NextResponse.json({ ok: true });
}
