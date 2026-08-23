/**
 * LIVE model discovery — the desk's "what's new right now" layer.
 *
 * The curated roster (benchmarks.ts) holds sourced, official numbers but can
 * only move as fast as a human updates it. This module pulls the newest models
 * directly from OpenRouter (created timestamps) and Hugging Face trending on
 * every call, then tries to pull official benchmark numbers from each model's
 * own HF model card. Nothing here is invented: numbers come from the card or
 * are omitted.
 */

/** Bump when extraction/merge logic changes — invalidates the route cache. */
export const DATA_VERSION = '2026-08-16.2';

const HF_API = 'https://huggingface.co/api';
const OPENROUTER_API = 'https://openrouter.ai/api/v1/models';
const TOGETHER_API = 'https://api.together.xyz/v1/models';
const GROQ_API = 'https://api.groq.com/openai/v1/models';

/** One officially-reported benchmark number pulled from a model card. */
export interface LiveBenchmark {
  name: string;
  value: number;
}

export interface LiveModel {
  id: string; // canonical id, e.g. "Qwen/Qwen3.8-27B"
  name: string; // short display name, e.g. "Qwen3.8-27B"
  vendor: string;
  created: number; // epoch seconds (0 when unknown)
  context?: number; // context length in tokens (OpenRouter)
  downloads?: number;
  likes?: number;
  trendingScore?: number;
  hfUrl?: string;
  openrouterUrl?: string;
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

/** Newest models from OpenRouter (created timestamps), limit by recency. */
export async function fetchOpenRouterNewest(limit = 18, maxAgeDays = 120): Promise<LiveModel[]> {
  try {
    const j = await fetchJSON<{ data: Array<{ id: string; name?: string; created?: number; context_length?: number; hugging_face_id?: string }> }>(
      OPENROUTER_API,
    );
    const now = Date.now() / 1000;
    const out: LiveModel[] = [];
    for (const raw of j.data) {
      const created = typeof raw.created === 'number' ? raw.created : 0;
      if (!created || now - created > maxAgeDays * 24 * 3600) continue;
      const hfId = (raw.hugging_face_id || '').trim();
      const id = hfId || raw.id;
      const name = hfId ? hfId.split('/').slice(1).join('/') : raw.id.split('/').slice(1).join('/');
      out.push({
        id,
        name: name || raw.id,
        vendor: vendorFromId(id),
        created,
        context: typeof raw.context_length === 'number' ? raw.context_length : undefined,
        hfUrl: hfId ? `https://huggingface.co/${hfId}` : undefined,
        openrouterUrl: `https://openrouter.ai/${raw.id}`,
        benchmarks: [],
      });
    }
    out.sort((a, b) => b.created - a.created);
    return out.slice(0, limit);
  } catch {
    return [];
  }
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

/** Newest models from Together AI. */
export async function fetchTogetherNewest(limit = 12): Promise<LiveModel[]> {
  try {
    const j = await fetchJSON<{ data: Array<{ id: string; display_name?: string; created_at?: string; model_type?: string; context_length?: number }> }>(
      TOGETHER_API,
    );
    const now = Date.now() / 1000;
    const out: LiveModel[] = [];
    for (const raw of j.data || []) {
      // Only include text generation models
      if (raw.model_type && !['chat', 'completion', 'instruct'].includes(raw.model_type)) continue;
      const created = raw.created_at ? Math.floor(new Date(raw.created_at).getTime() / 1000) : 0;
      out.push({
        id: raw.id,
        name: raw.display_name || raw.id.split('/').pop() || raw.id,
        vendor: vendorFromId(raw.id),
        created,
        context: raw.context_length,
        hfUrl: `https://huggingface.co/${raw.id}`,
        benchmarks: [],
      });
    }
    out.sort((a, b) => b.created - a.created);
    return out.slice(0, limit);
  } catch {
    return [];
  }
}

/** Newest models from Groq. */
export async function fetchGroqNewest(limit = 12): Promise<LiveModel[]> {
  try {
    const j = await fetchJSON<{ data: Array<{ id: string; created?: number; owned_by?: string }> }>(
      GROQ_API,
    );
    const out: LiveModel[] = [];
    for (const raw of j.data || []) {
      // Filter to known model families
      const id = raw.id;
      if (!id.match(/llama|mixtral|gemma|qwen|deepseek|whisper|distil/i)) continue;
      out.push({
        id: 'groq/' + id,
        name: id,
        vendor: vendorFromId(id),
        created: raw.created || 0,
        benchmarks: [],
      });
    }
    return out.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Merge OpenRouter + HF trending + Together + Groq into one newest-first
 * list (deduped by HF id), attaching card-extracted benchmarks to the
 * top entries. Bounded card fetches keep the route fast.
 */
export async function getLiveModels(): Promise<LiveModel[]> {
  const [fromOr, fromHf, fromTogether, fromGroq] = await Promise.all([
    fetchOpenRouterNewest(),
    fetchHfTrending(),
    fetchTogetherNewest(),
    fetchGroqNewest(),
  ]);
  const byId = new Map<string, LiveModel>();
  for (const m of fromOr) byId.set(m.id, m);
  for (const m of fromHf) {
    const ex = byId.get(m.id);
    if (ex) {
      ex.downloads = ex.downloads ?? m.downloads;
      ex.likes = ex.likes ?? m.likes;
      ex.trendingScore = ex.trendingScore ?? m.trendingScore;
    } else {
      byId.set(m.id, m);
    }
  }
  for (const m of fromTogether) {
    if (!byId.has(m.id)) byId.set(m.id, m);
  }
  for (const m of fromGroq) {
    if (!byId.has(m.id)) byId.set(m.id, m);
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
  return merged.slice(0, 22);
}

export function fmtDownloads(n: number | undefined): string {
  if (n == null) return '';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}
