import { srcById } from '@/lib/sources';
import type { Story } from '@/lib/types';
import { tickerStories } from '@/lib/ticker';

/**
 * Live headline ticker — a seamless marquee of the newest stories.
 * Pauses on hover; the duplicate set makes the loop seamless and is
 * hidden from assistive tech.
 */
export function HeadlineTicker({ stories, limit = 10 }: { stories: Story[]; limit?: number }) {
  const items = tickerStories(stories, limit);
  if (items.length === 0) return null;

  const duration = Math.max(24, items.length * 7);

  return (
    <div className="ticker" role="region" aria-label="Live headlines">
      <span className="ticker-label">
        <span className="dot" />
        LIVE
      </span>
      <div className="ticker-viewport">
        <div className="ticker-track" style={{ animationDuration: `${duration}s` }}>
          {[0, 1].map((copy) => (
            <div className="ticker-set" key={copy} aria-hidden={copy === 1}>
              {items.map((s) => {
                const src = srcById[s.sourceId];
                return (
                  <a
                    key={copy + ':' + s.id}
                    className="ticker-item"
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="ticker-src" style={{ color: src?.color || 'var(--cyan-ink)' }}>
                      {src?.short || s.sourceId}
                    </span>
                    <span className="ticker-title">{s.title}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
