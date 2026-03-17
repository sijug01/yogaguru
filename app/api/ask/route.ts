/**
 * POST /api/ask - Ask a question and get an answer from the Yoga RAG system
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAnswer } from '@/lib/chain';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, num_sources } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Generate answer using RAG
    const result = await generateAnswer(
      question,
      num_sources || 5
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/ask:', error);

    // Check if it's a missing index error
    if (
      error instanceof Error &&
      error.message.includes('Index files not found')
    ) {
      return NextResponse.json(
        {
          error: 'Index not found. Run: python -m ingestion.embedder',
          details: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate answer', details: String(error) },
      { status: 500 }
    );
  }
}

// Optional: GET for health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/ask',
    method: 'POST',
    body: { question: 'string', num_sources: 'number (optional)' },
  });
}
