import Link from 'next/link';

/**
 * Front-door hero for the newsroom — replaces the generic page header on the
 * home page only. Shows live desk stats and the two main journeys (brief,
 * trending) above the wire.
 */
export function Hero({ stories, sources }: { stories: number; sources: number }) {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-eyebrow">
          <span className="hero-dot" />
          LIVE — {sources} SOURCES · REFRESHED EVERY 3 MIN
        </div>
        <h1 className="hero-title">
          The AI wire, <em>live.</em>
        </h1>
        <p className="hero-sub">
          News · models · benchmarks · radar — one desk, one ranking, refreshed in place. No reloads, no noise.
        </p>
        <div className="hero-cta">
          <Link className="btn primary" href="/brief">
            READ THE BRIEF ↗
          </Link>
          <Link className="btn" href="/trending">
            VIEW TRENDING ↗
          </Link>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <b>{stories.toLocaleString()}</b> stories live
          </div>
          <div className="stat">
            <b>{sources}</b> curated sources
          </div>
          <div className="stat">
            <b>24h</b> brief window
          </div>
          <div className="stat">
            <b>3m</b> auto-refresh
          </div>
        </div>
      </div>
    </section>
  );
}
