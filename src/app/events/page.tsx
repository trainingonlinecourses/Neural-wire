import type { Metadata } from 'next';
import { PageHead } from '@/components/page-head';
import { EventsView } from '@/components/events-view';

export const metadata: Metadata = {
  title: 'AI Event Calendar — NeuralWire',
  description: 'Upcoming AI conferences, paper deadlines, product launches, and community events',
};

export default function EventsPage() {
  return (
    <section className="page">
      <PageHead
        kicker="📅 AI EVENTS"
        title="Event Calendar"
        desc="Conferences, paper deadlines, product launches, and community events across the AI ecosystem."
      />
      <EventsView />
    </section>
  );
}
