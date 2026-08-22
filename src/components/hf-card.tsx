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
  tags?: string[];
}

const PIPE_COLORS: Record<string, string> = {
  'text-generation': '#3b82f6',
  'text2text-generation': '#8b5cf6',
  'fill-mask': '#06b6d4',
  'question-answering': '#22c55e',
  'summarization': '#f59e0b',
  'translation': '#ec4899',
  'text-classification': '#ef4444',
  'token-classification': '#f97316',
  'object-detection': '#a855f7',
  'image-classification': '#14b8a6',
  'image-to-text': '#6366f1',
  'text-to-image': '#d946ef',
  'text-to-video': '#e11d48',
  'zero-shot-classification': '#0891b2',
  'conversational': '#2563eb',
  'automatic-speech-recognition': '#7c3aed',
};

export function HfCard({ m, isModel }: { m: HfItem; isModel: boolean }) {
  const org = m.id.indexOf('/') >= 0 ? m.id.split('/')[0] : m.id;
  const name = m.id.indexOf('/') >= 0 ? m.id.split('/').slice(1).join('/') : m.id;
  const pipeColor = PIPE_COLORS[m.pipe] || '#6b7280';

  return (
    <article className="hf-card">
      <div className="hf-top">
        <div className="hf-ava" style={{ background: pipeColor + '20', color: pipeColor, borderColor: pipeColor }}>
          {org.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <a className="hf-id" href={'https://huggingface.co/' + m.id} target="_blank" rel="noopener noreferrer">
            {name}
          </a>
          <div className="gh-owner" style={{ marginTop: 2 }}>
            {org} · created {ago(new Date(m.created))}
          </div>
        </div>
        {m.score != null && (
          <span className="hf-trend" title="Trending score">
            🔥 {Math.round(m.score)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {m.pipe && (
          <span className="hf-badge pipe" style={{ background: pipeColor + '20', color: pipeColor, borderColor: pipeColor }}>
            {m.pipe}
          </span>
        )}
        {isModel && m.lib && <span className="hf-badge">{m.lib}</span>}
        {!isModel && m.sdk && <span className="hf-badge">{m.sdk}</span>}
      </div>
      <div className="hf-meta">
        <span title="Likes">❤ {fmtStars(m.likes)}</span>
        {isModel && m.downloads != null && <span title="Downloads">⇣ {fmtStars(m.downloads)}</span>}
        <a
          className="open"
          style={{ marginLeft: 'auto', color: 'var(--gold-ink)', fontWeight: 600 }}
          href={'https://huggingface.co/' + m.id}
          target="_blank"
          rel="noopener noreferrer"
        >
          OPEN ↗
        </a>
      </div>
    </article>
  );
}
