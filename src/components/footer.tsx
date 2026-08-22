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
      ['/graph', 'Story Graph'],
      ['/feed-health', 'Feed Health'],
    ],
  },
  {
    h: 'Explore',
    links: [
      ['/papers', 'Papers'],
      ['/capability-matrix', 'Model Matrix'],
      ['/sentiment', 'Sentiment'],
      ['/breakthrough', 'Breakthrough Alerts'],
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
            Real-time AI intelligence from {SOURCES.length} curated sources. News, models, benchmarks and live signals — one desk, no noise.
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
      <div className="wrap foot-bottom">
        <span className="mono">neuralwire · v2.2</span>
        <span className="mono dim">Data pulled live · refreshed continuously</span>
      </div>
    </footer>
  );
}
