'use client';

import { useEffect, useState } from 'react';

interface Alert {
  id: string;
  name: string;
  keywords: string[];
  entities: string[];
  topics: string[];
  active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [entities, setEntities] = useState('');
  const [topics, setTopics] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/alerts');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'failed to load alerts');
      setAlerts(json.alerts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Untitled alert',
          keywords: keywords.split(',').map((s) => s.trim()).filter(Boolean),
          entities: entities.split(',').map((s) => s.trim()).filter(Boolean),
          topics: topics.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'failed to create alert');
      setName('');
      setKeywords('');
      setEntities('');
      setTopics('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to create alert');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(alert: Alert) {
    setError(null);
    const res = await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: alert.id, active: !alert.active }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'failed to update alert');
      return;
    }
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, active: json.alert.active } : a)));
  }

  async function removeAlert(id: string) {
    setError(null);
    const res = await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: false }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'failed to update alert');
      return;
    }
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: false } : a)));
  }

  return (
    <div className="alerts">
      <div className="card form-card">
        <h3>Create alert</h3>
        <form onSubmit={createAlert} className="form">
          <div className="field">
            <label htmlFor="alert-name">Name</label>
            <input
              id="alert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GPT-5 rumors"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="alert-keywords">Keywords</label>
            <input
              id="alert-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="comma separated"
            />
          </div>
          <div className="field">
            <label htmlFor="alert-entities">Entities / Models</label>
            <input
              id="alert-entities"
              value={entities}
              onChange={(e) => setEntities(e.target.value)}
              placeholder="e.g. OpenAI, Anthropic"
            />
          </div>
          <div className="field">
            <label htmlFor="alert-topics">Topics</label>
            <input
              id="alert-topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="e.g. safety, reasoning, robotics"
            />
          </div>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Create alert'}
          </button>
        </form>
      </div>

      <div className="card list-card">
        <h3>Your alerts</h3>
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p className="muted">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p className="muted">No alerts yet. Create one above.</p>
        ) : (
          <ul className="alert-list">
            {alerts.map((alert) => (
              <li key={alert.id} className={`alert-item ${alert.active ? 'active' : 'inactive'}`}>
                <div className="alert-main">
                  <strong>{alert.name}</strong>
                  <span className="muted">{alert.active ? 'active' : 'paused'}</span>
                </div>
                <div className="alert-tags">
                  {(alert.keywords || []).map((k) => (
                    <span key={k} className="chip">{k}</span>
                  ))}
                  {(alert.entities || []).map((k) => (
                    <span key={k} className="chip">{k}</span>
                  ))}
                  {(alert.topics || []).map((k) => (
                    <span key={k} className="chip">{k}</span>
                  ))}
                </div>
                <div className="alert-actions">
                  <button className="btn ghost" onClick={() => toggleActive(alert)}>
                    {alert.active ? 'Pause' : 'Resume'}
                  </button>
                  <button className="btn ghost" onClick={() => removeAlert(alert.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
