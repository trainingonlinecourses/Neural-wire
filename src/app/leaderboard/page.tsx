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
          desc="Genuine benchmark scores from official model cards — pick a benchmark, compare the flagships, verify the source."
          index="05"
        />
      </div>
      <LeaderboardView />
    </section>
  );
}
