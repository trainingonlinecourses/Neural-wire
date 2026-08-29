import { ProviderDirectoryView } from '@/components/provider-directory-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'Providers — NEURALWIRE' };

export default function ProvidersPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🏢 Provider Directory"
          title="PROVIDERS"
          desc="Every AI provider, lab, and platform in one place — frontier labs, open-source, infrastructure, and research."
          index="23"
        />
      </div>
      <ProviderDirectoryView />
    </section>
  );
}
