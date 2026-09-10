/**
 * MODEL RELEASES — REAL recently-launched models, pulled live from:
 *  • OpenRouter  (frontier/closed + open models — real `created`
 *    timestamps and REAL per-token USD pricing)
 *  • Hugging Face (open-weight repos — real `createdAt`, downloads, likes)
 *  • Together AI (open models — real `created_at` listing dates)
 *  • Groq (open-model hosting)
 *
 * Classification: a model with a Hugging Face repo → OPEN WEIGHTS
 * (the HF card is the authoritative source);no HF repo → FRONTIER /
 * API-ONLY commercial model (sourced from its OpenRouter page). Cost
 * tier is derived from REAL OpenRouter pricing when present. Nothing here
 * is fabricated — every field comes from a live registry API.
 */

import { getLiveModels, type LiveModel } from './live-models';

export type ModelKind = 'frontier' | 'open';

export interface ModelRelease {
  id: string;
  name: string;
  vendor: string;
  /** Epoch seconds from the registry — the real launch/add date. */
  releasedAt: number;
  /** true = repo on Hugging Face (open weights); false = API-only frontier. */
  openSource: boolean;
  /** Derived from REAL OpenRouter pricing: free|low|medium|high|unknown. */
  costTier: string;
  context?: number;
  downloads?: number;
  likes?: number;
  trendingScore?: number;
  /** Real Hugging Face repo (open weights. */
  hfUrl?: string;
  /** Real OpenRouter model page. */
  openrouterUrl?: string;
  /** Primary real reference link (HF card when open, else OpenRouter page. */
  source: string;
  /** Real USD per 1M input tokens (OpenRouter pricing. */
  pricePromptPerM?: number;
  /** Real USD per 1M output tokens (OpenRouter pricing. */
  priceCompletionPerM?: number;
}

/** Scale a real per-token OpenRouter price to per-1M-token USD. */
export function perMillion(v: number | undefined): number | undefined {
  return v != null ? v * 1_000_000 : undefined;
}

/** Real cost tier from actual per-1M-token USD pricing (exact zeros → free). */
export function deriveCostTier(promptPerM: number | undefined, completionPerM: number | undefined): string {
  const p = promptPerM ?? 0;
  const c = completionPerM ?? 0;
  if (p === 0 && c === 0) return 'free';
  const t = p + c;
  if (t < 1.5) return 'low';
  if (t < 10) return 'medium';
  return 'high';
}

/** Map a live registry entry into a release card (real fields only). */
export function releaseFromLiveModel(m: LiveModel): ModelRelease {
  const promptPerM = perMillion(m.pricing?.prompt);
  const completionPerM = perMillion(m.pricing?.completion);
  const openSource = Boolean(m.hfUrl);
  const hasPricing = Boolean(m.pricing && (m.pricing.prompt != null || m.pricing.completion != null));
  const costTier = hasPricing ? deriveCostTier(promptPerM, completionPerM) : 'unknown';
  return {
    id: m.id,
    name: m.name,
    vendor: m.vendor,
    releasedAt: m.created,
    openSource,
    costTier,
    context: m.context,
    downloads: m.downloads,
    likes: m.likes,
    trendingScore: m.trendingScore,
    hfUrl: m.hfUrl,
    openrouterUrl: m.openrouterUrl,
    source: m.hfUrl ?? m.openrouterUrl ?? '',
    pricePromptPerM: promptPerM,
    priceCompletionPerM: completionPerM,
  };
}

/** Keep only entries with a real date, inside the recency window, newest first. */
export function filterRecent(releases: ModelRelease[], days =180, now = Date.now()): ModelRelease[] {
  const cutoff = now / 1000 - days * 24 * 3600;
  return releases
    .filter((r) => r.releasedAt > 0 && r.releasedAt >= cutoff)
    .sort((a, b) => b.releasedAt - a.releasedAt);
}

export function kindLabel(r: ModelRelease): string {
  return r.openSource ? 'OPEN WEIGHTS' : 'FRONTIER API';
}

/**
 * Live-fetch the newest releases from OpenRouter + Hugging Face + Together +
 * Groq, then classify real frontier vs open weights. Shows ONLY real,dated
 * model launches — no curated examples. */
export async function getLiveReleases(days =180, limit =24): Promise<ModelRelease[]> {
  const live = await getLiveModels();
  const releases = filterRecent(live.map((m) => releaseFromLiveModel(m)), days);
  return releases.slice(0, limit);
}

/**
 * Does a story's detected model tags match this release? Matches either way
 * around (e.g. tag "Claude" ↔ release "Claude Opus 4.7", or tag
 * "GPT-5" ↔ release "GPT-5.1") with a 3-char minimum to avoid junk hits. */
export function storyMentionsRelease(models: string[], release: ModelRelease): boolean {
  const a = release.name.toLowerCase();
  return models.some((m) => {
    const b = m.toLowerCase();
    if (b.length < 3 || a.length < 3) return false;
    return a.includes(b) || b.includes(a);
  });
}