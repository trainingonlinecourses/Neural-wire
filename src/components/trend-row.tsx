import type { TrendingKind, TrendingRow } from '@/lib/trending';

export const KIND_LABEL: Record<TrendingKind, string> = { gh: '🔥 GH', hf: '🤗 HF', radar: '🌍 RADAR' };

/** One ranked row — rank badge, source tag, name, tags, metric and heat bar. */
export function TrendRow({ row, rank }: { row: TrendingRow; rank: number }) {
  const inner = (
    <>
      <div className={'trend-rank' + (rank <= 3 ? ' top' : '')}>{rank}</div>
      <div className="trend-main">
        <span className={'trend-kind ' + row.kind}>{KIND_LABEL[row.kind]}</span>
        <span className="trend-name">{row.name}</span>
        {row.tags &&
          row.tags.length > 0 &&
          row.tags.map((t) => (
            <span className="gh-topic" key={t}>
              {t}
            </span>
          ))}
        <span className="trend-sub">{row.sub}</span>
      </div>
      <div className="trend-meta">
        <span className="trend-metric">{row.metric}</span>
        <div className="trend-heat">
          <i style={{ width: row.heat + '%' }} />
        </div>
        <div className="trend-pcts">
          <span className="trend-pct">{row.heat}% in-source</span>
          <span className="trend-pct global">{row.global}% overall</span>
        </div>
      </div>
    </>
  );
  return row.href ? (
    <a className="trend-row" href={row.href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <div className="trend-row">{inner}</div>
  );
}
