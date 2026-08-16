import Link from 'next/link';
import { SOURCES } from '@/lib/sources';

const FOOT_COLS: { h: string; links: [string, string][] }[] = [
  {
    h: 'The desk',
    links: [
      ['/', 'Newsroom'],
      ['/brief', 'Today in AI'],
      ['/trending', 'Trending'],
      ['/model-watch', 'Model Watch'],
      ['/leaderboard', 'Leaderboard'],
    ],
  },
  {
    h: 'Live data',
    links: [
      ['/github', 'GitHub Trending'],
      ['/huggingface', 'HF Hub'],
      ['/pulse', 'AI Pulse'],
      ['/glossary', 'Glossary'],
    ],
  },
  {
    h: 'Account',
    links: [
      ['/watchlist', 'Watchlist'],
      ['/saved', 'Saved'],
      ['/login', 'Sign in'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <Link className="brand" href="/">
            <div className="mark">⚡</div>
            <div>
              <h1>
                NEURAL<em>WIRE</em>
              </h1>
              <div className="tag">REAL-TIME AI INTELLIGENCE DESK</div>
            </div>
          </Link>
          <p>
            Curated AI intelligence from {SOURCES.length} sources — news, models, benchmarks and live pulse
            signals, all on one desk. No cookies, no tracking.
          </p>
        </div>
        {FOOT_COLS.map((col) => (
          <div key={col.h}>
            <h4>{col.h}</h4>
            <ul>
              {col.links.map(([href, label]) => (
                <li key={href + label}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="wrap about-desk">
        <div>
          <h4>DATA SOURCES</h4>
          <p>
            Stories stream live from {SOURCES.length} public feeds — official lab blogs (OpenAI, Google
            DeepMind, Google Research, Microsoft, NVIDIA, AWS, Anthropic-adjacent analysts like The
            Gradient and Simon Willison), press (TechCrunch, The Verge, MIT Tech Review, Ars Technica,
            IEEE Spectrum), research (arXiv cs.AI, Lil'Log) and community wires (Hacker News, DEV,
            Lobsters, Import AI) — plus the GitHub Trending API, the Hugging Face Hub API and the desk's
            own AI Pulse signals. Everything is public data, linked back to its origin.
          </p>
        </div>
        <div>
          <h4>REFRESH CADENCE</h4>
          <p>
            The newsroom re-syncs in place every 3 minutes with a visible countdown — no page reloads.
            Trending re-fetches on your chosen 1 / 3 / 5 / 10-minute interval, and every ranking row is
            computed over the last 24 hours of data.
          </p>
        </div>
        <div>
          <h4>HOW SCORES ARE COMPUTED</h4>
          <p>
            Heat is a 0–100 position within a row&apos;s own source; the global percentile ranks every row on
            one cross-category scale; climb chips are real GitHub stars gained in the last 24h; benchmarks
            are official model-card numbers with per-row source links. Every term self-defines on hover.
          </p>
          <Link className="about-link" href="/glossary">
            FULL GLOSSARY ↗
          </Link>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <span className="mono">neuralwire · v2.2</span>
        <span className="mono dim">Data pulled live · refreshed continuously</span>
      </div>
    </footer>
  );
}
