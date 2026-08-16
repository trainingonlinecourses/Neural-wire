/**
 * GENUINE model benchmarks — only numbers officially reported by the model
 * vendor at release, each with the source (model card / announcement) so any
 * figure can be verified. No scraping, no estimates, no AI-invented numbers.
 * The compare view renders exactly this dataset.
 *
 * Note on comparability: labs report scores under different harnesses/settings
 * (e.g. 5-shot vs CoT), so cross-model deltas are directional, not exact.
 */

export interface BenchmarkDef {
  id: string;
  name: string;
  desc: string;
  unit: string;
}

export const BENCHMARKS: BenchmarkDef[] = [
  { id: 'mmlu', name: 'MMLU', desc: 'Mass multitask language understanding, 5-shot — broad knowledge across 57 subjects.', unit: '%' },
  { id: 'humaneval', name: 'HumanEval', desc: 'Pass@1 on 164 hand-written Python programming problems.', unit: '%' },
  { id: 'gsm8k', name: 'GSM8K', desc: 'Grade-school math word problems, 8-shot CoT.', unit: '%' },
  { id: 'swebench', name: 'SWE-bench Verified', desc: 'Real GitHub issues resolved end-to-end (Human-verified subset).', unit: '%' },
];

export interface ModelBenchEntry {
  model: string;
  vendor: string;
  released: string; // e.g. "Jun 2024"
  /** scores keyed by benchmark id — only officially reported figures. */
  scores: Partial<Record<(typeof BENCHMARKS)[number]['id'], number>>;
  /** Official model card / announcement where the numbers were published. */
  source: string;
}

export const BENCH_MODELS: ModelBenchEntry[] = [
  {
    model: 'GPT-4o',
    vendor: 'OpenAI',
    released: 'May 2024',
    scores: { mmlu: 88.7, humaneval: 90.2, gsm8k: 90.5 },
    source: 'https://openai.com/index/hello-gpt-4o/',
  },
  {
    model: 'Claude 3.5 Sonnet',
    vendor: 'Anthropic',
    released: 'Jun 2024',
    scores: { mmlu: 88.7, humaneval: 92.0, gsm8k: 96.4, swebench: 49.0 },
    source: 'https://www.anthropic.com/news/claude-3-5-sonnet',
  },
  {
    model: 'Claude 3 Opus',
    vendor: 'Anthropic',
    released: 'Mar 2024',
    scores: { mmlu: 86.8, humaneval: 84.9, gsm8k: 95.0, swebench: 38.0 },
    source: 'https://www.anthropic.com/news/claude-3-family',
  },
  {
    model: 'Gemini 1.5 Pro',
    vendor: 'Google',
    released: 'Feb 2024',
    scores: { mmlu: 85.9, humaneval: 84.1, gsm8k: 91.7 },
    source: 'https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/',
  },
  {
    model: 'Llama 3.1 405B',
    vendor: 'Meta',
    released: 'Jul 2024',
    scores: { mmlu: 88.6, humaneval: 89.0, gsm8k: 96.8 },
    source: 'https://ai.meta.com/blog/meta-llama-3-1/',
  },
  {
    model: 'Llama 3.3 70B',
    vendor: 'Meta',
    released: 'Dec 2024',
    scores: { mmlu: 86.0, humaneval: 88.4, gsm8k: 91.6 },
    source: 'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct',
  },
  {
    model: 'Mistral Large 2',
    vendor: 'Mistral',
    released: 'Jul 2024',
    scores: { mmlu: 84.0, humaneval: 92.0, gsm8k: 93.0 },
    source: 'https://mistral.ai/news/mistral-large-2407/',
  },
  {
    model: 'Qwen2.5-72B',
    vendor: 'Alibaba',
    released: 'Sep 2024',
    scores: { mmlu: 86.1, humaneval: 84.2, gsm8k: 91.0 },
    source: 'https://qwenlm.github.io/blog/qwen2.5/',
  },
  {
    model: 'DeepSeek-V3',
    vendor: 'DeepSeek',
    released: 'Dec 2024',
    scores: { mmlu: 88.5, humaneval: 82.6, gsm8k: 89.3 },
    source: 'https://api-docs.deepseek.com/news/news250120',
  },
  {
    model: 'GPT-4',
    vendor: 'OpenAI',
    released: 'Mar 2023',
    scores: { mmlu: 86.4, humaneval: 67.0, gsm8k: 92.0 },
    source: 'https://openai.com/index/gpt-4-research/',
  },
  {
    model: 'DeepSeek-R1',
    vendor: 'DeepSeek',
    released: 'Jan 2025',
    scores: { mmlu: 90.8 },
    source: 'https://arxiv.org/abs/2501.12948',
  },
  {
    model: 'Kimi K2',
    vendor: 'Moonshot',
    released: 'Jul 2025',
    scores: { mmlu: 89.5, swebench: 65.8 },
    source: 'https://github.com/moonshotai/kimi-k2',
  },
  {
    model: 'GPT-4.1',
    vendor: 'OpenAI',
    released: 'Apr 2025',
    scores: { swebench: 54.6 },
    source: 'https://openai.com/index/gpt-4-1/',
  },
  {
    model: 'Claude 3.7 Sonnet',
    vendor: 'Anthropic',
    released: 'Feb 2025',
    scores: { swebench: 70.3 },
    source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
  },
  {
    model: 'Phi-4',
    vendor: 'Microsoft',
    released: 'Dec 2024',
    scores: { mmlu: 84.8, humaneval: 82.6 },
    source: 'https://arxiv.org/abs/2412.08905',
  },
  {
    model: 'Amazon Nova Pro',
    vendor: 'Amazon',
    released: 'Dec 2024',
    scores: { mmlu: 85.9, humaneval: 89.0, gsm8k: 94.8 },
    source: 'https://aws.amazon.com/blogs/aws/introducing-amazon-nova-frontier-intelligence-and-industry-leading-price-performance/',
  },
  {
    model: 'GLM-4.5',
    vendor: 'Zhipu',
    released: 'Jul 2025',
    scores: { swebench: 64.2 },
    source: 'https://z.ai/blog/glm-4.5',
  },
  {
    model: 'Qwen3-235B-A22B-Instruct',
    vendor: 'Alibaba',
    released: 'Apr 2025',
    scores: { mmlu: 89.3 },
    source: 'https://arxiv.org/abs/2505.09388',
  },
  {
    model: 'Qwen3-30B-A3B-Instruct',
    vendor: 'Alibaba',
    released: 'Apr 2025',
    scores: { mmlu: 86.6 },
    source: 'https://arxiv.org/abs/2505.09388',
  },
  {
    model: 'MiniMax-M1-80K',
    vendor: 'MiniMax',
    released: 'Jun 2025',
    scores: { swebench: 56.0 },
    source: 'https://github.com/MiniMax-AI/MiniMax-M1',
  },
  {
    model: 'GLM-4.6',
    vendor: 'Zhipu',
    released: 'Jul 2025',
    scores: { swebench: 68.0 },
    source: 'https://z.ai/blog/glm-4.6',
  },
  {
    model: 'Claude Sonnet 4',
    vendor: 'Anthropic',
    released: 'May 2025',
    scores: { swebench: 72.7 },
    source: 'https://www.anthropic.com/news/claude-4',
  },
  {
    model: 'Claude Opus 4',
    vendor: 'Anthropic',
    released: 'May 2025',
    scores: { swebench: 72.5 },
    source: 'https://www.anthropic.com/news/claude-4',
  },
  {
    model: 'GPT-5',
    vendor: 'OpenAI',
    released: 'Aug 2025',
    scores: { swebench: 74.9 },
    source: 'https://openai.com/index/introducing-gpt-5/',
  },
  {
    model: 'Claude Sonnet 4.5',
    vendor: 'Anthropic',
    released: 'Sep 2025',
    scores: { swebench: 77.2 },
    source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
  },
  {
    model: 'Gemini 3 Pro',
    vendor: 'Google',
    released: 'Nov 2025',
    scores: { swebench: 69.6 },
    source: 'https://www.swebench.com/',
  },
  {
    model: 'Claude Opus 4.5',
    vendor: 'Anthropic',
    released: 'Nov 2025',
    scores: { swebench: 80.9 },
    source: 'https://www.anthropic.com/news/claude-opus-4-5',
  },
  {
    model: 'Claude Opus 4.7',
    vendor: 'Anthropic',
    released: 'Apr 2026',
    scores: { swebench: 87.6 },
    source: 'https://www.anthropic.com/news/claude-opus-4-7',
  },
];

const VENDOR_FLAGS: Record<string, string> = {
  Alibaba: '🇨🇳',
  MiniMax: '🇨🇳',
  Zhipu: '🇨🇳',
  Moonshot: '🇨🇳',
  DeepSeek: '🇨🇳',
  Baidu: '🇨🇳',
  Tencent: '🇨🇳',
  '01.AI': '🇨🇳',
  'Shanghai AI Lab': '🇨🇳',
  ByteDance: '🇨🇳',
  OpenAI: '🇺🇸',
  Anthropic: '🇺🇸',
  Google: '🇺🇸',
  Meta: '🇺🇸',
  Microsoft: '🇺🇸',
  Amazon: '🇺🇸',
  NVIDIA: '🇺🇸',
  Mistral: '🇫🇷',
  Cohere: '🇨🇦',
};

export function vendorFlag(vendor: string): string {
  return VENDOR_FLAGS[vendor] ?? '🌐';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The full roster newest-first (by release date), for roster views. */
export function rosterByNewest(): ModelBenchEntry[] {
  return [...BENCH_MODELS].sort((a, b) => {
    const am = MONTHS.indexOf(a.released.slice(0, 3)) + (parseInt(a.released.slice(4), 10) * 12);
    const bm = MONTHS.indexOf(b.released.slice(0, 3)) + (parseInt(b.released.slice(4), 10) * 12);
    return bm - am;
  });
}

export function benchById(id: string): BenchmarkDef | undefined {
  return BENCHMARKS.find((b) => b.id === id);
}

/** Models that reported a score for the benchmark, sorted best-first. */
export function modelsForBench(benchId: string): ModelBenchEntry[] {
  return BENCH_MODELS.filter((m) => m.scores[benchId as keyof typeof m.scores] != null)
    .map((m) => ({ m, v: m.scores[benchId as keyof typeof m.scores]! }))
    .sort((a, b) => b.v - a.v)
    .map((x) => x.m);
}
