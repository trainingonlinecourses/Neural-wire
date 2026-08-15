import { SavedView } from '@/components/saved-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Saved — NEURALWIRE' };

export default function SavedPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="💾 Collections"
          title="SAVED COLLECTIONS"
          desc="Your story collections, synced per account across devices."
          index="10"
        />
      </div>
      <SavedView />
    </section>
  );
}
