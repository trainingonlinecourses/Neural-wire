import type { Metadata } from 'next';
import Link from 'next/link';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/nav';
import { Shortcuts } from '@/components/shortcuts';
import { DeskButton } from '@/components/desk-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { SignOutButton } from '@/components/sign-out-button';
import { Footer } from '@/components/footer';
import { createClient } from '@/lib/supabase/server';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://neural-wire-nine.vercel.app'),
  title: 'NEURALWIRE — Real-Time AI Intelligence Desk',
  description:
    'Live AI newsroom, model watch, benchmark leaderboard, GitHub trending, HuggingFace hub and a global AI radar — all in one desk.',
  keywords: [
    'AI news',
    'machine learning',
    'LLM benchmarks',
    'HuggingFace trending',
    'GitHub trending',
    'AI radar',
    'model watch',
  ],
  applicationName: 'NEURALWIRE',
  openGraph: {
    type: 'website',
    siteName: 'NEURALWIRE',
    title: 'NEURALWIRE — Real-Time AI Intelligence Desk',
    description: 'News · models · benchmarks · radar — one live desk. No reloads, no noise.',
  },
  twitter: {
    card: 'summary',
    title: 'NEURALWIRE — Real-Time AI Intelligence Desk',
    description: 'News · models · benchmarks · radar — one live desk. No reloads, no noise.',
  },
  robots: { index: true, follow: true },
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
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('nw-theme');var t=(s==='light'||s==='dark')?s:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
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
              <DeskButton />
              <ThemeToggle />
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
        <Footer />
      </body>
    </html>
  );
}
