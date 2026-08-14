import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Nav } from '@/components/nav';
import { Shortcuts } from '@/components/shortcuts';
import { SignOutButton } from '@/components/sign-out-button';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'NEURALWIRE — Real-Time AI Intelligence Desk',
  description:
    'Live AI newsroom, model watch, benchmark leaderboard, GitHub trending, HuggingFace hub and a global AI radar — all in one desk.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  } catch {
    // Supabase not configured — demo mode.
  }

  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="wrap hd">
            <Link className="brand" href="/">
              <div className="mark">⚡</div>
              <div>
                <h1>
                  NEURAL<em>WIRE</em>
                </h1>
                <div className="tag">REAL-TIME AI INTELLIGENCE DESK</div>
              </div>
            </Link>
            <div className="hd-right">
              <div className="live-pill">
                <span className="dot" />
                LIVE
              </div>
              {email ? (
                <SignOutButton email={email} />
              ) : (
                <a className="btn" href="/login">
                  SIGN IN
                </a>
              )}
            </div>
          </div>
          <div className="wrap">
            <Nav />
          </div>
        </header>
        <main>{children}</main>
        <Shortcuts />
        <footer className="foot">
          <div className="wrap">
            <span>
              ⚡ NEURAL<em>WIRE</em> — intelligence desk. Data pulled live from 15 sources · no cookies, no tracking.
            </span>
            <span className="dim">neuralwire · v2.0</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
