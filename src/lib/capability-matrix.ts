/**
 * Model Capability Matrix — interactive radar comparison of AI models across
 * multiple dimensions. ONLY 2025+ flagships — no legacy models.
 */

export interface CapabilityDimension {
  id: string;
  label: string;
  icon: string;
  score: number;
  source?: string;
}

export interface ModelProfile {
  name: string;
  vendor: string;
  dimensions: CapabilityDimension[];
  composite: number;
  costTier: string;
  contextWindow?: number;
  releasedAt?: string;
  sources: string[];
}

export interface ComparisonResult {
  modelA: ModelProfile;
  modelB: ModelProfile;
  winner: string;
  margin: number;
  dimensionWins: { dimension: string; winner: string; margin: number }[];
  recommendation: string;
}

export interface CapabilityMatrix {
  profiles: ModelProfile[];
  dimensions: { id: string; label: string; icon: string }[];
  generatedAt: number;
}

const KNOWN_PROFILES: Omit<ModelProfile, 'sources'>[] = [
  // ── 2026 Flagships (newest) ───────────────────────────────────────
  {
    name: 'Claude Opus 4.7',
    vendor: 'Anthropic',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 97 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 98 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 92 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 85 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 96 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 88 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 60 },
      { id: 'math', label: 'Math', icon: '📐', score: 95 },
    ],
    composite: 91,
    costTier: 'high',
    contextWindow: 200000,
  },
  {
    name: 'GPT-5.1',
    vendor: 'OpenAI',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 95 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 95 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 90 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 88 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 94 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 90 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 85 },
      { id: 'math', label: 'Math', icon: '📐', score: 96 },
    ],
    composite: 92,
    costTier: 'high',
    contextWindow: 256000,
  },
  {
    name: 'Gemini 3.5 Pro',
    vendor: 'Google',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 93 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 92 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 87 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 92 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 90 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 92 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 82 },
      { id: 'math', label: 'Math', icon: '📐', score: 94 },
    ],
    composite: 90,
    costTier: 'medium',
    contextWindow: 1000000,
  },
  {
    name: 'DeepSeek-V4',
    vendor: 'DeepSeek',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 93 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 94 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 82 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 0 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 88 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 86 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 80 },
      { id: 'math', label: 'Math', icon: '📐', score: 95 },
    ],
    composite: 85,
    costTier: 'free',
    contextWindow: 128000,
  },
  {
    name: 'GLM-5',
    vendor: 'Zhipu',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 91 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 90 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 84 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 80 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 88 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 86 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 82 },
      { id: 'math', label: 'Math', icon: '📐', score: 92 },
    ],
    composite: 87,
    costTier: 'free',
    contextWindow: 128000,
  },
  {
    name: 'Grok 4',
    vendor: 'xAI',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 90 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 88 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 86 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 82 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 87 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 82 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 88 },
      { id: 'math', label: 'Math', icon: '📐', score: 90 },
    ],
    composite: 87,
    costTier: 'medium',
    contextWindow: 131072,
  },
  {
    name: 'Mistral Large 3',
    vendor: 'Mistral',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 86 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 85 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 82 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 80 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 84 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 90 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 86 },
      { id: 'math', label: 'Math', icon: '📐', score: 84 },
    ],
    composite: 85,
    costTier: 'medium',
    contextWindow: 128000,
  },
  {
    name: 'Qwen3.8-72B',
    vendor: 'Alibaba',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 88 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 86 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 82 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 80 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 86 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 92 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 82 },
      { id: 'math', label: 'Math', icon: '📐', score: 88 },
    ],
    composite: 86,
    costTier: 'free',
    contextWindow: 131072,
  },
  // ── Late 2025 ─────────────────────────────────────────────────────
  {
    name: 'Claude Opus 4.5',
    vendor: 'Anthropic',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 95 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 96 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 90 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 84 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 94 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 86 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 62 },
      { id: 'math', label: 'Math', icon: '📐', score: 92 },
    ],
    composite: 88,
    costTier: 'high',
    contextWindow: 200000,
  },
  {
    name: 'Gemini 3 Pro',
    vendor: 'Google',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 91 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 90 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 85 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 90 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 88 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 90 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 80 },
      { id: 'math', label: 'Math', icon: '📐', score: 92 },
    ],
    composite: 88,
    costTier: 'medium',
    contextWindow: 1000000,
  },
  {
    name: 'Claude Sonnet 4.5',
    vendor: 'Anthropic',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 92 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 94 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 88 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 83 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 92 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 85 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 88 },
      { id: 'math', label: 'Math', icon: '📐', score: 90 },
    ],
    composite: 89,
    costTier: 'medium',
    contextWindow: 200000,
  },
  {
    name: 'GPT-5',
    vendor: 'OpenAI',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 90 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 91 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 88 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 86 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 90 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 88 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 88 },
      { id: 'math', label: 'Math', icon: '📐', score: 94 },
    ],
    composite: 89,
    costTier: 'high',
    contextWindow: 256000,
  },
  // ── Mid 2025 ──────────────────────────────────────────────────────
  {
    name: 'Kimi K2',
    vendor: 'Moonshot',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 86 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 84 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 78 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 76 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 82 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 84 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 80 },
      { id: 'math', label: 'Math', icon: '📐', score: 84 },
    ],
    composite: 82,
    costTier: 'low',
    contextWindow: 128000,
  },
  {
    name: 'GLM-4.6',
    vendor: 'Zhipu',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 84 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 82 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 80 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 78 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 82 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 84 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 84 },
      { id: 'math', label: 'Math', icon: '📐', score: 82 },
    ],
    composite: 82,
    costTier: 'free',
    contextWindow: 128000,
  },
  {
    name: 'Llama 4 Maverick',
    vendor: 'Meta',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 82 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 80 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 78 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 76 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 80 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 82 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 90 },
      { id: 'math', label: 'Math', icon: '📐', score: 75 },
    ],
    composite: 80,
    costTier: 'free',
    contextWindow: 1000000,
  },
  {
    name: 'Doubao-Seed-1.6',
    vendor: 'ByteDance',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 82 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 80 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 76 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 74 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 80 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 82 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 85 },
      { id: 'math', label: 'Math', icon: '📐', score: 78 },
    ],
    composite: 80,
    costTier: 'low',
    contextWindow: 128000,
  },
  {
    name: 'Qwen3-235B-A22B',
    vendor: 'Alibaba',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 88 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 86 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 80 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 0 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 85 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 90 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 78 },
      { id: 'math', label: 'Math', icon: '📐', score: 86 },
    ],
    composite: 84,
    costTier: 'free',
    contextWindow: 131072,
  },
  {
    name: 'MiniMax-M1',
    vendor: 'MiniMax',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 80 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 78 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 76 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 72 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 78 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 80 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 82 },
      { id: 'math', label: 'Math', icon: '📐', score: 76 },
    ],
    composite: 78,
    costTier: 'free',
    contextWindow: 40000,
  },
  // ── Early 2025 ────────────────────────────────────────────────────
  {
    name: 'DeepSeek R1',
    vendor: 'DeepSeek',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 91 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 90 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 72 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 0 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 78 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 80 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 55 },
      { id: 'math', label: 'Math', icon: '📐', score: 95 },
    ],
    composite: 70,
    costTier: 'low',
    contextWindow: 128000,
  },
  {
    name: 'Claude Sonnet 4',
    vendor: 'Anthropic',
    dimensions: [
      { id: 'reasoning', label: 'Reasoning', icon: '🧠', score: 89 },
      { id: 'coding', label: 'Coding', icon: '💻', score: 93 },
      { id: 'creative', label: 'Creative', icon: '🎨', score: 87 },
      { id: 'vision', label: 'Vision', icon: '👁', score: 82 },
      { id: 'instruction', label: 'Instruction', icon: '📋', score: 90 },
      { id: 'multilingual', label: 'Multilingual', icon: '🌍', score: 82 },
      { id: 'speed', label: 'Speed', icon: '⚡', score: 88 },
      { id: 'math', label: 'Math', icon: '📐', score: 84 },
    ],
    composite: 87,
    costTier: 'medium',
    contextWindow: 200000,
  },
];

const DIMENSIONS = [
  { id: 'reasoning', label: 'Reasoning', icon: '🧠' },
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'vision', label: 'Vision', icon: '👁' },
  { id: 'instruction', label: 'Instruction', icon: '📋' },
  { id: 'multilingual', label: 'Multilingual', icon: '🌍' },
  { id: 'speed', label: 'Speed', icon: '⚡' },
  { id: 'math', label: 'Math', icon: '📐' },
];

export function buildCapabilityMatrix(): CapabilityMatrix {
  return {
    profiles: KNOWN_PROFILES.map((p) => ({
      ...p,
      sources: [],
    })),
    dimensions: DIMENSIONS,
    generatedAt: Date.now(),
  };
}

export function compareModels(
  profiles: ModelProfile[],
  nameA: string,
  nameB: string,
): ComparisonResult | null {
  const a = profiles.find((p) => p.name === nameA);
  const b = profiles.find((p) => p.name === nameB);
  if (!a || !b) return null;

  const dimensionWins: ComparisonResult['dimensionWins'] = [];
  let aWins = 0;
  let bWins = 0;

  for (const dim of DIMENSIONS) {
    const da = a.dimensions.find((d) => d.id === dim.id);
    const db = b.dimensions.find((d) => d.id === dim.id);
    if (!da || !db) continue;
    const diff = da.score - db.score;
    if (Math.abs(diff) < 3) continue;
    const winner = diff > 0 ? a.name : b.name;
    dimensionWins.push({ dimension: dim.label, winner, margin: Math.abs(diff) });
    if (diff > 0) aWins++;
    else bWins++;
  }

  const margin = Math.abs(a.composite - b.composite);
  const winner = a.composite >= b.composite ? a.name : b.name;

  const recommendation =
    aWins > bWins
      ? `${a.name} wins ${aWins}/${aWins + bWins} dimensions. Better at ${dimensionWins.filter((d) => d.winner === a.name).map((d) => d.dimension.toLowerCase()).join(', ')}.`
      : bWins > aWins
        ? `${b.name} wins ${bWins}/${aWins + bWins} dimensions. Better at ${dimensionWins.filter((d) => d.winner === b.name).map((d) => d.dimension.toLowerCase()).join(', ')}.`
        : 'These models are closely matched across all dimensions.';

  return { modelA: a, modelB: b, winner, margin, dimensionWins, recommendation };
}

export function valueRanking(profiles: ModelProfile[]): (ModelProfile & { valueScore: number })[] {
  const costMultiplier: Record<string, number> = {
    free: 1.0,
    low: 0.8,
    medium: 0.5,
    high: 0.3,
    premium: 0.15,
  };
  return profiles
    .map((p) => ({
      ...p,
      valueScore: Math.round(p.composite * (costMultiplier[p.costTier] || 0.5)),
    }))
    .sort((a, b) => b.valueScore - a.valueScore);
}

export function radarPoints(
  dimensions: CapabilityDimension[],
  maxRadius = 100,
): { x: number; y: number; label: string; score: number }[] {
  const n = dimensions.length;
  return dimensions.map((d, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const r = (d.score / 100) * maxRadius;
    return {
      x: Math.round(maxRadius + r * Math.cos(angle)),
      y: Math.round(maxRadius + r * Math.sin(angle)),
      label: d.icon + ' ' + d.label,
      score: d.score,
    };
  });
}
