import { SavedView } from '@/components/saved-view';

export const metadata = { title: 'Saved — NEURALWIRE' };

export default function SavedPage() {
  return (
    <section className="page">
      <div className="wrap">
        <div className="page-head">
          <h2>
            💾 SAVED COLLECTIONS <span className="mini">your story collections, synced per account</span>
          </h2>
        </div>
      </div>
      <SavedView />
    </section>
  );
}
