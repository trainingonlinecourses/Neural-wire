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

export function SavedView() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [items, setItems] = useState<Record<string, SavedStory[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

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
      {msg && <div className="wrap"><div className="banner show"><span>{msg}</span></div></div>}
      {err && <div className="wrap"><div className="banner show"><span>{err}</span></div></div>}
    </>
  );
}
