import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

interface HFPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  publishedAt: string;
  url: string;
  upvotes: number;
  commentCount: number;
}

/**
 * GET /api/papers — HuggingFace Daily Papers.
 * Fetches the latest ML/AI papers trending on HuggingFace.
 */
export async function GET() {
  try {
    const res = await fetch('https://huggingface.co/api/daily_papers', {
      headers: { 'User-Agent': 'neuralwire/2.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HF ${res.status}`);
    const raw = (await res.json()) as Array<{
      paper?: {
        id?: string;
        title?: string;
        authors?: Array<{ name?: string }>;
        summary?: string;
        publishedAt?: string;
        url?: string;
      };
      upvotes?: number;
      numComments?: number;
    }>;

    const papers: HFPaper[] = (raw || [])
      .filter((p) => p.paper?.id)
      .map((p) => ({
        id: p.paper!.id!,
        title: p.paper!.title || '',
        authors: (p.paper!.authors || []).map((a) => a.name || '').filter(Boolean),
        summary: (p.paper!.summary || '').slice(0, 400),
        publishedAt: p.paper!.publishedAt || new Date().toISOString(),
        url: p.paper!.url || `https://huggingface.co/papers/${p.paper!.id}`,
        upvotes: p.upvotes || 0,
        commentCount: p.numComments || 0,
      }));

    return NextResponse.json({
      papers,
      count: papers.length,
      fetchedAt: Date.now(),
    });
  } catch (e) {
    return NextResponse.json(
      { papers: [], count: 0, error: e instanceof Error ? e.message : String(e), fetchedAt: Date.now() },
      { status: 502 },
    );
  }
}
