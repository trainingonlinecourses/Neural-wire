-- Fix dead Microsoft AI RSS (blogs.microsoft.com returns HTTP 410) and add 10 verified live wires.

update public.sources
set url = 'https://www.microsoft.com/en-us/ai/blog/feed/'
where id = 'microsoft';

insert into public.sources (id, name, short, color, grad, kind, url) values
  ('infoq', 'InfoQ AI/ML', 'IQ', '#2874a6', 'linear-gradient(135deg,#123550,#071a28)', 'rss', 'https://feed.infoq.com/ai-ml-data-eng'),
  ('wired', 'Wired AI', 'WRD', '#ffffff', 'linear-gradient(135deg,#2d2d35,#101014)', 'rss', 'https://www.wired.com/feed/tag/ai/latest/rss'),
  ('lastweekinai', 'Last Week in AI', 'LWAI', '#6366f1', 'linear-gradient(135deg,#1e1b4b,#0c0a24)', 'rss', 'https://lastweekin.ai/feed'),
  ('semianalysis', 'SemiAnalysis', 'SA', '#eab308', 'linear-gradient(135deg,#422006,#1a0c02)', 'rss', 'https://www.semianalysis.com/feed'),
  ('aiweekly', 'AI Weekly', 'AWK', '#14b8a6', 'linear-gradient(135deg,#134e4a,#062422)', 'rss', 'https://aiweekly.co/feed'),
  ('allenai', 'Allen AI', 'AI2', '#f59e0b', 'linear-gradient(135deg,#451a03,#1c0a01)', 'rss', 'https://allenai.org/rss.xml'),
  ('synced', 'Synced', 'SYN', '#0ea5e9', 'linear-gradient(135deg,#0c4a6e,#052035)', 'rss', 'https://syncedreview.com/feed'),
  ('pytorch', 'PyTorch', 'PT', '#ee4c2c', 'linear-gradient(135deg,#4a1508,#1f0803)', 'rss', 'https://pytorch.org/blog/feed.xml'),
  ('bloomberg', 'Bloomberg Tech', 'BBG', '#2800d7', 'linear-gradient(135deg,#150855,#08032a)', 'rss', 'https://feeds.bloomberg.com/technology/news.rss'),
  ('ftai', 'Financial Times AI', 'FT', '#fff1e5', 'linear-gradient(135deg,#4a3020,#1f140c)', 'rss', 'https://www.ft.com/artificial-intelligence?format=rss')
on conflict (id) do nothing;
