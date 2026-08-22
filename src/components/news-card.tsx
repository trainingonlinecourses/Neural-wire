'use client';

import { srcById } from '@/lib/sources';
import type { Story } from '@/lib/types';
import { ago } from '@/lib/utils';
import { storyStats } from '@/lib/story-meta';
import { CopyLink } from './copy-link';
import { SafeImage } from './safe-image';
import { CoverageChip } from './coverage-chip';

export function NewsCard({
  story,
  coverage = [],
  isNew = false,
  onDismiss,
  onRead,
}: {
  story: Story;
  coverage?: Story[];
  isNew?: boolean;
  /** Hide this story (persisted by the caller). */
  onDismiss?: () => void;
  /** Record that the user opened this story. */
  onRead?: () => void;
}) {
  const s = srcById[story.sourceId];
  const stats = storyStats(story);
  const open = (e: React.MouseEvent) => {
    onRead?.();
  };
  return (
    <article className={'card' + (isNew ? ' new-card' : '')}>
      <div className="card-accent" style={{ background: s?.color || '#4f7cff' }} aria-hidden="true" />
      {isNew && <span className="news-new">NEW</span>}
      {onDismiss && (
        <button
          className="card-x"
          onClick={(e) => {
            e.preventDefault();
            onDismiss();
          }}
          title="Hide this story"
          aria-label={'Hide story: ' + story.title}
        >
          ✕
        </button>
      )}
      <div
        className="thumb"
        data-short={s?.short || 'NW'}
        style={{
          background: s?.grad || 'var(--thumb)',
          ['--src' as string]: s?.color || '#4f7cff',
        }}
      >
        <span className="badge" style={{ background: s?.color || '#4f7cff' }}>
          {(s?.name || story.sourceId).toUpperCase()}
        </span>
        {story.isModel && <span className="mtag">MODEL</span>}
        {story.img && <SafeImage src={story.img} />}
      </div>
      <div className="card-body">
        <h3>
          <a href={story.link} target="_blank" rel="noopener noreferrer" onClick={open}>
            {story.title}
          </a>
        </h3>
        {story.description && <p className="snippet">{story.description}</p>}
        {stats.benchmarks.length > 0 && (
          <div className="models-row">
            {stats.benchmarks.map((b) => (
              <span className="bench-pill" key={b.label} title={b.title}>
                {b.label}
              </span>
            ))}
          </div>
        )}
        {story.models.length > 0 && (
          <div className="models-row">
            {story.models.slice(0, 4).map((m) => (
              <span className="model-pill" key={m}>
                {m}
              </span>
            ))}
          </div>
        )}
        {story.topics.length > 0 && (
          <div className="models-row">
            {story.topics.slice(0, 2).map((t) => (
              <span className="topic-pill" key={t}>
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="card-meta">
          <span className="sig time">⏱ {ago(story.date)}</span>
          <span className="sig read" title="Estimated reading time">
            ☕ {stats.readMinutes} min read
          </span>
          {stats.pointsLabel && (
            <span className="sig points" title="Points / score">
              ▲ {stats.pointsLabel}
            </span>
          )}
          {stats.commentsLabel && (
            <span className="sig comments" title="Comments">
              💬 {stats.commentsLabel}
            </span>
          )}
          <CopyLink href={story.link} />
          <button
            className="card-save"
            onClick={(e) => {
              e.preventDefault();
              try {
                const raw = window.localStorage.getItem('nw_quick_save');
                const list: Array<{ id: string; title: string; link: string; at: number }> = raw ? JSON.parse(raw) : [];
                if (!list.some((x) => x.id === story.id)) {
                  list.unshift({ id: story.id, title: story.title, link: story.link, at: Date.now() });
                  window.localStorage.setItem('nw_quick_save', JSON.stringify(list.slice(0, 50)));
                }
              } catch { /* storage unavailable */ }
            }}
            title="Quick save"
          >
            💾 SAVE
          </button>
          {stats.hasDiscussion && story.discussion && (
            <a className="open" href={story.discussion} target="_blank" rel="noopener noreferrer">
              DISCUSS ↗
            </a>
          )}
          <a className="open" href={story.link} target="_blank" rel="noopener noreferrer" onClick={open}>
            READ ↗
          </a>
        </div>
        <CoverageChip members={coverage} />
      </div>
    </article>
  );
}
