import { GitHubView } from '@/components/github-view';

export const metadata = { title: 'GitHub Trending — NEURALWIRE' };

export default function GitHubPage() {
  return (
    <section className="page">
      <div className="wrap">
        <div className="page-head">
          <h2>
            🔥 GITHUB TRENDING <span className="mini">AI repos, ranked live from the GitHub API</span>
          </h2>
        </div>
      </div>
      <GitHubView />
    </section>
  );
}
