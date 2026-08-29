'use client';

import { useState } from 'react';

interface Provider {
  name: string;
  slug: string;
  color: string;
  description: string;
  url: string;
  models: string[];
  category: 'frontier' | 'open-source' | 'infrastructure' | 'research' | 'emerging';
  status: 'active' | 'new' | 'established';
}

const PROVIDERS: Provider[] = [
  // Frontier labs
  { name: 'OpenAI', slug: 'openai', color: '#10a37f', description: 'GPT series, DALL-E, Sora, Codex. Leading frontier AI lab.', url: 'https://openai.com', models: ['GPT-5.1', 'GPT-5', 'GPT-4o', 'o3', 'o4-mini'], category: 'frontier', status: 'established' },
  { name: 'Anthropic', slug: 'anthropic', color: '#d97706', description: 'Claude series. Focus on AI safety and helpfulness.', url: 'https://anthropic.com', models: ['Claude Opus 4.7', 'Claude Sonnet 4.5', 'Claude Opus 4.5', 'Claude Haiku'], category: 'frontier', status: 'established' },
  { name: 'Google DeepMind', slug: 'deepmind', color: '#7c6cf0', description: 'Gemini series, AlphaFold, reinforcement learning.', url: 'https://deepmind.google', models: ['Gemini 3.5 Pro', 'Gemini 3 Pro', 'Gemma 3 27B'], category: 'frontier', status: 'established' },
  { name: 'xAI', slug: 'xai', color: '#6366f1', description: 'Grok series. Real-time knowledge from X/Twitter.', url: 'https://x.ai', models: ['Grok 4', 'Grok 3'], category: 'frontier', status: 'new' },
  { name: 'Meta AI', slug: 'meta', color: '#1877f2', description: 'Llama series. Open-source frontier models.', url: 'https://ai.meta.com', models: ['Llama 4 Maverick', 'Llama 4 Scout', 'Llama 3.3'], category: 'open-source', status: 'established' },
  { name: 'Mistral AI', slug: 'mistral', color: '#ff7000', description: 'European AI lab. Mistral, Mixtral, Pixtral series.', url: 'https://mistral.ai', models: ['Mistral Large 3', 'Mistral Small 3.1', 'Codestral'], category: 'frontier', status: 'established' },
  { name: 'DeepSeek', slug: 'deepseek', color: '#3b82f6', description: 'Chinese AI lab. Open-weight frontier models.', url: 'https://deepseek.com', models: ['DeepSeek-V4', 'DeepSeek-R1'], category: 'open-source', status: 'new' },
  { name: 'Alibaba / Qwen', slug: 'alibaba', color: '#ff6a00', description: 'Qwen series. Open-weight multilingual models.', url: 'https://qwenlm.github.io', models: ['Qwen3.8-72B', 'Qwen3-235B', 'Qwen3-30B'], category: 'open-source', status: 'active' },
  { name: 'Cohere', slug: 'cohere', color: '#39594D', description: 'Enterprise AI. Command R series for RAG and agents.', url: 'https://cohere.com', models: ['Command A', 'Command R+'], category: 'frontier', status: 'established' },
  { name: 'Moonshot / Kimi', slug: 'moonshot', color: '#8b5cf6', description: 'Chinese AI lab. Long-context Kimi models.', url: 'https://moonshot.ai', models: ['Kimi K2'], category: 'emerging', status: 'new' },
  { name: 'Zhipu AI', slug: 'zhipu', color: '#ef4444', description: 'Chinese AI lab. GLM series.', url: 'https://zhipuai.cn', models: ['GLM-5', 'GLM-4.6', 'GLM-4.5'], category: 'emerging', status: 'new' },
  { name: 'MiniMax', slug: 'minimax', color: '#ec4899', description: 'Chinese AI lab. M1 long-context models.', url: 'https://minimaxi.com', models: ['M1-80K', 'M1-40K'], category: 'emerging', status: 'new' },
  { name: 'ByteDance', slug: 'bytedance', color: '#000000', description: 'TikTok parent. Doubao AI models.', url: 'https://www.volcengine.com', models: ['Doubao-Seed-1.6'], category: 'emerging', status: 'new' },

  // Open-source / community
  { name: 'Hugging Face', slug: 'huggingface', color: '#ffd21e', description: 'Open-source AI hub. Models, datasets, spaces.', url: 'https://huggingface.co', models: [], category: 'open-source', status: 'established' },
  { name: 'Ollama', slug: 'ollama', color: '#ffffff', description: 'Local LLM runner. Run any model on your machine.', url: 'https://ollama.com', models: [], category: 'open-source', status: 'active' },
  { name: 'LangChain', slug: 'langchain', color: '#22c55e', description: 'Framework for building LLM applications.', url: 'https://langchain.com', models: [], category: 'infrastructure', status: 'established' },
  { name: 'LlamaIndex', slug: 'llamaindex', color: '#6366f1', description: 'Data framework for LLM applications.', url: 'https://llamaindex.ai', models: [], category: 'infrastructure', status: 'established' },
  { name: 'vLLM', slug: 'vllm', color: '#3b82f6', description: 'High-throughput LLM serving engine.', url: 'https://vllm.ai', models: [], category: 'infrastructure', status: 'active' },
  { name: 'llama.cpp', slug: 'llamacpp', color: '#06b6d4', description: 'Local LLM inference in C/C++.', url: 'https://github.com/ggerganov/llama.cpp', models: [], category: 'infrastructure', status: 'active' },
  { name: 'ComfyUI', slug: 'comfyui', color: '#22c55e', description: 'Node-based Stable Diffusion GUI.', url: 'https://github.com/comfyanonymous/ComfyUI', models: [], category: 'infrastructure', status: 'active' },
  { name: 'Automatic1111', slug: 'a1111', color: '#d946ef', description: 'Stable Diffusion WebUI.', url: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui', models: [], category: 'infrastructure', status: 'active' },

  // Infrastructure
  { name: 'Together AI', slug: 'together', color: '#f97316', description: 'AI cloud platform. Fine-tuning and inference.', url: 'https://together.ai', models: [], category: 'infrastructure', status: 'active' },
  { name: 'Groq', slug: 'groq', color: '#f97316', description: 'Ultra-fast LLM inference on LPU.', url: 'https://groq.com', models: [], category: 'infrastructure', status: 'active' },
  { name: 'Replicate', slug: 'replicate', color: '#6366f1', description: 'Run ML models in the cloud via API.', url: 'https://replicate.com', models: [], category: 'infrastructure', status: 'active' },
  { name: 'Modal', slug: 'modal', color: '#6366f1', description: 'Cloud GPU platform for AI workloads.', url: 'https://modal.com', models: [], category: 'infrastructure', status: 'active' },
  { name: 'RunPod', slug: 'runpod', color: '#7c3aed', description: 'GPU cloud for AI training and inference.', url: 'https://runpod.io', models: [], category: 'infrastructure', status: 'active' },
  { name: 'NVIDIA', slug: 'nvidia', color: '#76b900', description: 'GPU maker. CUDA, TensorRT, NeMo.', url: 'https://nvidia.com', models: [], category: 'infrastructure', status: 'established' },

  // Research
  { name: 'Stanford HAI', slug: 'stanford', color: '#8b1a1a', description: 'Stanford Institute for Human-Centered AI.', url: 'https://hai.stanford.edu', models: [], category: 'research', status: 'established' },
  { name: 'MIT CSAIL', slug: 'mit', color: '#a31f34', description: 'MIT Computer Science and AI Lab.', url: 'https://csail.mit.edu', models: [], category: 'research', status: 'established' },
  { name: 'Allen AI (AI2)', slug: 'ai2', color: '#2563eb', description: 'Non-profit AI research. OLMo open models.', url: 'https://allenai.org', models: ['OLMo 2'], category: 'research', status: 'active' },
  { name: 'EleutherAI', slug: 'eleutherai', color: '#3b82f6', description: 'Open-source AI research collective.', url: 'https://eleuther.ai', models: ['GPT-NeoX', 'Pythia'], category: 'research', status: 'active' },
];

const CATEGORY_LABELS: Record<string, string> = {
  'frontier': '🏢 Frontier Labs',
  'open-source': '🔓 Open Source',
  'infrastructure': '⚙️ Infrastructure',
  'research': '🔬 Research',
  'emerging': '🚀 Emerging',
};

const CATEGORY_ORDER = ['frontier', 'open-source', 'infrastructure', 'research', 'emerging'];

export function ProviderDirectoryView() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = PROVIDERS.filter((p) => {
    if (filter !== 'all' && p.category !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.models.some((m) => m.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const grouped = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      providers: filtered.filter((p) => p.category === cat),
    }))
    .filter((g) => g.providers.length > 0);

  return (
    <>
      <div className="wrap">
        <div className="searchbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search providers or models…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="seg">
            <button className={`seg-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
              ALL · {PROVIDERS.length}
            </button>
            {CATEGORY_ORDER.map((cat) => {
              const count = PROVIDERS.filter((p) => p.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  className={`seg-btn${filter === cat ? ' active' : ''}`}
                  onClick={() => setFilter(cat)}
                >
                  {CATEGORY_LABELS[cat]?.split(' ')[0]} {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {grouped.map((g) => (
        <div key={g.category} className="wrap" style={{ marginBottom: 24 }}>
          <div className="section-note">{g.label} · {g.providers.length}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {g.providers.map((p) => (
              <a
                key={p.slug}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                    padding: '18px 20px',
                    background: 'var(--card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    transition: '0.25s',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = p.color + '80';
                    e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.4), 0 0 20px ${p.color}15`;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: 11,
                        display: 'grid', placeItems: 'center',
                        background: p.color + '20', border: `1px solid ${p.color}40`,
                        fontFamily: 'var(--font-mono), monospace', fontWeight: 700,
                        fontSize: '0.85rem', color: p.color, flex: 'none',
                      }}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                      <div style={{
                        fontFamily: 'var(--font-mono), monospace', fontSize: '0.56rem',
                        color: p.status === 'new' ? 'var(--ok-ink)' : p.status === 'active' ? 'var(--cyan-ink)' : 'var(--mut)',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>
                        {p.status === 'new' ? '● NEW' : p.status === 'active' ? '● ACTIVE' : '● ESTABLISHED'}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--mut)', lineHeight: 1.5 }}>
                    {p.description}
                  </p>
                  {p.models.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {p.models.map((m) => (
                        <span
                          key={m}
                          style={{
                            fontFamily: 'var(--font-mono), monospace', fontSize: '0.56rem',
                            padding: '3px 8px', borderRadius: 999,
                            border: `1px solid ${p.color}40`, color: p.color,
                            background: p.color + '10',
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
