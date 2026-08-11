import { LeaderboardView } from '@/components/leaderboard-view';

export const metadata = { title: 'Model Leaderboard — NEURALWIRE' };

export default function LeaderboardPage() {
  return (
    <section className="page">
      <div className="wrap">
        <div className="page-head">
          <h2>
            🏆 MODEL LEADERBOARD <span className="mini">benchmark scores extracted live from the wire</span>
          </h2>
        </div>
      </div>
      <LeaderboardView />
    </section>
  );
}
