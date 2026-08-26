import { NextResponse } from 'next/server';
import { tryClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** GET /api/alerts — current user's alerts. */
export async function GET() {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ alerts: [], demo: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('alerts')
    .select('id, name, keywords, entities, topics, active, last_triggered_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ alerts: data || [] });
}

/** POST /api/alerts {name, keywords?, entities?, topics?} */
export async function POST(req: Request) {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    keywords?: string[];
    entities?: string[];
    topics?: string[];
  };
  const name = (body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const keywords = (body.keywords || []).filter((w) => (w || '').trim());
  const entities = (body.entities || []).filter((w) => (w || '').trim());
  const topics = (body.topics || []).filter((w) => (w || '').trim());

  const { data, error } = await supabase
    .from('alerts')
    .insert({ user_id: user.id, name, keywords, entities, topics, active: true })
    .select('id, name, keywords, entities, topics, active, last_triggered_at, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data });
}

/** PATCH /api/alerts {id, name?, keywords?, entities?, topics?, active?} */
export async function PATCH(req: Request) {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json()) as {
    id?: string;
    name?: string;
    keywords?: string[];
    entities?: string[];
    topics?: string[];
    active?: boolean;
  };

  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.name === 'string') updates.name = body.name.trim() || 'Untitled alert';
  if (Array.isArray(body.keywords)) updates.keywords = body.keywords.filter((w) => (w || '').trim());
  if (Array.isArray(body.entities)) updates.entities = body.entities.filter((w) => (w || '').trim());
  if (Array.isArray(body.topics)) updates.topics = body.topics.filter((w) => (w || '').trim());
  if (typeof body.active === 'boolean') updates.active = body.active;

  const { data, error } = await supabase
    .from('alerts')
    .update(updates)
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select('id, name, keywords, entities, topics, active, last_triggered_at, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data });
}
