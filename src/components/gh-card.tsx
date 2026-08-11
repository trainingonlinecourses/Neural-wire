import { langColor } from '@/lib/lang';
import { ago, daysOld, fmtStars } from '@/lib/utils';

export interface GhRepo {
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner?: { login: string };
}

export function GhCard({ r, rank }: { r: GhRepo; rank?: number }) {
  const age = daysOld(r.created_at);
  return (
    <article className="gh-card">
      {rank && (
        <span className="badge" style={{ position: 'static', background: 'linear-gradient(135deg,#22d3ee,#67e8f9)', marginRight: 'auto' }}>
          #{rank} {age <= 14 ? 'NEW' : 'HOT'}
        </span>
      )}
      <div className="gh-top">
        {rank && <div className="gh-rank">{rank}</div>}
        <div>
          <div className="gh-name">{r.name}</div>
          <div className="gh-owner">
            {r.owner?.login || ''} · updated {ago(r.updated_at)}
          </div>
        </div>
      </div>
      <p className="gh-desc">{r.description || 'No description provided.'}</p>
      {r.topics && r.topics.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {r.topics.slice(0, 5).map((t) => (
            <span className="gh-topic" key={t}>
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="gh-meta">
        {r.language && (
          <span className="lang">
            <span className="ldot" style={{ background: langColor(r.language) }} />
            {r.language}
          </span>
        )}
        <span>★ {fmtStars(r.stargazers_count)}</span>
        <span>⑂ {fmtStars(r.forks_count)}</span>
        <a className="open" style={{ marginLeft: 'auto', color: 'var(--cyan)', fontWeight: 600 }} href={r.html_url} target="_blank" rel="noopener noreferrer">
          REPO ↗
        </a>
      </div>
    </article>
  );
}
