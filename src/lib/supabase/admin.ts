import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client for trusted server work only (cron ingest, moderation).
 * Bypasses RLS. Never expose to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
