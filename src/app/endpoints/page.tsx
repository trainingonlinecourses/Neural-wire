import { PageHead } from '@/components/page-head';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'API Endpoints — NEURALWIRE' };

interface EndpointDoc {
  method: string;
  path: string;
  auth: string;
  desc: string;
  /** Example response shape (JSON). */
  example?: string;
}

/** External upstream providers the desk pulls model registry data from. */
const UPSTREAMS: { name: string; url: string; key: string; note: string }[] = [
  {
    name: 'models.dev',
    url: 'https://models.dev/api.json',
    key: 'Not required',
    note: 'Keyless aggregated registry — 213 providers (OpenAI, Anthropic, Google, Meta, xAI, DeepSeek, Moonshot, MiniMax, Mistral, Qwen/Alibaba, Nvidia, Cohere, Amazon, Groq, togetherai…). Real release_date ISO stamps, open_weights flags, context limits and per-1M-token USD pricing. Powers /releases and /model-watch.',
  },
  {
    name: 'Hugging Face API',
    url: 'https://huggingface.co/api/trending',
    key: 'Not required',
    note: 'Trending open-weight repos with real downloads, likes, trendingScore and createdAt. Also used for model-card benchmark extraction (README.md per repo).',
  },
  {
    name: 'models.dev provider pages',
    url: 'https://models.dev/anthropic',
    key: 'Not required',
    note: 'Per-provider detail page used as the "OR ↗" reference link on release cards (pattern: https://models.dev/<providerId>).',
  },
];

const ENDPOINTS: { group: string; items: EndpointDoc[] }[] = [
  {
    group: 'Model registry (models.dev + Hugging Face)',
    items: [
      {
        method: 'GET',
        path: '/api/models/releases',
        auth: 'Public',
        desc: 'Fresh model launches from the last 30 days (windowDays: 30), grouped into LAST 24 HOURS / THIS WEEK / THIS MONTH date sections. 15-minute in-memory cache.',
        example:
          '{ "releases": [ { "id": "anthropic/claude-opus-5", "name": "Claude Opus 5", "vendor": "Anthropic", "releasedAt": 1785177600, "openSource": false, "costTier": "high", "context": 1000000, "pricePromptPerM": 5, "priceCompletionPerM": 25, "source": "https://models.dev/anthropic" } ], "sections": [ { "label": "THIS WEEK", "bucket": 1, "releases": [ "…" ] } ], "windowDays": 30, "fetchedAt": 1787000000000 }',
      },
      {
        method: 'GET',
        path: '/api/models/live',
        auth: 'Public',
        desc: 'Newest live models merged from models.dev releases + Hugging Face trending, newest first, with card-extracted official benchmarks on the top entries. 15-minute cache.',
        example:
          '{ "models": [ { "id": "moonshotai/Kimi-K3", "name": "Kimi K3", "vendor": "Moonshot", "created": 1787000000, "context": 256000, "pricing": { "prompt": 0.6, "completion": 2.5 }, "benchmarks": [ { "name": "Terminal Bench", "value": 88.3 } ] } ], "fetchedAt": 1787000000000 }',
      },
    ],
  },
  {
    group: 'News wires & ingestion',
    items: [
      { method: 'GET', path: '/api/cron/ingest', auth: 'CRON_SECRET header', desc: 'Hourly ingestion of all 15 wires (vercel.json schedule). Send the secret in the x-cron-secret header when calling manually. Upserts stories, entities and benchmark rows via the service-role client.' },
      { method: 'GET', path: '/api/feeds/[id]', auth: 'Public', desc: 'Per-wire fetch + normalize + upsert. id = source id from src/lib/sources.ts (e.g. "verge-ai").' },
      { method: 'GET', path: '/api/news', auth: 'Public (demo-safe)', desc: 'Normalized news feed used by the Newsroom explorer. Returns demo-mode live-fetch data when Supabase keys are absent.' },
      { method: 'GET', path: '/api/news/refresh', auth: 'Public (demo-safe)', desc: 'Force a re-fetch of all wires into the in-memory demo cache.' },
      { method: 'GET', path: '/api/feed', auth: 'Public', desc: 'RSS 2.0 output of the freshest stories — point any RSS reader at https://<your-deploy>/api/feed.' },
    ],
  },
];

const ANALYSIS_ITEMS: EndpointDoc[] = [
  { method: 'GET', path: '/api/leaderboard', auth: 'Public', desc: 'Unified benchmark leaderboard rows with official scores and model-card links.' },
  { method: 'GET', path: '/api/breakthrough', auth: 'Public', desc: 'Detected breakthrough events (record jumps, new frontier claims).' },
  { method: 'GET', path: '/api/capability-matrix', auth: 'Public', desc: 'Capability × model matrix rows for the Matrix page.' },
  { method: 'GET', path: '/api/pulse', auth: 'Public', desc: 'Aggregated activity pulse (wire volume, launch density).' },
  { method: 'GET', path: '/api/sentiment', auth: 'Public', desc: 'Momentum/sentiment rows for the Momentum page.' },
  { method: 'GET', path: '/api/story-graph', auth: 'Public', desc: 'Story-to-story graph edges for the Graph page.' },
  { method: 'GET', path: '/api/timeline', auth: 'Public', desc: 'Dated event timeline rows.' },
  { method: 'GET', path: '/api/github/trending', auth: 'Public', desc: 'GitHub trending AI repos.' },
  { method: 'GET', path: '/api/insights', auth: 'Public', desc: 'Computed insight cards.' },
  { method: 'GET', path: '/api/feed-health', auth: 'Public', desc: 'Per-wire freshness/health diagnostics.' },
];

const ACCOUNT_ITEMS: EndpointDoc[] = [
  { method: 'GET/POST/DELETE', path: '/api/watchlist', auth: 'Supabase session', desc: 'Per-account model watchlist rows. Demo-safe: returns empty when unauthenticated.' },
  { method: 'GET', path: '/api/watchlist/movers', auth: 'Supabase session', desc: 'Movers computed against the watchlist roster.' },
  { method: 'GET/POST/DELETE', path: '/api/collections', auth: 'Supabase session', desc: 'Saved-story collections; item rows under /api/collections/[id]/items.' },
  { method: 'GET/POST/DELETE', path: '/api/notes', auth: 'Supabase session', desc: 'Per-story notes.' },
  { method: 'GET/POST/DELETE', path: '/api/alerts', auth: 'Supabase session', desc: 'Custom alert rules evaluated on ingest.' },
  { method: 'POST', path: '/api/stories/[id]/read', auth: 'Supabase session', desc: 'Mark a story read/unread (read_state).' },
  { method: 'GET/POST', path: '/api/prefs/theme', auth: 'Supabase session', desc: 'Persisted theme preference (user_prefs).' },
];

const ENV_VARS: { key: string; required: string; note: string }[] = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', required: 'Required for DB mode', note: 'Supabase project URL. Without it (and the keys below) the site runs in DEMO_MODE — live-fetching feeds with a 3-minute cache, no persistence.' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: 'Required for DB mode', note: 'Anon key for browser + SSR clients (RLS applies).' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', required: 'Required for DB mode', note: 'Server-only service-role key used by src/lib/supabase/admin.ts to upsert ingested stories (bypasses RLS). Never expose to the browser.' },
  { key: 'CRON_SECRET', required: 'Required for hourly ingest', note: 'Shared secret for /api/cron/ingest. Send it in the x-cron-secret header when calling the endpoint manually.' },
];

function EndpointList({ items }: { items: EndpointDoc[] }) {
  return (
    <>
      {items.map((e) => (
        <div className="ep-card" key={e.path + e.method}>
          <div className="ep-card-head">
            <strong>
              <span className="ep-method">{e.method}</span> <code>{e.path}</code>
            </strong>
            <span className="ep-auth">{e.auth}</span>
          </div>
          <p className="ep-desc">{e.desc}</p>
          {e.example && <pre className="ep-example">{e.example}</pre>}
        </div>
      ))}
    </>
  );
}

export default function EndpointsPage() {
  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          kicker="🔌 API reference"
          title="ENDPOINTS & CONFIGURATION"
          desc="Every desk API endpoint, the external providers behind the model registry, and the environment variables needed to configure a deployment."
          index="18"
        />
      </div>
      <div className="wrap ep-wrap">
        <div className="ep-section">
          <h3 className="ep-group">UPSTREAM PROVIDERS — MODEL REGISTRY (NO API KEY NEEDED)</h3>
          <p className="ep-note">
            The model registry no longer depends on OpenRouter. Launch dates, pricing and context
            windows come from the keyless models.dev registry plus Hugging Face.
          </p>
          {UPSTREAMS.map((u) => (
            <div className="ep-card" key={u.url}>
              <div className="ep-card-head">
                <strong>{u.name}</strong>
                <span className="ep-auth">{u.key}</span>
              </div>
              <a className="ep-url" href={u.url} target="_blank" rel="noopener noreferrer">{u.url}</a>
              <p className="ep-desc">{u.note}</p>
            </div>
          ))}
        </div>

        <div className="ep-section">
          <h3 className="ep-group">MODEL REGISTRY API (THIS DEPLOYMENT)</h3>
          <EndpointList items={ENDPOINTS[0].items} />
        </div>

        <div className="ep-section">
          <h3 className="ep-group">NEWS WIRES & INGESTION</h3>
          <EndpointList items={ENDPOINTS[1].items} />
        </div>

        <div className="ep-section">
          <h3 className="ep-group">ANALYSIS & RANKING</h3>
          <EndpointList items={ANALYSIS_ITEMS} />
        </div>

        <div className="ep-section">
          <h3 className="ep-group">ACCOUNT WRITES (SUPABASE, OWNER-ONLY RLS)</h3>
          <EndpointList items={ACCOUNT_ITEMS} />
        </div>

        <div className="ep-section">
          <h3 className="ep-group">ENVIRONMENT VARIABLES (VERCEL)</h3>
          {ENV_VARS.map((v) => (
            <div className="ep-card" key={v.key}>
              <div className="ep-card-head">
                <strong><code>{v.key}</code></strong>
                <span className="ep-auth">{v.required}</span>
              </div>
              <p className="ep-desc">{v.note}</p>
            </div>
          ))}
          <p className="ep-note">
            Configure in Vercel → Project → Settings → Environment Variables (or <code>vercel env add &lt;KEY&gt;</code>).
            In demo mode the site works without any of these — reads hit live feeds with a 3-minute cache and account writes are disabled.
          </p>
        </div>
      </div>
    </section>
  );
}

