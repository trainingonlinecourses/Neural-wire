import { ago, fmtStars } from '@/lib/utils';

export interface HfItem {
  id: string;
  likes: number;
  downloads: number | null;
  pipe: string;
  lib: string;
  sdk: string;
  score: number | null;
  created: number;
}

export function HfCard({ m, isModel }: { m: HfItem; isModel: boolean }) {
  const org = m.id.indexOf('/') >= 0 ? m.id.split('/')[0] : m.id;
  return (
    <article className="hf-card">
      <div className="hf-top">
        <div className="hf-ava">{org.slice(0, 2).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <a className="hf-id" href={'https://huggingface.co/' + m.id} target="_blank" rel="noopener noreferrer">
            {m.id}
          </a>
          <div className="gh-owner" style={{ marginTop: 2 }}>
            created {ago(new Date(m.created))}
            {m.score != null ? ' · trend ' + Math.round(m.score) : ''}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {m.pipe && <span className="hf-badge pipe">{m.pipe}</span>}
        {isModel && m.lib && <span className="hf-badge">{m.lib}</span>}
        {!isModel && m.sdk && <span className="hf-badge">{m.sdk}</span>}
      </div>
      <div className="hf-meta">
        <span>❤ {fmtStars(m.likes)}</span>
        {isModel && m.downloads != null && <span>⇣ {fmtStars(m.downloads)}</span>}
        <a className="open" style={{ marginLeft: 'auto', color: 'var(--gold-ink)', fontWeight: 600 }} href={'https://huggingface.co/' + m.id} target="_blank" rel="noopener noreferrer">
          OPEN ↗
        </a>
      </div>
    </article>
  );
}
