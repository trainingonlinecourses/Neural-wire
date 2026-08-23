import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://neural-wire-nine.vercel.app';
  const pages = [
    '',
    '/brief',
    '/trending',
    '/model-watch',
    '/leaderboard',
    '/github',
    '/huggingface',
    '/pulse',
    '/glossary',
    '/papers',
    '/graph',
    '/sentiment',
    '/capability-matrix',
    '/timeline',
    '/breakthrough',
    '/feed-health',
    '/compare',
    '/watchlist',
    '/saved',
    '/events',
  ];
  return pages.map((p) => ({
    url: base + p,
    lastModified: new Date(),
    changeFrequency: p === '' || p === '/brief' || p === '/trending' ? ('hourly' as const) : ('daily' as const),
    priority: p === '' ? 1 : 0.8,
  }));
}
