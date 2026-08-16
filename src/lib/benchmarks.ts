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
    source: 'https://ai.meta.com/blog/llama-3-3/',
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
];

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
