import { describe, expect, it } from 'vitest';
import { gaugePct, sentimentLabel, gaugeBarHTML, rangeBarHTML, offlineNoteHTML, SHAPE_FALLBACK_HTML, updatedMetaHTML } from './radar';

describe('gaugePct', () => {
  it('clamps into 0–100', () => {
    expect(gaugePct(50, 0, 100)).toBe(50);
    expect(gaugePct(150, 0, 100)).toBe(100);
    expect(gaugePct(-10, 0, 100)).toBe(0);
  });

  it('handles non-finite and degenerate ranges', () => {
    expect(gaugePct(Number.NaN, 0, 100)).toBe(0);
    expect(gaugePct(50, 100, 100)).toBe(0); // max <= min
    expect(gaugePct(50, 0, 0)).toBe(0);
  });

  it('maps absolute ranges', () => {
    expect(gaugePct(420, 300, 500)).toBe(60);
    expect(gaugePct(350, 300, 500)).toBe(25);
  });
});

describe('sentimentLabel', () => {
  it('names the bands', () => {
    expect(sentimentLabel(5)).toBe('EXTREME FEAR');
    expect(sentimentLabel(30)).toBe('FEAR');
    expect(sentimentLabel(50)).toBe('NEUTRAL');
    expect(sentimentLabel(70)).toBe('GREED');
    expect(sentimentLabel(95)).toBe('EXTREME GREED');
  });
});

describe('gaugeBarHTML', () => {
  it('positions the marker at the clamped percentage', () => {
    expect(gaugeBarHTML(75)).toContain('left:75%');
    expect(gaugeBarHTML(200)).toContain('left:100%');
    expect(gaugeBarHTML(-5)).toContain('left:0%');
  });

  it('is motion-free and carries an accessible label', () => {
    const html = gaugeBarHTML(42);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Signal level 42 out of 100"');
    expect(html).not.toContain('animation');
  });
});

describe('rangeBarHTML', () => {
  it('places the reference band and marker', () => {
    const html = rangeBarHTML(420, 300, 500, 350, 450);
    expect(html).toContain('left:60%'); // marker at 420
    expect(html).toContain('left:25%'); // band starts at 350
    expect(html).toContain('width:50%'); // band spans 350–450
  });

  it('clamps the band', () => {
    const html = rangeBarHTML(1000, 0, 1000, 500, 2000);
    expect(html).toContain('left:100%');
    expect(html).toContain('width:50%'); // band 500–1000 = 50%
  });
});

describe('offlineNoteHTML', () => {
  it('never embeds raw error text', () => {
    const note = offlineNoteHTML(false);
    expect(note).not.toContain('Failed to fetch');
    expect(note).not.toContain('HTTP ');
    expect(note).not.toContain('{');
    expect(note).toContain('SOURCE OFFLINE');
    expect(note).toContain('retry');
  });

  it('offers the key path only when the cause is a missing key', () => {
    const note = offlineNoteHTML(true);
    expect(note).toContain('API KEY REQUIRED');
    expect(note).toContain('APPLY');
    expect(note).toContain('worldmonitor.app');
  });
});

describe('SHAPE_FALLBACK_HTML', () => {
  it('is clean and generic', () => {
    expect(SHAPE_FALLBACK_HTML).toContain('DATA UNAVAILABLE');
    expect(SHAPE_FALLBACK_HTML).not.toContain('{');
    expect(SHAPE_FALLBACK_HTML).not.toContain('json');
  });
});

describe('updatedMetaHTML', () => {
  it('formats a timestamp and stays empty without one', () => {
    expect(updatedMetaHTML(null)).toBe('');
    expect(updatedMetaHTML(0)).toBe('');
    const ts = new Date(2026, 7, 15, 9, 5).getTime();
    expect(updatedMetaHTML(ts)).toMatch(/^last updated \d{2}:\d{2}$/);
  });
});
