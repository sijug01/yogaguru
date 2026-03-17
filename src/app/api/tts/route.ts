/**
 * GET /api/tts?text=... - Convert text to speech using gTTS
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const text = request.nextUrl.searchParams.get('text');

    if (!text) {
      return NextResponse.json(
        { error: 'text parameter is required' },
        { status: 400 }
      );
    }

    // Note: This requires gTTS Python module to be available
    // For Vercel serverless, we'll use a simpler approach:
    // Call the Google TTS API directly via a cloud service
    // Or use browser-based TTS (Web Speech API)

    // For now, return an error suggesting browser-based TTS
    return NextResponse.json(
      {
        error: 'Use browser Web Speech API for TTS',
        info: 'Implement gTTS wrapper or use browser native TTS',
      },
      { status: 501 }
    );

    // Alternative: Call external TTS service
    // const response = await fetch('https://gtts-api.example.com/tts', {
    //   method: 'POST',
    //   body: JSON.stringify({ text }),
    // });
    // const audioBuffer = await response.arrayBuffer();
    // return new NextResponse(audioBuffer, {
    //   headers: { 'Content-Type': 'audio/mpeg' },
    // });
  } catch (error) {
    console.error('Error in /api/tts:', error);
    return NextResponse.json(
      { error: 'TTS conversion failed', details: String(error) },
      { status: 500 }
    );
  }
}
