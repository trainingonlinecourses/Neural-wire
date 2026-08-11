import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Server (RSC / route handler) Supabase client bound to the request cookies. */
export async function createClient() {
  const cookieStore = await cookies();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }


  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore when middleware refreshes sessions.
          }
        },
      },
    }
  );
}

/** Same as createClient but returns null in demo mode instead of throwing. */
export async function tryClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    return await createClient();
  } catch {
    return null;
  }
}
