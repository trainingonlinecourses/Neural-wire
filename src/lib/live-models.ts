/**
 * LIVE model discovery — the desk's "what's new right now" layer.
 *
 * The curated roster (benchmarks.ts) holds sourced, official numbers but can
 * only move as fast as a human updates it. This module pulls the newest models
 * directly from the keyless models.dev registry (213 providers — OpenAI,
 * Anthropic, Google, Meta, xAI, DeepSeek, Qwen, Moonshot, MiniMax, Mistral…)
 * and Hugging Face trending on every call, then tries to pull official
 * benchmark numbers from each model's own HF model card. Nothing here is
 * invented: numbers come from the card or are omitted.
 */

/** Bump when extraction/merge logic changes — invalidates the route cache. */
export const DATA_VERSION = '2026-09-10.1';

const HF_API = 'https://huggingface.co/api';

/** Keyless aggregated registry: release dates, open_weights, per-1M pricing. */
const MODELSDEV_API = 'https://models.dev/api.json';

/** One officially-reported benchmark number pulled from a model card. */
export interface LiveBenchmark {
  name: string;
  value: number;
}

/** Real per-1M-token pricing (USD) from the models.dev registry. */
export interface LivePricing {
  prompt?: number;
  completion?: number;
}

export interface LiveModel {
  id: string; // canonical id, e.g. "Qwen/Qwen3.8-27B"
  name: string; // short display name, e.g. "Qwen3.8-27B"
  vendor: string;
  created: number; // epoch seconds (0 when unknown)
  context?: number; // context length in tokens (models.dev `limit.context`)
  downloads?: number;
  likes?: number;
  trendingScore?: number;
  hfUrl?: string;
  modelsdevUrl?: string; // registry detail page (models.dev provider#model)
  pricing?: LivePricing;
  benchmarks: LiveBenchmark[];
}

const CARD_CACHE = new Map<string, { at: number; text: string }>();
const CARD_TTL_MS = 6 * 60 * 60 * 1000;

async function fetchText(url: string, ms = 12000): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(ms),
    headers: { 'User-Agent': 'neuralwire/1.0' },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

async function fetchJSON<T>(url: string, ms = 12000): Promise<T> {
  return JSON.parse(await fetchText(url, ms)) as T;
}

/** Vendor guess from a model id / author, e.g. "Qwen/Qwen3.8-27B" → "Qwen". */
export function vendorFromId(id: string): string {
  const part = id.split('/')[0] || id;
  const map: Record<string, string> = {
    qwen: 'Alibaba',
    zai: 'Zhipu',
    zai_org: 'Zhipu',
    moonshotai: 'Moonshot',
    minimaxai: 'MiniMax',
    minimax: 'MiniMax',
    deepseek: 'DeepSeek',
    deepseek_ai: 'DeepSeek',
    baidu: 'Baidu',
    ernie: 'Baidu',
    tencent: 'Tencent',
    hunyuan: 'Tencent',
    bytedance: 'ByteDance',
    bytedance_seed: 'ByteDance',
    seed: 'ByteDance',
    liquidai: 'Liquid AI',
    '01ai': '01.AI',
    openai: 'OpenAI',
    google: 'Google',
    meta: 'Meta',
    meta_llama: 'Meta',
    microsoft: 'Microsoft',
    phi: 'Microsoft',
    anthropic: 'Anthropic',
    amazon: 'Amazon',
    nvidia: 'NVIDIA',
    mistralai: 'Mistral',
    mistral: 'Mistral',
    cohere: 'Cohere',
  };
  const key = part.toLowerCase().replace(/-/g, '_');
  return map[key] ?? (part || 'Unknown');
}

/**
 * Extract benchmark numbers from a markdown model card. Only plain

 * pipe-tables are parsed (the format most labs use); HTML-table cards return
 * nothing rather than guessing. Frontier cards today report modern
 * benchmarks (HLE, Terminal Bench, DeepSWE…) as often as MMLU, so any
 * recognized benchmark name is captured with its number. Comparison tables
 * bold the vendor's own column (**91.8**) — a bolded cell is preferred;
 * otherwise the first numeric cell after the name is taken.
 */
export function extractBenchmarksFromCard(markdown: string): LiveBenchmark[] {
  const PATTERNS: Array<{ name: string; re: RegExp }> = [
    { name: 'HLE', re: /humanity.?s last exam|\bhle\b/i },
    { name: 'Terminal Bench', re: /terminal bench/i },
    { name: 'SWE-bench', re: /swe[- ]?bench/i },
    { name: 'SWE Verified', re: /swe verified/i },
    { name: 'DeepSWE', re: /deepsw/i },
    { name: 'NL2Repo', re: /nl2repo/i },
    { name: 'Toolathlon', re: /toolathlon/i },
    { name: 'AutomationBench', re: /automationbench/i },
    { name: 'DSBench', re: /dsbench/i },
    { name: 'Cybergym', re: /cybergym/i },
    { name: 'LiveCodeBench', re: /livecodebench|live code bench/i },
    { name: 'MATH-500', re: /math[- ]?500/i },
    { name: 'AIME', re: /\baime\b/i },
    { name: 'GPQA', re: /gpqa/i },
    { name: 'MMLU-Pro', re: /mmlu[- ]?pro/i },
    // "MMLU" or "MMLU (Pass@1)" — never MMLU-Pro / MMLU-Redux
    { name: 'MMLU', re: /^mmlu(\s*\(|\s*$)/i },
    { name: 'HumanEval', re: /humaneval/i },
    // "GSM8K" or "GSM8K (EM)"
    { name: 'GSM8K', re: /^gsm8k(\s*\(|\s*$)/i },
    { name: 'Arena Hard', re: /arena hard/i },
    { name: 'SimpleQA', re: /simpleqa/i },
    { name: 'BFCL', re: /bfcl/i },
  ];
  const num = (c: string): number | null => {
    const clean = c.replace(/[*`]/g, '').replace(/%/g, '').trim();
    // Reject signed values like "-3" (range values like "42.7 / 60.0" are fine —
    // the first plain number is taken).
    if (/^[-+]/.test(clean)) return null;
    const m = clean.match(/\d+(?:\.\d+)?/);
    if (!m) return null;
    const v = parseFloat(m[0]);
    return Number.isFinite(v) && v > 0 && v <= 100 ? Math.round(v * 10) / 10 : null;
  };
  const out: LiveBenchmark[] = [];
  const seen = new Set<string>();
  for (const line of markdown.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    for (const { name, re } of PATTERNS) {
      if (seen.has(name)) continue;
      const idx = cells.findIndex((c) => re.test(c));
      if (idx < 0) continue;
      const after = cells.slice(idx + 1);
      const bold = after.find((c) => c.includes('**'));
      const v = num(bold ?? '') ?? after.map(num).find((x): x is number => x != null) ?? null;
      if (v != null) {
        seen.add(name);
        out.push({ name, value: v });
      }
    }
    if (out.length >= 6) break;
  }
  return out;
}

async function fetchCardMarkdown(hfId: string): Promise<string> {
  const cached = CARD_CACHE.get(hfId);
  if (cached && Date.now() - cached.at < CARD_TTL_MS) return cached.text;
  try {
    const text = await fetchText(`https://huggingface.co/${hfId}/raw/main/README.md`, 8000);
    CARD_CACHE.set(hfId, { at: Date.now(), text });
    return text;
  } catch {
    return '';
  }
}

/**
 * Newest releases from the keyless models.dev registry. Each provider entry
 * (OpenAI, Anthropic, Google, Meta, xAI, DeepSeek, Moonshot, MiniMax, Mistral,
 * Qwen/Alibaba, Nvidia, Cohere, Amazon, Groq, togetherai…) carries per-model
 * `release_date` (ISO), `open_weights`, `limit.context` and `cost`
 * (real USD per 1M tokens). Frontier-only providers' models keep their
 * official release date; open-weight models also get a HF repo link when a
 * matching Hugging Face org exists.
 */
export async function fetchModelsDevNewest(limit = 24, maxAgeDays = 30): Promise<LiveModel[]> {
  try {
    const j = await fetchJSON<Record<string, { name?: string; models?: Record<string, ModelsDevModel> }>>(MODELSDEV_API);
    const now = Date.now() / 1000;
    const out: LiveModel[] = [];
    for (const [providerId, provider] of Object.entries(j)) {
      for (const m of Object.values(provider.models || {})) {
        if (!m.release_date) continue;
        const created = parseIsoDay(m.release_date);
        if (!created || now - created > maxAgeDays * 24 * 3600) continue;
        const id = `${providerId}/${m.id}`;
        const vendor = providerName(providerId, provider.name) || vendorFromId(m.id);
        const openWeights = m.open_weights === true;
        out.push({
          id,
          name: m.name || m.id,
          vendor,
          created,
          context: typeof m.limit?.context === 'number' ? m.limit.context : undefined,
          hfUrl: openWeights ? guessHfUrl(m.id, vendor) : undefined,
          modelsdevUrl: `https://models.dev/${providerId}`,
          pricing:
            m.cost && (m.cost.input != null || m.cost.output != null)
              ? { prompt: m.cost.input, completion: m.cost.output }
              : undefined,
          benchmarks: [],
        });
      }
    }
    out.sort((a, b) => b.created - a.created);
    return out.slice(0, limit);
  } catch {
    return [];
  }
}

/** Raw model row of the models.dev registry (fields the desk consumes). */
interface ModelsDevModel {
  id: string;
  name?: string;
  release_date?: string;
  open_weights?: boolean;
  limit?: { context?: number };
  cost?: { input?: number; output?: number };
}

/** Parse an ISO day ("2026-09-04") to epoch seconds (UTC noon to survive TZ shifts). */
export function parseIsoDay(iso: string): number {
  const t = Date.parse(iso + 'T12:00:00Z');
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0;
}

/** Display name for a models.dev provider (registry name or prettified id). */
export function providerName(providerId: string, name?: string): string {
  if (name) return name;
  return providerId
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Best-effort HF repo URL for an open-weight model id (deduped by HF later). */
function guessHfUrl(modelId: string, vendor: string): string | undefined {
  const known: Record<string, string> = {
    openai: 'openai',
    google: 'google',
    meta: 'meta-llama',
    nvidia: 'nvidia',
    mistral: 'mistralai',
    moonshot: 'moonshotai',
    deepseek: 'deepseek-ai',
    alibaba: 'Qwen',
    qwen: 'Qwen',
    minimax: 'MiniMaxAI',
    'z.ai': 'zai-org',
    ibm: 'ibm-granite',
    microsoft: 'microsoft',
    cohere: 'cohere',
  };
  const org = known[vendor.toLowerCase()];
  return org ? `https://huggingface.co/${org}/${modelId}` : undefined;
}

/** Normalize a numeric or numeric-string price to a number (USD per token). */
export function num(v: string | number | null | undefined): number | undefined {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : undefined;
}

/** Trending models from Hugging Face with engagement stats. */
export async function fetchHfTrending(limit = 14): Promise<LiveModel[]> {
  try {
    const j = (await fetchJSON<{ recentlyTrending?: Array<{ repoData: Record<string, unknown> }> }>(
      HF_API + '/trending',
    )) as { recentlyTrending?: Array<{ repoData: Record<string, unknown> }> };
    const rows = j.recentlyTrending || [];
    const out: LiveModel[] = [];
    for (const r of rows) {
      const d = r.repoData as { id?: string; downloads?: number; likes?: number; trendingScore?: number; createdAt?: string };
      const id = d.id || '';
      if (!id || id.split('/').length < 2) continue;
      out.push({
        id,
        name: id.split('/').slice(1).join('/'),
        vendor: vendorFromId(id),
        created: d.createdAt ? Math.floor(new Date(d.createdAt).getTime() / 1000) : 0,
        downloads: d.downloads,
        likes: d.likes,
        trendingScore: d.trendingScore,
        hfUrl: `https://huggingface.co/${id}`,
        benchmarks: [],
      });
    }
    return out.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Merge models.dev releases + Hugging Face trending into one newest-first
 * list (deduped by id), attaching card-extracted benchmarks to the
 * top entries. Bounded card fetches keep the route fast.
 */
export async function getLiveModels(): Promise<LiveModel[]> {
  const [fromRegistry, fromHf] = await Promise.all([fetchModelsDevNewest(), fetchHfTrending()]);
  const byId = new Map<string, LiveModel>();
  for (const m of fromRegistry) byId.set(m.id, m);
  for (const m of fromHf) {
    const ex = byId.get(m.id);
    if (ex) {
      ex.downloads = ex.downloads ?? m.downloads;
      ex.likes = ex.likes ?? m.likes;
      ex.trendingScore = ex.trendingScore ?? m.trendingScore;
      ex.hfUrl = ex.hfUrl ?? m.hfUrl;
    } else {
      byId.set(m.id, m);
    }
  }
  const merged = [...byId.values()].sort((a, b) => b.created - a.created);
  // Attach card benchmarks to the freshest entries only (bounded work).
  await Promise.all(
    merged.slice(0, 10).map(async (m) => {
      if (m.hfUrl) {
        const card = await fetchCardMarkdown(m.id);
        if (card) m.benchmarks = extractBenchmarksFromCard(card);
      }
    }),
  );
  return merged.slice(0, 30);
}

export function fmtDownloads(n: number | undefined): string {
  if (n == null) return '';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}
