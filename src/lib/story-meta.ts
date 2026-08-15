import type { Story } from '@/lib/types';
import { fmtStars } from '@/lib/utils';

/** One benchmark chip: compact label + full title for tooltip. */
export interface BenchmarkChip {
  label: string;
  title: string;
}

/** Card-level story signals derived from data already in the story. */
export interface StoryStats {
  /** e.g. "279" or "1.2k" — null when the story has no points. */
  pointsLabel: string | null;
  /** e.g. "238" or "3.1k" — null when the story has no comments. */
  commentsLabel: string | null;
  /** Benchmark score chips (Arena Elo, SWE-bench, …) the story references. */
  benchmarks: BenchmarkChip[];
  /** True when the story links to a discussion thread (e.g. HN). */
  hasDiscussion: boolean;
}

/** Label for a benchmark score chip, e.g. "ARENA ELO 38" → "ARENA ELO 38". */
export function benchmarkLabel(benchmark: string, score: number, unit: string): string {
  const name = benchmark.trim().toUpperCase();
  const num = fmtStars(score);
  return (name + ' ' + num + (unit ? ' ' + unit : '')).replace(/\s+/g, ' ').trim();
}

export function storyStats(s: Story): StoryStats {
  return {
    pointsLabel: s.points != null ? fmtStars(s.points) : null,
    commentsLabel: s.comments != null ? fmtStars(s.comments) : null,
    benchmarks: (s.benchmarks || [])
      .map((b) => ({
        label: benchmarkLabel(b.benchmark, b.score, b.unit),
        title: b.benchmark + ': ' + b.score + (b.unit ? ' ' + b.unit : ''),
      }))
      .slice(0, 3),
    hasDiscussion: Boolean(s.discussion),
  };
}
