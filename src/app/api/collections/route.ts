import { NextResponse } from 'next/server';
import { tryClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** GET /api/collections — current user's collections with item counts. */
export async function GET() {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ collections: [], demo: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('collections')
    .select('id, name, description, is_public, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return NextResponse.json({ collections: data || [] });
}

/** POST /api/collections {name, description?} — create a collection. */
export async function POST(req: Request) {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { name, description } = (await req.json()) as { name?: string; description?: string };
  if (!name || !name.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: user.id, name: name.trim(), description: description?.trim() || null })
    .select('id, name, is_public, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: data });
}
