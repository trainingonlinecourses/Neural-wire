'use client';

import { useCallback, useEffect, useState } from 'react';
import { ago } from '@/lib/utils';
import { formatCountdown } from '@/lib/refresh';
import { useAutoSync } from '@/lib/use-auto-sync';

interface RadarEp {
  id: string;
  icon: string;
  name: string;
  path: string;
}

interface RadarState {
  status: 'wait' | 'live' | 'key' | 'off';
  html: string;
}

const RADAR_EPS: RadarEp[] = [
  { id: 'fg', icon: '📉', name: 'Global Fear & Greed Index', path: '/api/market/v1/get-fear-greed-index' },
  { id: 'climate', icon: '🌦', name: 'Climate Intelligence News', path: '/api/climate/v1/list-climate-news' },
  { id: 'air', icon: '🛫', name: 'Airport Delay Alerts', path: '/api/aviation/v1/list-airport-delays' },
  { id: 'co2', icon: '🧪', name: 'CO₂ / Greenhouse Gas Monitor', path: '/api/climate/v1/get-co2-monitoring' },
];

function deepFind(obj: unknown, pred: (k: string, v: unknown) => boolean, depth = 0, results: { k: string; v: unknown; obj: Record<string, unknown> }[] = []) {
  if (depth > 6 || results.length >= 3 || obj == null || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    obj.slice(0, 8).forEach((v) => deepFind(v, pred, depth + 1, results));
    return results;
  }
  const o = obj as Record<string, unknown>;
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (pred(k, v)) {
      results.push({ k, v, obj: o });
      if (results.length >= 3) return results;
    }
    if (v && typeof v === 'object') deepFind(v, pred, depth + 1, results);
  }
  return results;
}

function jsonPreview(d: unknown): string {
  const s = JSON.stringify(d, null, 1);
  return '<pre class="mono" style="font-size:.62rem;color:var(--mut);white-space:pre-wrap;max-height:180px;overflow:auto">' +
    s.slice(0, 700).replace(/</g, '&lt;') + (s.length > 700 ? '…' : '') + '</pre>';
}

function rFgRender(data: unknown): string {
  const numHits = deepFind(data, (k, v) => /^(value|score|index|fgi)$/i.test(k) && typeof v === 'number');
  const lblHits = deepFind(data, (k, v) => /classification|label|rating/i.test(k) && typeof v === 'string');
  if (numHits.length) {
    const v = numHits[0].v as number;
    const lbl = lblHits.length ? (lblHits[0].v as string) : '—';
    const col = v < 25 ? 'var(--hot-ink)' : v < 50 ? 'var(--warn-ink)' : 'var(--ok-ink)';
    return (
      '<div class="radar-big"><div class="num" style="color:' + col + '">' + v.toFixed(1) + '</div>' +
      '<div class="lab" style="color:' + col + '">' + lbl.toUpperCase().replace(/</g, '&lt;') + '</div>' +
      '<div class="mono" style="font-size:.6rem;color:var(--mut);margin-top:6px">0 = extreme fear · 100 = extreme greed</div></div>'
    );
  }
  return jsonPreview(data);
}

function rClimateRender(data: unknown): string {
  const hit = deepFind(data, (k, v) => k === 'items' && Array.isArray(v) && (v as unknown[]).length > 0)[0];
  const arr = hit ? (hit.v as Record<string, unknown>[]) : null;
  if (!arr) return jsonPreview(data);
  return arr
    .slice(0, 6)
    .map((it) => {
      const t = String(it.title || it.name || '—').replace(/</g, '&lt;');
      const src = String(it.sourceName || it.source || '').replace(/</g, '&lt;');
      const when = it.publishedAt ? ago(new Date(it.publishedAt as number)) : '';
      return '<div class="radar-row"><span>' + t + '<br><span class="l">' + src + (when ? ' · ' + when : '') + '</span></span></div>';
    })
    .join('');
}

function rAirRender(data: unknown): string {
  const hit = deepFind(data, (k, v) => k === 'alerts' && Array.isArray(v) && (v as unknown[]).length > 0)[0];
  const arr = hit ? (hit.v as Record<string, unknown>[]) : null;
  if (!arr) return jsonPreview(data);
  return arr
    .slice(0, 6)
    .map((a) => {
      const city = String(a.city || '').replace(/</g, '&lt;');
      const country = String(a.country || '').replace(/</g, '&lt;');
      const delay = String(a.delayType || '').replace('FLIGHT_DELAY_TYPE_', '').replace(/</g, '&lt;');
      const left = (a.avgDelayMinutes != null ? Math.round(a.avgDelayMinutes as number) + 'm delay' : '') +
        (a.cancelledFlights ? ' · ' + a.cancelledFlights + ' cxl' : '');
      return '<div class="radar-row"><span>' + city + ' ' + country + ' — ' + delay + '</span><span class="l">' + left + '</span></div>';
    })
    .join('');
}

function rCo2Render(data: unknown): string {
  const hit = deepFind(data, (k, v) => k === 'monitoring' && typeof v === 'object')[0];
  const mon = hit ? (hit.v as Record<string, unknown>) : (data as Record<string, unknown>);
  const g = (k: string) => {
    const h = deepFind(mon, (kk, vv) => kk === k && typeof vv === 'number')[0];
    return h ? (h.v as number) : null;
  };
  const ppm = g('currentPpm'), ch4 = g('methanePpb'), mo = g('monthlyAverage'), gr = g('annualGrowthRate');
  if (ppm == null && ch4 == null) return jsonPreview(data);
  return (
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:8px 0">' +
    (ppm != null ? '<div class="stat"><b>' + ppm + '</b>CO₂ ppm</div>' : '') +
    (ch4 != null ? '<div class="stat"><b>' + ch4 + '</b>methane ppb</div>' : '') +
    (mo != null ? '<div class="stat"><b>' + mo + '</b>monthly avg</div>' : '') +
    (gr != null ? '<div class="stat"><b>' + gr + '</b>annual growth</div>' : '') +
    '</div>'
  );
}

const RENDERERS: Record<string, (d: unknown) => string> = {
  fg: rFgRender,
  climate: rClimateRender,
  air: rAirRender,
  co2: rCo2Render,
};

async function fetchWM(path: string, key: string): Promise<{ ok: boolean; needKey?: boolean; status?: number; data?: unknown; err?: string }> {
  const url = 'https://api.worldmonitor.app' + path;
  const opts: RequestInit = { signal: AbortSignal.timeout(12000) };
  if (key) opts.headers = { 'X-WorldMonitor-Key': key };
  try {
    const r = await fetch(url, opts);
    const j = await r.json().catch(() => null);
    if (r.ok && j && !j.error) return { ok: true, data: j };
    if ((j && /key required|unauthenticated|api key/i.test(j.error || '')) || r.status === 401 || r.status === 403)
      return { ok: false, needKey: true };
    return { ok: false, status: r.status };
  } catch (e) {
    return { ok: false, err: (e as Error).message };
  }
}

function keyNeededHTML() {
  return (
    '<div style="font-size:.78rem;color:var(--mut);padding:8px 0">' +
    'This endpoint requires a WorldMonitor API key (header <span class="mono" style="color:var(--cyan-ink)">X-WorldMonitor-Key</span>). ' +
    'Get one at <a href="https://www.worldmonitor.app" target="_blank" rel="noopener" style="color:var(--gold-ink)">worldmonitor.app</a>.</div>'
  );
}

function radarCardHTML(ep: RadarEp, state: RadarState): string {
  const chip =
    state.status === 'wait'
      ? '<span class="rst wait">◌ FETCHING</span>'
      : state.status === 'live'
        ? '<span class="rst live">● LIVE</span>'
        : state.status === 'key'
          ? '<span class="rst key">● API KEY REQUIRED</span>'
          : '<span class="rst off">● OFFLINE</span>';
  return (
    '<div class="card" style="cursor:default">' +
    '<div class="card-body">' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
    '<h3 style="font-size:.92rem">' + ep.icon + ' ' + ep.name.replace(/</g, '&lt;') + '</h3>' +
    '<span style="margin-left:auto">' + chip + '</span>' +
    '</div>' +
    '<div>' + state.html + '</div>' +
    '<div class="card-meta"><span class="mono">api.worldmonitor.app' + ep.path.replace(/</g, '&lt;') + '</span></div>' +
    '</div>' +
    '</div>'
  );
}

const RADAR_REFRESH_SECONDS = 180;

export function RadarView() {
  const [key, setKey] = useState('');
  const [states, setStates] = useState<Record<string, RadarState>>({});
  const [liveCount, setLiveCount] = useState(0);

  /** Re-run all WorldMonitor endpoints and swap in fresh readings. */
  const load = useCallback(async () => {
    const k = (typeof window !== 'undefined' ? window.localStorage.getItem('nw_wmkey') : '') || '';
    setKey(k);
    setStates(Object.fromEntries(RADAR_EPS.map((ep) => [ep.id, { status: 'wait', html: '<div class="sh" style="height:60px"></div>' }])));
    let live = 0;
    await Promise.all(
      RADAR_EPS.map((ep) =>
        fetchWM(ep.path, k).then((res) => {
          let state: RadarState;
          if (res.ok) {
            live++;
            state = { status: 'live', html: RENDERERS[ep.id](res.data) };
          } else if (res.needKey) state = { status: 'key', html: keyNeededHTML() };
          else
            state = {
              status: 'off',
              html:
                '<div style="font-size:.78rem;color:var(--mut);padding:8px 0">Endpoint unreachable (' +
                (res.err || 'HTTP ' + res.status) +
                '). It may require an API key or the server declined the request.</div>',
            };
          setStates((s) => ({ ...s, [ep.id]: state }));
        }),
      ),
    );
    setLiveCount(live);
  }, []);

  // Same countdown loop as the newsroom and /trending: signals re-run in place
  // every 3 minutes without a reload; the deadline self-corrects after tab throttling.
  const { remaining, syncing, sync } = useAutoSync(RADAR_REFRESH_SECONDS, load);

  useEffect(() => {
    sync();
  }, [sync]);

  const applyKey = () => {
    window.localStorage.setItem('nw_wmkey', key.trim());
    sync();
  };

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <input
            className="field"
            placeholder="WorldMonitor API key (optional)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button className="btn primary" onClick={applyKey} disabled={syncing}>
            APPLY & RUN
          </button>
        </div>
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>World Radar — live signals from the open WorldMonitor API · github.com/koala73/worldmonitor</span>
          <span className="meta-right">
            <span className="sync">{syncing ? '⟳ syncing…' : `✓ ${liveCount}/${RADAR_EPS.length} live`}</span>
            <span
              className={'sync-count' + (remaining <= 10 && !syncing ? ' urgent' : '')}
              title="Signals re-run automatically every 3 minutes"
            >
              ⟳ {syncing ? '…' : formatCountdown(remaining)}
            </span>
            <button className="btn sync-btn" onClick={sync} disabled={syncing}>
              SYNC NOW
            </button>
          </span>
        </div>
      </div>
      <div className="wrap grid">
        {RADAR_EPS.map((ep) => (
          <div key={ep.id} dangerouslySetInnerHTML={{ __html: radarCardHTML(ep, states[ep.id] || { status: 'wait', html: '<div class="sh" style="height:60px"></div>' }) }} />
        ))}
      </div>
    </>
  );
}
