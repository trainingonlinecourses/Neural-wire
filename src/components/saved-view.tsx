'use client';

import { useCallback, useEffect, useState } from 'react';
import { ago } from '@/lib/utils';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

interface SavedStory {
  id: string;
  title: string;
  link: string;
  description?: string | null;
  published_at?: string;
  source_id?: string;
}

interface HistoryItem {
  id: string;
  title: string;
  link: string;
  sourceId: string;
  at: number;
}

const HISTORY_KEY = 'nw_history';
const MAX_HISTORY = 20;

function loadHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is HistoryItem => Boolean((x as HistoryItem).title && (x as HistoryItem).link))
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function SavedView() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [items, setItems] = useState<Record<string, SavedStory[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/collections');
      const j = await r.json();
      setCollections(j.collections || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    setHistory(loadHistory());
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (!name.trim()) return;
    const r = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    const j = await r.json();
    if (!r.ok) return setErr(j.error || 'request failed');
    setMsg(`Collection "${j.collection.name}" created`);
    setName('');
    load();
  }

  async function openCollection(id: string) {
    setOpen(open === id ? null : id);
    if (open !== id && !items[id]) {
      const r = await fetch('/api/collections/' + id + '/items');
      const j = await r.json();
      setItems((m) => ({ ...m, [id]: j.items || [] }));
    }
  }

  async function removeItem(collId: string, storyId: string) {
    await fetch('/api/collections/' + collId + '/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story_id: storyId }),
    });
    setItems((m) => ({ ...m, [collId]: (m[collId] || []).filter((s) => s.id !== storyId) }));
  }

  if (loading) return <div className="wrap"><p className="empty">Loading saved collections…</p></div>;

  return (
    <>
      <div className="wrap">
        <form className="searchbar" onSubmit={create}>
          <input
            className="field"
            placeholder="New collection name — e.g. LLM Papers, Agents, VC Roundups"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn primary" type="submit">
            + CREATE
          </button>
        </form>
      </div>
      <div className="wrap grid">
        {collections.map((c) => (
          <div key={c.id} className="card">
            <div className="card-body">
              <button className="coll-head" onClick={() => openCollection(c.id)}>
                <h3 style={{ fontSize: '.95rem', color: 'var(--cyan-ink)' }}>📁 {c.name}</h3>
                <span className="dim">{open === c.id ? '−' : '+ ' + (items[c.id]?.length ?? 0) + ' saved'}</span>
              </button>
              {c.description && <p className="dim">{c.description}</p>}
              {open === c.id && (
                <div className="timeline">
                  {(items[c.id] || []).length === 0 && <p className="dim">Empty collection.</p>}
                  {(items[c.id] || []).map((s) => (
                    <div key={s.id} className="tl-row">
                      <a href={s.link} target="_blank" rel="noopener noreferrer">
                        {s.title}
                      </a>
                      <span className="l">
                        {s.published_at ? ago(new Date(s.published_at)) : ''}
                        <button className="x" onClick={() => removeItem(c.id, s.id)} title="Remove">
                          ✕
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="card-meta">
                <span>created {ago(new Date(c.created_at))}</span>
                {c.is_public ? <span className="dim">public</span> : <span className="dim">private</span>}
              </div>
            </div>
          </div>
        ))}
        {collections.length === 0 && (
          <p className="empty">
            <b>No collections yet.</b> Create one to save stories you want to come back to.
          </p>
        )}
      </div>
      <div className="wrap">
        <div className="meta-row">
          <span>💾 RECENTLY READ — last {history.length} stories you opened, remembered on this device</span>
          <span className="meta-right">
            {history.length > 0 && (
              <button
                className="btn sync-btn"
                onClick={() => {
                  setHistory([]);
                  try {
                    window.localStorage.removeItem(HISTORY_KEY);
                  } catch {
                    /* storage unavailable */
                  }
                }}
              >
                CLEAR HISTORY
              </button>
            )}
          </span>
        </div>
        {history.length === 0 ? (
          <p className="empty">Stories you open across the desk show up here automatically.</p>
        ) : (
          <div className="timeline">
            {history.map((h) => (
              <div key={h.id + h.at} className="tl-row">
                <a href={h.link} target="_blank" rel="noopener noreferrer">
                  {h.title}
                </a>
                <span className="l">{ago(new Date(h.at))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {msg && <div className="wrap"><div className="banner show"><span>{msg}</span></div></div>}
      {err && <div className="wrap"><div className="banner show"><span>{err}</span></div></div>}
    </>
  );
}
