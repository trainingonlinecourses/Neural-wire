import type { Source } from './types';

/**
 * Built-in news wires. RSS + JSON community sources, all verified live.
 * Stored server-side and upserted into the `sources` table by the ingest
 * pipeline / seed migration. Every feed URL is reachable and returns XML.
 */
export const SOURCES: Source[] = [
  { id: 'openai', name: 'OpenAI', short: 'OAI', color: '#10a37f', grad: 'linear-gradient(135deg,#0e3f33,#071d18)', kind: 'rss', url: 'https://openai.com/news/rss.xml' },
  { id: 'googleai', name: 'Google AI', short: 'GAI', color: '#4285F4', grad: 'linear-gradient(135deg,#122a5e,#0a1630)', kind: 'rss', url: 'https://blog.google/technology/ai/rss/' },
  { id: 'deepmind', name: 'Google DeepMind', short: 'GDM', color: '#7c6cf0', grad: 'linear-gradient(135deg,#2b2160,#120e30)', kind: 'rss', url: 'https://deepmind.google/blog/rss.xml' },
  { id: 'huggingface', name: 'Hugging Face', short: 'HF', color: '#ffd21e', grad: 'linear-gradient(135deg,#4d3f06,#211b02)', kind: 'rss', url: 'https://huggingface.co/blog/feed.xml' },
  { id: 'mistral', name: 'Mistral AI', short: 'MIS', color: '#ff7000', grad: 'linear-gradient(135deg,#4a2500,#1f0f00)', kind: 'rss', url: 'https://mistral.ai/news/rss/' },
  { id: 'apple', name: 'Apple ML Research', short: 'APL', color: '#a1a1aa', grad: 'linear-gradient(135deg,#2d2d35,#101014)', kind: 'rss', url: 'https://machinelearning.apple.com/rss.xml' },
  { id: 'bair', name: 'BAIR', short: 'BAI', color: '#f5c518', grad: 'linear-gradient(135deg,#4a3d05,#201a02)', kind: 'rss', url: 'https://bair.berkeley.edu/blog/feed.xml' },
  { id: 'mitnews', name: 'MIT News AI', short: 'MITN', color: '#ff5a36', grad: 'linear-gradient(135deg,#4a1a0d,#200b04)', kind: 'rss', url: 'https://news.mit.edu/rss/topic/artificial-intelligence2' },
  { id: 'googleresearch', name: 'Google Research', short: 'GR', color: '#34a853', grad: 'linear-gradient(135deg,#0e3a22,#051d10)', kind: 'rss', url: 'https://research.google/blog/rss/' },
  { id: 'spectrum', name: 'IEEE Spectrum AI', short: 'SP', color: '#38bdf8', grad: 'linear-gradient(135deg,#0c3a55,#061c2a)', kind: 'rss', url: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss' },
  { id: 'microsoft', name: 'Microsoft AI', short: 'MS', color: '#38bdf8', grad: 'linear-gradient(135deg,#0c3a55,#061c2a)', kind: 'rss', url: 'https://www.microsoft.com/en-us/ai/blog/feed/' },
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
  { id: 'gradient', name: 'The Gradient', short: 'GRD', color: '#6ee7b7', grad: 'linear-gradient(135deg,#0d3a2c,#051a12)', kind: 'rss', url: 'https://thegradient.pub/rss/' },
  { id: 'simonw', name: 'Simon Willison', short: 'SW', color: '#fbbf24', grad: 'linear-gradient(135deg,#45330a,#1e1503)', kind: 'rss', url: 'https://simonwillison.net/atom/everything/' },
  { id: 'oneusefulthing', name: 'One Useful Thing', short: 'OUT', color: '#fb7185', grad: 'linear-gradient(135deg,#43222a,#1d0c10)', kind: 'rss', url: 'https://www.oneusefulthing.org/feed' },
  { id: 'importai', name: 'Import AI', short: 'IAI', color: '#a78bfa', grad: 'linear-gradient(135deg,#2e2154,#130c26)', kind: 'rss', url: 'https://importai.substack.com/feed' },
  { id: 'lillog', name: "Lil'Log", short: 'LL', color: '#f472b6', grad: 'linear-gradient(135deg,#431f34,#1d0b16)', kind: 'rss', url: 'https://lilianweng.github.io/index.xml' },
  { id: 'arxiv', name: 'arXiv cs.AI', short: 'AXV', color: '#b91c1c', grad: 'linear-gradient(135deg,#3f0d0d,#1a0404)', kind: 'rss', url: 'https://export.arxiv.org/rss/cs.AI' },
  { id: 'kaggle', name: 'Kaggle Blog', short: 'KGL', color: '#20beff', grad: 'linear-gradient(135deg,#0c3a52,#051a25)', kind: 'rss', url: 'https://medium.com/feed/kaggle-blog' },
  { id: 'latent', name: 'Latent Space', short: 'LT', color: '#818cf8', grad: 'linear-gradient(135deg,#23205e,#0f0d2b)', kind: 'rss', url: 'https://www.latent.space/feed' },
  { id: 'mlmastery', name: 'ML Mastery', short: 'MLM', color: '#f97316', grad: 'linear-gradient(135deg,#4a2405,#201002)', kind: 'rss', url: 'https://machinelearningmastery.com/feed/' },
  { id: 'kdnuggets', name: 'KDnuggets', short: 'KDN', color: '#f8e71c', grad: 'linear-gradient(135deg,#4a4306,#211c02)', kind: 'rss', url: 'https://www.kdnuggets.com/feed' },
  { id: 'chiphuyen', name: 'Chip Huyen', short: 'CH', color: '#5eead4', grad: 'linear-gradient(135deg,#12443c,#071c18)', kind: 'rss', url: 'https://huyenchip.com/feed.xml' },
  { id: 'raschka', name: 'Ahead of AI', short: 'AAI', color: '#f472b6', grad: 'linear-gradient(135deg,#43204a,#1d0b21)', kind: 'rss', url: 'https://magazine.sebastianraschka.com/feed' },
  { id: 'sequence', name: 'The Sequence', short: 'SEQ', color: '#4ade80', grad: 'linear-gradient(135deg,#0f3d23,#051a0d)', kind: 'rss', url: 'https://thesequence.substack.com/feed' },
  { id: 'interconnects', name: 'Interconnects', short: 'INT', color: '#a78bfa', grad: 'linear-gradient(135deg,#2e1f5e,#130c28)', kind: 'rss', url: 'https://www.interconnects.ai/feed' },
  { id: 'decoder', name: 'The Decoder', short: 'DEC', color: '#60a5fa', grad: 'linear-gradient(135deg,#122c55,#071229)', kind: 'rss', url: 'https://the-decoder.com/feed/' },
  { id: 'techmeme', name: 'Techmeme', short: 'TM', color: '#e2e8f0', grad: 'linear-gradient(135deg,#2d3442,#12151d)', kind: 'rss', url: 'https://techmeme.com/feed.xml' },
  { id: 'uniteai', name: 'Unite AI', short: 'UAI', color: '#22c55e', grad: 'linear-gradient(135deg,#0e3a1f,#051a0c)', kind: 'rss', url: 'https://www.unite.ai/feed/' },
  { id: 'marktechpost', name: 'MarkTechPost', short: 'MTP', color: '#fb923c', grad: 'linear-gradient(135deg,#452708,#1d0f03)', kind: 'rss', url: 'https://www.marktechpost.com/feed/' },
  { id: 'snorkel', name: 'Snorkel', short: 'SNK', color: '#7dd3fc', grad: 'linear-gradient(135deg,#123d55,#071a26)', kind: 'rss', url: 'https://snorkel.ai/feed/' },
  { id: 'infoq', name: 'InfoQ AI/ML', short: 'IQ', color: '#2874a6', grad: 'linear-gradient(135deg,#123550,#071a28)', kind: 'rss', url: 'https://feed.infoq.com/ai-ml-data-eng' },
  { id: 'wired', name: 'Wired AI', short: 'WRD', color: '#ffffff', grad: 'linear-gradient(135deg,#2d2d35,#101014)', kind: 'rss', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
  { id: 'lastweekinai', name: 'Last Week in AI', short: 'LWAI', color: '#6366f1', grad: 'linear-gradient(135deg,#1e1b4b,#0c0a24)', kind: 'rss', url: 'https://lastweekin.ai/feed' },
  { id: 'semianalysis', name: 'SemiAnalysis', short: 'SA', color: '#eab308', grad: 'linear-gradient(135deg,#422006,#1a0c02)', kind: 'rss', url: 'https://www.semianalysis.com/feed' },
  { id: 'aiweekly', name: 'AI Weekly', short: 'AWK', color: '#14b8a6', grad: 'linear-gradient(135deg,#134e4a,#062422)', kind: 'rss', url: 'https://aiweekly.co/feed' },
  { id: 'allenai', name: 'Allen AI', short: 'AI2', color: '#f59e0b', grad: 'linear-gradient(135deg,#451a03,#1c0a01)', kind: 'rss', url: 'https://allenai.org/rss.xml' },
  { id: 'synced', name: 'Synced', short: 'SYN', color: '#0ea5e9', grad: 'linear-gradient(135deg,#0c4a6e,#052035)', kind: 'rss', url: 'https://syncedreview.com/feed' },
  { id: 'pytorch', name: 'PyTorch', short: 'PT', color: '#ee4c2c', grad: 'linear-gradient(135deg,#4a1508,#1f0803)', kind: 'rss', url: 'https://pytorch.org/blog/feed.xml' },
  { id: 'bloomberg', name: 'Bloomberg Tech', short: 'BBG', color: '#2800d7', grad: 'linear-gradient(135deg,#150855,#08032a)', kind: 'rss', url: 'https://feeds.bloomberg.com/technology/news.rss' },
  { id: 'ftai', name: 'Financial Times AI', short: 'FT', color: '#fff1e5', grad: 'linear-gradient(135deg,#4a3020,#1f140c)', kind: 'rss', url: 'https://www.ft.com/artificial-intelligence?format=rss' },
  // ── Frontier model labs & research ──────────────────────────────────
  { id: 'anthropic', name: 'Anthropic', short: 'ANT', color: '#d4a574', grad: 'linear-gradient(135deg,#3d2b1a,#1a110a)', kind: 'rss', url: 'https://www.anthropic.com/rss.xml' },
  { id: 'openai-blog', name: 'OpenAI Blog', short: 'OAI-B', color: '#10a37f', grad: 'linear-gradient(135deg,#0e3f33,#071d18)', kind: 'rss', url: 'https://openai.com/blog/rss.xml' },
  { id: 'metaai', name: 'Meta AI', short: 'META', color: '#0668E1', grad: 'linear-gradient(135deg,#0a2a5e,#051530)', kind: 'rss', url: 'https://ai.meta.com/blog/rss/' },
  { id: 'cohere', name: 'Cohere', short: 'COH', color: '#39594D', grad: 'linear-gradient(135deg,#1a2e24,#0d1712)', kind: 'rss', url: 'https://cohere.com/blog/rss.xml' },
  { id: 'stability', name: 'Stability AI', short: 'STB', color: '#a855f7', grad: 'linear-gradient(135deg,#2e1560,#140a30)', kind: 'rss', url: 'https://stability.ai/news/rss.xml' },
  // ── Open-source model aggregators ───────────────────────────────────
  { id: 'paperswithcode', name: 'Papers With Code', short: 'PWC', color: '#21ba45', grad: 'linear-gradient(135deg,#0d3a1a,#061d0d)', kind: 'rss', url: 'https://paperswithcode.com/latest.rss' },
  { id: 'yannic', name: 'Yannic Kilcher', short: 'YK', color: '#ef4444', grad: 'linear-gradient(135deg,#4a1515,#1f0808)', kind: 'rss', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew' },
  { id: 'airesearch', name: 'AI Research Digest', short: 'ARD', color: '#6366f1', grad: 'linear-gradient(135deg,#1e1b4b,#0c0a24)', kind: 'rss', url: 'https://buttondown.com/ainews/rss' },
  { id: 'themodelvillage', name: 'The Model Village', short: 'TMV', color: '#f59e0b', grad: 'linear-gradient(135deg,#451a03,#1c0a01)', kind: 'rss', url: 'https://buttondown.com/the-model-village/rss' },
  // ── Chinese AI ecosystem ────────────────────────────────────────────
  { id: 'cohere-blog', name: 'Cohere Blog', short: 'COH', color: '#39594D', grad: 'linear-gradient(135deg,#1a2e24,#0d1712)', kind: 'rss', url: 'https://cohere.com/blog/rss' },
  // ── AI safety & alignment ───────────────────────────────────────────
  { id: 'alignmentforum', name: 'Alignment Forum', short: 'AF', color: '#f97316', grad: 'linear-gradient(135deg,#4a2000,#1f0d00)', kind: 'rss', url: 'https://www.alignmentforum.org/feed.xml' },
  { id: 'lesswrong', name: 'LessWrong', short: 'LW', color: '#dc2626', grad: 'linear-gradient(135deg,#4a1010,#1f0505)', kind: 'rss', url: 'https://www.lesswrong.com/feed.xml?feedType=recentCurated' },
  // ── AI video/image generation ───────────────────────────────────────
  { id: 'arxiv-cs-lg', name: 'arXiv cs.LG', short: 'AXV-L', color: '#dc2626', grad: 'linear-gradient(135deg,#3f0d0d,#1a0404)', kind: 'rss', url: 'https://export.arxiv.org/rss/cs.LG' },
  { id: 'arxiv-cs-cl', name: 'arXiv cs.CL', short: 'AXV-C', color: '#b91c1c', grad: 'linear-gradient(135deg,#3f0d0d,#1a0404)', kind: 'rss', url: 'https://export.arxiv.org/rss/cs.CL' },
];

export const srcById: Record<string, Source> = {};
for (const s of SOURCES) srcById[s.id] = s;
