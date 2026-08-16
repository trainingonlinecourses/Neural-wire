import { PulseView } from '@/components/pulse-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'AI Pulse — NEURALWIRE' };

export default function PulsePage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="⚡ Live desk signals"
          title="AI PULSE"
          desc="Velocity, model buzz, story heat and feed health — six signals derived from the current wire, recomputed every 3 minutes."
          index="08"
        />
      </div>
      <PulseView />
    </section>
  );
}
