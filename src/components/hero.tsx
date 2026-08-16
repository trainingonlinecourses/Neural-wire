'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/**
 * Front-door hero for the newsroom — replaces the generic page header on the
 * home page only. Big headline, a live stat-card strip, and the main journeys
 * (brief, trending, radar) sitting directly above the wire ticker.
 */

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(target);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      // ease-out cubic
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function Hero({
  stories,
  sources,
  models,
}: {
  stories: number;
  sources: number;
  models: number;
}) {
  const storiesShown = useCountUp(stories);
  const sourcesShown = useCountUp(sources);
  const modelsShown = useCountUp(models);

  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-eyebrow">
          <span className="hero-dot" />
          LIVE WIRE — {sources} SOURCES · REFRESHES EVERY 3 MIN
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
          <Link className="btn ghost" href="/radar">
            OPEN RADAR
          </Link>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <b>{storiesShown.toLocaleString()}</b>
            <span>stories live</span>
          </div>
          <div className="stat">
            <b>{sourcesShown}</b>
            <span>curated sources</span>
          </div>
          <div className="stat">
            <b>{modelsShown}</b>
            <span>model releases</span>
          </div>
          <div className="stat">
            <b>3m</b>
            <span>auto-refresh</span>
          </div>
        </div>
        <a className="hero-scroll" href="#wire" aria-label="Scroll to the live wire">
          <span className="hero-scroll-arrow" /> THE WIRE
        </a>
      </div>
    </section>
  );
}
