-- Seed built-in sources + benchmarks. Idempotent (ON CONFLICT DO NOTHING).

insert into public.sources (id, name, short, color, grad, kind, url) values
  ('openai', 'OpenAI', 'OAI', '#10a37f', 'linear-gradient(135deg,#0e3f33,#071d18)', 'rss', 'https://openai.com/news/rss.xml'),
  ('googleai', 'Google AI', 'GAI', '#4285F4', 'linear-gradient(135deg,#122a5e,#0a1630)', 'rss', 'https://blog.google/technology/ai/rss/'),
  ('deepmind', 'Google DeepMind', 'GDM', '#7c6cf0', 'linear-gradient(135deg,#2b2160,#120e30)', 'rss', 'https://deepmind.google/blog/rss.xml'),
  ('huggingface', 'Hugging Face', 'HF', '#ffd21e', 'linear-gradient(135deg,#4d3f06,#211b02)', 'rss', 'https://huggingface.co/blog/feed.xml'),
  ('microsoft', 'Microsoft AI', 'MS', '#38bdf8', 'linear-gradient(135deg,#0c3a55,#061c2a)', 'rss', 'https://blogs.microsoft.com/ai/feed/'),
  ('nvidia', 'NVIDIA', 'NV', '#76b900', 'linear-gradient(135deg,#25400a,#0f1c03)', 'rss', 'https://blogs.nvidia.com/feed/'),
  ('awsml', 'AWS ML', 'AWS', '#ff9900', 'linear-gradient(135deg,#4a2f06,#201402)', 'rss', 'https://aws.amazon.com/blogs/machine-learning/feed/'),
  ('techcrunch', 'TechCrunch AI', 'TC', '#22c55e', 'linear-gradient(135deg,#0d3a1e,#051a0c)', 'rss', 'https://techcrunch.com/category/artificial-intelligence/feed/'),
  ('venturebeat', 'VentureBeat AI', 'VB', '#f97316', 'linear-gradient(135deg,#472306,#1e0e02)', 'rss', 'https://venturebeat.com/category/ai/feed/'),
  ('verge', 'The Verge AI', 'VRG', '#c084fc', 'linear-gradient(135deg,#3a1d5e,#180a2b)', 'rss', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml'),
  ('mittr', 'MIT Tech Review', 'MIT', '#ef4444', 'linear-gradient(135deg,#4a1010,#1f0505)', 'rss', 'https://www.technologyreview.com/topic/artificial-intelligence/feed'),
  ('arstechnica', 'Ars Technica AI', 'ARS', '#fb923c', 'linear-gradient(135deg,#452508,#1d0f03)', 'rss', 'https://arstechnica.com/ai/feed/'),
  ('hn', 'Hacker News', 'HN', '#ff6600', 'linear-gradient(135deg,#4a2000,#1f0d00)', 'hn', null),
  ('devto', 'DEV Community', 'DEV', '#08090a', 'linear-gradient(135deg,#1c2740,#0a0f1c)', 'devto', null),
  ('lobsters', 'Lobsters AI', 'LOB', '#ac130d', 'linear-gradient(135deg,#3d0a07,#1a0302)', 'lobsters', null),
  ('googleresearch', 'Google Research', 'GR', '#34a853', 'linear-gradient(135deg,#0e3a22,#051d10)', 'rss', 'https://research.google/blog/rss/'),
  ('spectrum', 'IEEE Spectrum AI', 'SP', '#38bdf8', 'linear-gradient(135deg,#0c3a55,#061c2a)', 'rss', 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss'),
  ('mistral', 'Mistral AI', 'MIS', '#ff7000', 'linear-gradient(135deg,#4a2500,#1f0f00)', 'rss', 'https://mistral.ai/news/rss/'),
  ('apple', 'Apple ML Research', 'APL', '#a1a1aa', 'linear-gradient(135deg,#2d2d35,#101014)', 'rss', 'https://machinelearning.apple.com/rss.xml'),
  ('bair', 'BAIR', 'BAI', '#f5c518', 'linear-gradient(135deg,#4a3d05,#201a02)', 'rss', 'https://bair.berkeley.edu/blog/feed.xml'),
  ('mitnews', 'MIT News AI', 'MITN', '#ff5a36', 'linear-gradient(135deg,#4a1a0d,#200b04)', 'rss', 'https://news.mit.edu/rss/topic/artificial-intelligence2')
on conflict (id) do nothing;

insert into public.benchmarks (id, name, unit, higher_is_better) values
  ('swe-bench-verified', 'SWE-bench Verified', '%', true),
  ('swe-bench', 'SWE-bench', '%', true),
  ('terminal-bench', 'Terminal-Bench', '%', true),
  ('mmlu-pro', 'MMLU-Pro', '%', true),
  ('mmlu', 'MMLU', '%', true),
  ('gpqa-diamond', 'GPQA Diamond', '%', true),
  ('gpqa', 'GPQA', '%', true),
  ('humaneval', 'HumanEval', '%', true),
  ('aime', 'AIME', '%', true),
  ('math', 'MATH', '%', true),
  ('gsm8k', 'GSM8K', '%', true),
  ('arena-elo', 'Arena Elo', 'elo', true),
  ('livebench', 'LiveBench', '%', true),
  ('hellaswag', 'HellaSwag', '%', true),
  ('winogrande', 'WinoGrande', '%', true),
  ('imagenet', 'ImageNet', '%', true),
  ('gaia', 'GAIA', '%', true),
  ('webarena', 'WebArena', '%', true),
  ('bigbench', 'BigBench', '%', true),
  ('arc-agi', 'ARC-AGI', '%', true)
on conflict (id) do nothing;
