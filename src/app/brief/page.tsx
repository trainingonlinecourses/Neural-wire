import { buildBrief } from '@/lib/brief';
import { getNewsData } from '@/lib/data';
import { srcById } from '@/lib/sources';
import { NewsCard } from '@/components/news-card';
import { Movers } from '@/components/movers';
import { PageHead } from '@/components/page-head';
import { ago } from '@/lib/utils';
import { rosterByNewest, vendorFlag } from '@/lib/benchmarks';

export const revalidate = 180;

export const metadata = { title: 'Today in AI — NEURALWIRE' };

export default async function BriefPage() {
  const data = await getNewsData();
  const brief = buildBrief(data.stories, 1);

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="⚡ Daily digest"
          title="TODAY IN AI"
          desc="The last 24h of the wire, distilled into topics, movers and fresh stories."
          index="02"
        />
      </div>

      <div className="wrap">
        <div className="stats">
          <div className="stat">
            <b>{brief.total}</b> stories · 24h
          </div>
          <div className="stat">
            <b>{brief.topics.length}</b> hot topics
          </div>
          <div className="stat">
            <b>{brief.models.length}</b> models mentioned
          </div>
          <div className="stat">
            <b>{brief.sources.length}</b> sources active
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="section-note">Newest flagships on the leaderboard</div>
        <div className="chips">
          {rosterByNewest()
            .slice(0, 8)
            .map((m) => (
              <a className="chip roster-chip" href={m.source} target="_blank" rel="noopener noreferrer" key={m.model}>
                <span aria-hidden="true">{vendorFlag(m.vendor)}</span> {m.model} · {m.released}
              </a>
            ))}
        </div>
        <p className="dim brief-roster-note">
          Official release-date order — every score links to the vendor&apos;s model card. Full table on the{' '}
          <a className="open" href="/leaderboard">leaderboard ↗</a>.
        </p>
      </div>

      <div className="wrap">
        <div className="section-note">Hot topics in the last 24h</div>
        {brief.topics.length === 0 ? (
          <p className="empty">
            Not enough recent stories yet — the wire needs a fresh sync.
          </p>
        ) : (
          <div className="brief-topics">
            {brief.topics.map((t) => (
              <div className="brief-topic" key={t.name}>
                <span className="chip on">{t.name} · {t.count}</span>
                <ul>
                  {t.sample.map((s) => (
                    <li key={s.id}>
                      <a href={s.link} target="_blank" rel="noopener noreferrer">
                        {s.title}
                      </a>
                      <span className="dim">
                        {' '}— {ago(s.date)} · {srcById[s.sourceId]?.short ?? s.sourceId}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="wrap">
        <div className="section-note">Most-mentioned models</div>
        <div className="chips">
          {brief.models.map((m) => (
            <span className="chip" key={m.name}>
              {m.name} · {m.count}
            </span>
          ))}
          {brief.models.length === 0 && (
            <span className="dim">No model mentions in the last 24h.</span>
          )}
        </div>
      </div>

      <Movers />

      <div className="wrap">
        <div className="section-note">Newest stories</div>
        <div className="grid">
          {brief.hot.map((s) => (
            <NewsCard key={s.id} story={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
