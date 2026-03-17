/**
 * GET /api/health - Health check endpoint
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Yoga RAG API is running',
    timestamp: new Date().toISOString(),
  });
}
