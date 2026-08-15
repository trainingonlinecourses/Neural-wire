import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  climbScore,
  deltaText,
  fetchGhStarDelta,
  GH_STAR_FLOOR,
  hfSortFor,
  liveSignalCands,
  matchMovers,
  RANGE_DAYS,
  rankAll,
  signalToCand,
  sortByRisers,
  withinWindow,
  type Cand,
  type RadarSignal,
  type TrendingRow,
} from './trending';

const cand = (id: string, value: number): Cand => ({
  id,
  name: id,
  sub: '',
  metric: String(value),
  value,
  href: 'https://example.com/' + id,
});

describe('rankAll', () => {
  it('normalizes heat to 100 for the leader of each category', () => {
    const rows = rankAll([
      { kind: 'gh', items: [cand('a', 1200), cand('b', 300)] },
      { kind: 'hf', items: [cand('m', 40)] },
    ]);
    expect(rows.find((r) => r.id === 'a')?.heat).toBe(100);
    expect(rows.find((r) => r.id === 'b')?.heat).toBe(25);
    expect(rows.find((r) => r.id === 'm')?.heat).toBe(100);
  });

  it('sorts by heat desc across categories', () => {
    const rows = rankAll([
      { kind: 'gh', items: [cand('small-repo', 500)] },
      { kind: 'hf', items: [cand('big-model', 300), cand('mid-model', 30)] },
    ]);
    expect(rows.map((r) => r.id)).toEqual(['small-repo', 'big-model', 'mid-model']);
  });

  it('breaks ties by category priority then value', () => {
    const rows = rankAll([
      { kind: 'hf', items: [cand('m', 100)] },
      { kind: 'gh', items: [cand('r', 100)] },
    ]);
    expect(rows.map((r) => r.kind)).toEqual(['gh', 'hf']);
  });

  it('ranks radar signals without a numeric value at the bottom with heat 0', () => {
    const rows = rankAll([
      { kind: 'radar', items: [{ ...cand('climate', 0), name: 'Climate Intelligence' }, cand('fear-greed', 45)] },
      { kind: 'gh', items: [cand('r', 1000)] },
    ]);
    expect(rows.find((r) => r.id === 'fear-greed')?.heat).toBe(100);
    expect(rows.find((r) => r.id === 'climate')?.heat).toBe(0);
    expect(rows[rows.length - 1].id).toBe('climate');
  });

  it('assigns a cross-category global percentile (100 top, 0 bottom)', () => {
    const rows = rankAll([
      { kind: 'gh', items: [cand('a', 1000), cand('b', 500)] },
      { kind: 'hf', items: [cand('m', 300), cand('n', 10)] },
    ]);
    expect(rows.map((r) => r.global)).toEqual([100, 67, 33, 0]);
  });

  it('gives a single row full global heat', () => {
    const rows = rankAll([{ kind: 'gh', items: [cand('only', 10)] }]);
    expect(rows[0].global).toBe(100);
  });

  it('handles an empty category without dividing by zero', () => {
    const rows = rankAll([{ kind: 'gh', items: [] }]);
    expect(rows).toEqual([]);
  });
});

describe('time ranges', () => {
  it('maps each range to its window in days', () => {
    expect(RANGE_DAYS).toEqual({ '24h': 1, '7d': 7, '30d': 30 });
  });
  it('raises the GitHub star floor for older windows', () => {
    expect(GH_STAR_FLOOR['24h']).toBeLessThan(GH_STAR_FLOOR['7d']);
    expect(GH_STAR_FLOOR['7d']).toBeLessThan(GH_STAR_FLOOR['30d']);
  });
  it('uses trendingScore for short windows and likes for 30d', () => {
    expect(hfSortFor('24h')).toBe('trendingScore');
    expect(hfSortFor('7d')).toBe('trendingScore');
    expect(hfSortFor('30d')).toBe('likes');
  });
  it('keeps timestamps inside the window inclusive of the boundary', () => {
    const now = 1_700_000_000_000;
    const day = 86_400_000;
    expect(withinWindow(now - day, 1, now)).toBe(true);
    expect(withinWindow(now - day - 1, 1, now)).toBe(false);
    expect(withinWindow(now - 7 * day, 7, now)).toBe(true);
    expect(withinWindow(now - 7 * day - 1, 7, now)).toBe(false);
  });
});

describe('signalToCand', () => {
  const signal = (id: string, value: number | null): RadarSignal => ({
    id,
    name: id,
    icon: '📡',
    value,
    detail: 'reading',
    href: 'https://www.worldmonitor.app',
  });

  it('maps a numeric signal to a scored candidate', () => {
    expect(signalToCand(signal('fg', 42)).value).toBe(42);
    expect(signalToCand(signal('fg', 42)).metric).toBe('42 / 100');
  });
  it('maps a null-value signal to a zero-score candidate', () => {
    const c = signalToCand(signal('climate', null));
    expect(c.value).toBe(0);
    expect(c.metric).toBe('—');
  });
});

describe('fetchGhStarDelta', () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubFetch = (status: number, body: unknown) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status,
        ok: status >= 200 && status < 300,
        json: async () => body,
      })),
    );
  };

  it('counts WatchEvents in the last 24h, ignoring older stars and other events', async () => {
    const now = Date.now();
    stubFetch(200, [
      { type: 'WatchEvent', created_at: new Date(now - 3_600_000).toISOString(), payload: { action: 'started' } },
      { type: 'WatchEvent', created_at: new Date(now - 25 * 3_600_000).toISOString(), payload: { action: 'started' } },
      { type: 'WatchEvent', created_at: new Date(now - 7_200_000).toISOString(), payload: { action: 'started' } },
      { type: 'PushEvent', created_at: new Date(now - 60_000).toISOString() },
      { type: 'WatchEvent', created_at: new Date(now - 3_600_000).toISOString(), payload: { action: 'unstarted' } },
    ]);
    const { stars, rateLimited } = await fetchGhStarDelta('openai/whisper');
    expect(stars).toBe(2);
    expect(rateLimited).toBe(false);
  });

  it('reports rateLimited on 403/429', async () => {
    stubFetch(403, { message: 'API rate limit exceeded' });
    expect(await fetchGhStarDelta('a/b')).toEqual({ stars: null, rateLimited: true });
    stubFetch(429, { message: 'too many requests' });
    expect(await fetchGhStarDelta('a/b')).toEqual({ stars: null, rateLimited: true });
  });

  it('returns null on non-ok responses without rate limiting', async () => {
    stubFetch(500, {});
    expect(await fetchGhStarDelta('a/b')).toEqual({ stars: null, rateLimited: false });
  });

  it('returns null when the body is not an array', async () => {
    stubFetch(200, { message: 'moved permanently' });
    expect(await fetchGhStarDelta('a/b')).toEqual({ stars: null, rateLimited: false });
  });
});

describe('deltaText', () => {
  it('labels star deltas and HF momentum compactly', () => {
    expect(deltaText({ stars: 43 })).toBe('▲ +43 ★');
    expect(deltaText({ score: 9082 })).toBe('▲ 9.1k score');
  });

  it('returns null when no climb signal is set', () => {
    expect(deltaText({})).toBeNull();
  });
});

describe('climbScore / sortByRisers', () => {
  const row = (id: string, over: Partial<TrendingRow> = {}): TrendingRow => ({
    kind: 'gh',
    id,
    name: id,
    sub: '',
    metric: '',
    value: 1,
    href: null,
    heat: 50,
    global: 40,
    ...over,
  });

  it('prefers star deltas, then HF momentum, then raw trendingScore', () => {
    expect(climbScore(row('a', { delta: { stars: 10 } }))).toBe(10);
    expect(climbScore(row('a', { delta: { score: 500 } }))).toBe(500);
    expect(climbScore(row('a', { kind: 'hf', trendingScore: 300 }))).toBe(300);
    expect(climbScore(row('a'))).toBe(0);
  });

  it('sorts by climb desc, heat as the tiebreak', () => {
    const rows = [
      row('cold', { heat: 90 }),
      row('hot', { delta: { stars: 42 } }),
      row('warm', { delta: { score: 99 }, heat: 80 }),
      row('tie-a', { heat: 70 }),
      row('tie-b', { heat: 95 }),
    ];
    expect(sortByRisers(rows).map((r) => r.id)).toEqual(['warm', 'hot', 'tie-b', 'cold', 'tie-a']);
  });

  it('keeps rows without a climb signal at the bottom by heat', () => {
    const rows = [
      row('low', { heat: 20 }),
      row('high', { heat: 90 }),
    ];
    expect(sortByRisers(rows).map((r) => r.id)).toEqual(['high', 'low']);
  });

  it('does not mutate the input', () => {
    const rows = [row('b', { delta: { stars: 5 } }), row('a', { delta: { stars: 9 } })];
    sortByRisers(rows);
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('matchMovers', () => {
  const row = (kind: TrendingRow['kind'], id: string, name: string): TrendingRow => ({
    kind,
    id,
    name,
    sub: '',
    metric: '',
    value: 1,
    href: null,
    heat: 50,
    global: 40,
  });

  it('matches an entity by canonical name substring', () => {
    const rows = [
      row('gh', 'openai/whisper', 'openai/whisper'),
      row('gh', 'llm-arena', 'llm-arena'),
      row('hf', 'm', 'meta-llama/llama-3'),
    ];
    expect(matchMovers({ name: 'OpenAI' }, rows).map((m) => m.row.id)).toEqual(['openai/whisper']);
  });

  it('matches via aliases (Mistral AI -> mistralai models)', () => {
    const rows = [
      row('hf', 'mistralai/mistral-7b', 'mistralai/mistral-7b'),
      row('gh', 'llm-arena', 'llm-arena'),
    ];
    const matches = matchMovers({ name: 'Mistral AI', aliases: ['mistral'] }, rows);
    expect(matches.map((m) => m.row.id)).toEqual(['mistralai/mistral-7b']);
  });

  it('is case-insensitive and reports the real rank position', () => {
    const rows = [
      row('gh', 'x', 'X-Corp'),
      row('hf', 'openai/gpt-5', 'openai/gpt-5'),
      row('gh', 'y', 'Y-Corp'),
    ];
    const matches = matchMovers({ name: 'GPT-5', aliases: ['gpt-5'] }, rows);
    expect(matches).toHaveLength(1);
    expect(matches[0].rank).toBe(2);
  });

  it('returns matches in ranking order with multiple hits', () => {
    const rows = [
      row('gh', 'meta/llama-1', 'meta/llama-1'),
      row('gh', 'other', 'other'),
      row('hf', 'meta-llama/llama-3', 'meta-llama/llama-3'),
    ];
    const matches = matchMovers({ name: 'Meta', aliases: ['meta ai', 'meta'] }, rows);
    expect(matches.map((m) => m.row.id)).toEqual(['meta/llama-1', 'meta-llama/llama-3']);
    expect(matches.map((m) => m.rank)).toEqual([1, 3]);
  });

  it('returns no matches for entities absent from the ranking', () => {
    expect(matchMovers({ name: 'Jensen Huang', aliases: ['jensen huang'] }, [row('gh', 'a', 'A-Corp')])).toEqual([]);
  });
});

describe('liveSignalCands', () => {
  const signal = (id: string, value: number | null, detail: string): RadarSignal => ({
    id,
    name: id,
    icon: '📡',
    value,
    detail,
    href: 'https://www.worldmonitor.app',
  });

  it('drops pure status rows and keeps real readings', () => {
    const cands = liveSignalCands([
      signal('fg', 55, 'greed'),
      signal('climate', null, 'WorldMonitor API key required'),
      signal('co2', null, 'endpoint unreachable'),
    ]);
    expect(cands.map((c) => c.id)).toEqual(['fg']);
  });
  it('keeps informational rows with a real detail even without a number', () => {
    const cands = liveSignalCands([signal('air', null, 'JFK — Ground Stop')]);
    expect(cands.map((c) => c.id)).toEqual(['air']);
  });
});
