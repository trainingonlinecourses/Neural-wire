import { NextResponse } from 'next/server';
import { getNewsData } from '@/lib/data';

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'LLMs': ['llm', 'large language model', 'gpt', 'claude', 'gemini', 'llama', 'qwen', 'deepseek', 'mistral', 'phi'],
  'Open Source': ['open source', 'open-source', 'oss', 'github', 'huggingface', 'hugging face', 'ollama', 'apache', 'mit license'],
  'AI Safety': ['safety', 'alignment', 'alignment forum', 'lesswrong', 'responsible ai', 'ethics'],
  'Computer Vision': ['vision', 'image', 'object detection', 'segmentation', 'diffusion', 'stable diffusion', 'dall-e', 'midjourney'],
  'Robotics': ['robot', 'robotics', 'humanoid', 'manipulator', 'autonomous'],
  'AI Chips': ['chip', 'gpu', 'nvidia', 'amd', 'intel', 'tpu', 'asic', 'h100', 'b200', 'blackwell'],
  'AI Agents': ['agent', 'agentic', 'tool use', 'function calling', 'mcp', 'ag2', 'crewai', 'autogpt'],
  'AI Regulation': ['regulation', 'policy', 'eu ai act', 'executive order', 'governance', 'compliance'],
  'AI Medical': ['medical', 'healthcare', 'diagnosis', 'drug discovery', 'protein', 'alphafold', 'clinical'],
  'AI Finance': ['finance', 'trading', 'fintech', 'banking', 'quant', 'quantitative'],
  'Multimodal': ['multimodal', 'vision-language', 'video generation', 'audio', 'speech'],
  'AI Infrastructure': ['infrastructure', 'datacenter', 'cloud', 'serving', 'deployment', 'inference'],
  'AI Training': ['training', 'fine-tuning', 'rlhf', 'dpo', 'pretraining', 'scaling', 'compute'],
  'AI Inference': ['inference', 'serving', 'quantization', 'distillation', 'optimization', 'onnx'],
  'AI Privacy': ['privacy', 'differential privacy', 'federated', 'encryption', 'homomorphic'],
  'AI Education': ['education', 'tutorial', 'course', 'learning', 'mooc', 'teaching'],
};

function classifyStory(title: string, snippet: string): string {
  const text = `${title} ${snippet}`.toLowerCase();
  let bestTopic = 'LLMs';
  let bestScore = 0;
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) { bestScore = score; bestTopic = topic; }
  }
  return bestTopic;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getNewsData();
    const stories = data.stories.slice(0, 200);

    // Classify and score stories
    const classified = stories.map((s) => {
      const topic = classifyStory(s.title, s.description || '');
      return {
        title: s.title,
        url: s.link,
        source: s.sourceId,
        time: '',
        score: s.points || 0,
        topic,
      };
    });

    // Count topics
    const topicCounts: Record<string, number> = {};
    for (const s of classified) {
      topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1;
    }
    // eslint-disable-next-line no-console

    // Build trending topics
    const trending = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => {
        const keywords = TOPIC_KEYWORDS[name] || [];
        return {
          name,
          count,
          trend: 'up' as const,
          keywords: keywords.slice(0, 5),
        };
      });

    // Top stories = highest score + most recent
    const topStories = classified
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    return NextResponse.json({
      topStories,
      trending,
      generated: Date.now(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
