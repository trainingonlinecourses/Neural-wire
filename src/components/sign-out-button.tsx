'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton({ email }: { email: string }) {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }
  return (
    <button className="btn danger" onClick={signOut} title={email}>
      SIGNOUT
    </button>
  );
}
