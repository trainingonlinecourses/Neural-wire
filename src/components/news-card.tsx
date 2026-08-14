import { srcById } from '@/lib/sources';
import type { Story } from '@/lib/types';
import { ago } from '@/lib/utils';
import { CopyLink } from './copy-link';

export function NewsCard({ story }: { story: Story }) {
  const s = srcById[story.sourceId];
  return (
    <article className="card">
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
        {story.img && (
          <img
            loading="lazy"
            src={story.img}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>
      <div className="card-body">
        <h3>
          <a href={story.link} target="_blank" rel="noopener noreferrer">
            {story.title}
          </a>
        </h3>
        {story.description && <p className="snippet">{story.description}</p>}
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
          <span>⏱ {ago(story.date)}</span>
          <CopyLink href={story.link} />
          <a className="open" href={story.link} target="_blank" rel="noopener noreferrer">
            READ ↗
          </a>
        </div>
      </div>
    </article>
  );
}
