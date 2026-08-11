'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setMsg('Magic link sent — check your inbox.');
        setBusy(false);
        return;
      }
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Account created — check your email to confirm, then sign in.');
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <main className="wrap" style={{ maxWidth: 420, marginTop: '12vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1>
          NEURAL<em style={{ fontStyle: 'normal', color: 'var(--cyan)' }}>WIRE</em>
        </h1>
        <div className="tag" style={{ color: 'var(--mut)', letterSpacing: '.2em', fontSize: '.6rem' }}>
          REAL-TIME AI INTELLIGENCE DESK
        </div>
      </div>
      <div className="card" style={{ padding: 24, cursor: 'default' }}>
        <div className="seg" style={{ display: 'flex', marginBottom: 18 }}>
          {(['login', 'signup', 'magic'] as const).map((m) => (
            <button
              key={m}
              className={mode === m ? 'active' : ''}
              onClick={() => setMode(m)}
              style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '.08em' }}
            >
              {m === 'login' ? 'Sign in' : m === 'signup' ? 'Sign up' : 'Magic link'}
            </button>
          ))}
        </div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <input
            className="field"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode !== 'magic' && (
            <input
              className="field"
              type="password"
              required
              minLength={6}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          {err && (
            <div className="banner show" style={{ margin: 0 }}>
              <span>{err}</span>
            </div>
          )}
          {msg && <div style={{ color: 'var(--ok)', fontSize: '.8rem' }}>{msg}</div>}
          <button className="btn primary" disabled={busy} style={{ justifyContent: 'center' }}>
            {busy ? '…' : mode === 'magic' ? 'SEND MAGIC LINK' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: '.72rem', color: 'var(--mut)', textAlign: 'center' }}>
          Public news is browsable without an account. Watchlists, saved collections, notes &amp;
          leaderboard follows require sign-in.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
