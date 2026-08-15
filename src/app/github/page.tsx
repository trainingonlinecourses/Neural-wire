import { GitHubView } from '@/components/github-view';
import { PageHead } from '@/components/page-head';

export const metadata = { title: 'GitHub Trending — NEURALWIRE' };

export default function GitHubPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🔥 GitHub API"
          title="GITHUB TRENDING"
          desc="AI repositories ranked live — rising, top, and new, straight from the GitHub API."
          index="06"
        />
      </div>
      <GitHubView />
    </section>
  );
}
