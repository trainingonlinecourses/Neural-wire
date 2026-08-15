import { deltaText } from '@/lib/trending';
import type { TrendingKind, TrendingRow } from '@/lib/trending';
import { TermTip } from './term-tip';

export const KIND_LABEL: Record<TrendingKind, string> = { gh: '🔥 GH', hf: '🤗 HF', radar: '🌍 RADAR' };

/** One ranked row — rank badge, source tag, name, tags, metric and heat bar. */
export function TrendRow({ row, rank, isNew = false }: { row: TrendingRow; rank: number; isNew?: boolean }) {
  const delta = row.delta ? deltaText(row.delta) : null;
  const inner = (
    <>
      <div className={'trend-rank' + (rank <= 3 ? ' top' : '')}>{rank}</div>
      <div className="trend-main">
        <span className={'trend-kind ' + row.kind}>{KIND_LABEL[row.kind]}</span>
        {isNew && <span className="trend-new">NEW</span>}
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
        {delta && (
          <TermTip entryId={row.delta?.score != null ? 'trending-score' : 'star-delta'} align="end">
            <span className={'trend-delta' + (row.delta?.score != null ? ' hf' : '')}>{delta}</span>
          </TermTip>
        )}
        <div className="trend-heat">
          <i style={{ width: row.heat + '%' }} />
        </div>
        <div className="trend-pcts">
          <TermTip entryId="heat" align="end">
            <span className="trend-pct">{row.heat}% in-source</span>
          </TermTip>
          <TermTip entryId="global-percentile" align="end">
            <span className="trend-pct global">{row.global}% overall</span>
          </TermTip>
        </div>
      </div>
    </>
  );
  return row.href ? (
    <a className={'trend-row' + (isNew ? ' new-row' : '')} href={row.href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <div className={'trend-row' + (isNew ? ' new-row' : '')}>{inner}</div>
  );
}
