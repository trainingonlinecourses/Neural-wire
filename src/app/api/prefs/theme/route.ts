import { NextResponse } from 'next/server';
import { tryClient } from '@/lib/supabase/server';
import { parseMode, withThemePref } from '@/lib/theme';

export const runtime = 'nodejs';

/** GET /api/prefs/theme — the signed-in user's stored theme, or null for guests/demo. */
export async function GET() {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ theme: null });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ theme: null });

  const { data } = await supabase
    .from('user_prefs')
    .select('prefs')
    .eq('user_id', user.id)
    .maybeSingle();
  return NextResponse.json({ theme: parseMode((data?.prefs as Record<string, unknown> | null)?.theme) });
}

/** PUT /api/prefs/theme {theme} — persist the signed-in user's theme across devices. */
export async function PUT(req: Request) {
  const supabase = await tryClient();
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json()) as { theme?: unknown };
  const theme = parseMode(body.theme);
  if (!theme) return NextResponse.json({ error: 'theme mode required' }, { status: 400 });

  const { data: existing } = await supabase
    .from('user_prefs')
    .select('prefs')
    .eq('user_id', user.id)
    .maybeSingle();
  const prefs = withThemePref((existing?.prefs as Record<string, unknown> | null) || {}, theme);

  const { error } = await supabase
    .from('user_prefs')
    .upsert({ user_id: user.id, prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, theme });
}
