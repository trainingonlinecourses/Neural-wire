import type { BenchRef } from '../types';

/**
 * Benchmark-score extraction for the live Model Leaderboard.
 *
 * Each rule is ordered longest-name-first so "SWE-bench Verified" wins over
 * "SWE-bench". The regex captures `<name> … <score> <unit>?` with a flexible
 * gap so "SWE-bench Verified: 92.1%", "MMLU-Pro — 88.4%", "Arena Elo 1423"
 * all match. Scores without a trailing number are skipped.
 */
export interface BenchRule {
  name: string;
  re: RegExp;
  defaultUnit: string;
}

export const BENCH_RULES: BenchRule[] = [
  { name: 'SWE-bench Verified', re: /swe[- ]?bench\s+verified[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'Terminal-Bench', re: /terminal[- ]?bench[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'MMLU-Pro', re: /mmlu[- ]?pro[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'GPQA Diamond', re: /gpqa[- ]?diamond[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'ARC-AGI', re: /arc[- ]?agi[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'SWE-bench', re: /swe[- ]?bench[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'MMLU', re: /mmlu[^0-9a-z]{0,20}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'GPQA', re: /gpqa[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'HumanEval', re: /humaneval[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'AIME', re: /\baime[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'MATH', re: /\bmath[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'GSM8K', re: /gsm[- ]?8k[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'Arena Elo', re: /(?:arena\s+)?elo[^0-9]{0,30}([\d.]+)\b/i, defaultUnit: 'elo' },
  { name: 'LiveBench', re: /livebench[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'HellaSwag', re: /hellaswag[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'WinoGrande', re: /winogrande[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'ImageNet', re: /imagenet[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'GAIA', re: /\bgaia\b[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'WebArena', re: /web[- ]?arena[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
  { name: 'BigBench', re: /big[- ]?bench[^0-9]{0,30}([\d.]+)\s*(%|points|elo)?/i, defaultUnit: '%' },
];

interface Span {
  start: number;
  end: number;
}

/** Escape regex metacharacters in a benchmark-name token. */
function escapeToken(tok: string): string {
  return tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the score-before-name variant of a rule, so "92.1% on SWE-bench
 * Verified" matches the same way "SWE-bench Verified: 92.1%" does.
 * Pattern: `<score> <unit|preposition> <name>`. The connector is required so a
 * bare number that merely precedes the name (e.g. "Claude 4 SWE-bench") isn't
 * mistaken for a score.
 */
function scoreFirstRegex(name: string): RegExp {
  const namePat = name
    .toLowerCase()
    .split(/[\s-]+/)
    .map(escapeToken)
    .join('[- ]?\\s*');
  // Require a unit OR a preposition between score and name, otherwise a bare
  // number like "Claude 4 SWE-bench" would be read as the score.
  const connector =
    '(?:(%|points|elo)\\s*(?:on|at|for|in|scored|vs\\.?|versus)?|(?:on|at|for|in|scored|vs\\.?|versus))';
  return new RegExp(`([\\d.]+)\\s*${connector}\\s*\\b${namePat}\\b`, 'i');
}

/** Precomputed score-before-name regexes, indexed to match BENCH_RULES. */
const SCORE_FIRST: RegExp[] = BENCH_RULES.map((r) => scoreFirstRegex(r.name));

/**
 * Extract benchmark scores from text. Returns one entry per benchmark rule
 * (first match only), with the reported numeric score and unit.
 *
 * Rules run longest-name-first, and every match records its span; a later
 * (shorter) rule whose match lies entirely inside an already-claimed span is
 * skipped — so "SWE-bench Verified" never also yields a bare "SWE-bench".
 */
export function extractBenchmarks(text: string): BenchRef[] {
  const hits: BenchRef[] = [];
  const covered: Span[] = [];

  const tryMatch = (rule: BenchRule, re: RegExp): void => {
    const m = re.exec(text);
    if (!m || m[1] == null) return;
    const start = m.index;
    const end = start + m[0].length;
    if (covered.some((c) => start >= c.start && end <= c.end)) return;
    const score = parseFloat(m[1]);
    if (isNaN(score)) return;
    covered.push({ start, end });
    hits.push({ benchmark: rule.name, score, unit: (m[2] || rule.defaultUnit).toLowerCase() });
  };

  for (let i = 0; i < BENCH_RULES.length; i++) {
    tryMatch(BENCH_RULES[i], BENCH_RULES[i].re);
    tryMatch(BENCH_RULES[i], SCORE_FIRST[i]);
  }
  return hits;
}
