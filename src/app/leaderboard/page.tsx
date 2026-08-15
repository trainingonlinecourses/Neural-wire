import { LeaderboardView } from '@/components/leaderboard-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Model Leaderboard — NEURALWIRE' };

export default function LeaderboardPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🏆 Benchmarks"
          title="MODEL LEADERBOARD"
          desc="Benchmark scores extracted live from the wire — one sortable table."
          index="05"
        />
      </div>
      <LeaderboardView />
    </section>
  );
}
