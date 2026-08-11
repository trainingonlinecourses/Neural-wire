import type { Source } from './types';

/**
 * Built-in news wires. Ported verbatim from the original index.html `SOURCES`.
 * 12 RSS feeds + 3 JSON community sources. Stored server-side and upserted into
 * the `sources` table by the ingest pipeline / seed migration.
 */
export const SOURCES: Source[] = [
  { id: 'openai', name: 'OpenAI', short: 'OAI', color: '#10a37f', grad: 'linear-gradient(135deg,#0e3f33,#071d18)', kind: 'rss', url: 'https://openai.com/news/rss.xml' },
  { id: 'googleai', name: 'Google AI', short: 'GAI', color: '#4285F4', grad: 'linear-gradient(135deg,#122a5e,#0a1630)', kind: 'rss', url: 'https://blog.google/technology/ai/rss/' },
  { id: 'deepmind', name: 'Google DeepMind', short: 'GDM', color: '#7c6cf0', grad: 'linear-gradient(135deg,#2b2160,#120e30)', kind: 'rss', url: 'https://deepmind.google/blog/rss.xml' },
  { id: 'huggingface', name: 'Hugging Face', short: 'HF', color: '#ffd21e', grad: 'linear-gradient(135deg,#4d3f06,#211b02)', kind: 'rss', url: 'https://huggingface.co/blog/feed.xml' },
  { id: 'microsoft', name: 'Microsoft AI', short: 'MS', color: '#38bdf8', grad: 'linear-gradient(135deg,#0c3a55,#061c2a)', kind: 'rss', url: 'https://blogs.microsoft.com/ai/feed/' },
  { id: 'nvidia', name: 'NVIDIA', short: 'NV', color: '#76b900', grad: 'linear-gradient(135deg,#25400a,#0f1c03)', kind: 'rss', url: 'https://blogs.nvidia.com/feed/' },
  { id: 'awsml', name: 'AWS ML', short: 'AWS', color: '#ff9900', grad: 'linear-gradient(135deg,#4a2f06,#201402)', kind: 'rss', url: 'https://aws.amazon.com/blogs/machine-learning/feed/' },
  { id: 'techcrunch', name: 'TechCrunch AI', short: 'TC', color: '#22c55e', grad: 'linear-gradient(135deg,#0d3a1e,#051a0c)', kind: 'rss', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { id: 'venturebeat', name: 'VentureBeat AI', short: 'VB', color: '#f97316', grad: 'linear-gradient(135deg,#472306,#1e0e02)', kind: 'rss', url: 'https://venturebeat.com/category/ai/feed/' },
  { id: 'verge', name: 'The Verge AI', short: 'VRG', color: '#c084fc', grad: 'linear-gradient(135deg,#3a1d5e,#180a2b)', kind: 'rss', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { id: 'mittr', name: 'MIT Tech Review', short: 'MIT', color: '#ef4444', grad: 'linear-gradient(135deg,#4a1010,#1f0505)', kind: 'rss', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed' },
  { id: 'arstechnica', name: 'Ars Technica AI', short: 'ARS', color: '#fb923c', grad: 'linear-gradient(135deg,#452508,#1d0f03)', kind: 'rss', url: 'https://arstechnica.com/ai/feed/' },
  { id: 'hn', name: 'Hacker News', short: 'HN', color: '#ff6600', grad: 'linear-gradient(135deg,#4a2000,#1f0d00)', kind: 'hn', url: null },
  { id: 'devto', name: 'DEV Community', short: 'DEV', color: '#08090a', grad: 'linear-gradient(135deg,#1c2740,#0a0f1c)', kind: 'devto', url: null },
  { id: 'lobsters', name: 'Lobsters AI', short: 'LOB', color: '#ac130d', grad: 'linear-gradient(135deg,#3d0a07,#1a0302)', kind: 'lobsters', url: null },
];

export const srcById: Record<string, Source> = {};
for (const s of SOURCES) srcById[s.id] = s;
