import { describe, expect, it } from 'vitest';
import { fetchHfTrending } from './trending';

describe('HF live data path', () => {
  it('returns real models for the 7d trendingScore window', async () => {
    const rows = await fetchHfTrending('7d');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].name.length).toBeGreaterThan(2);
    expect(rows[0].href).toContain('huggingface.co');
    expect(rows[0].trendingScore).toBeTypeOf('number');
  }, 30000);

  it('returns real models for the 30d likes window too', async () => {
    const rows = await fetchHfTrending('30d');
    expect(rows.length).toBeGreaterThan(0);
  }, 30000);
});
