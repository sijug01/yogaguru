/**
 * POST /api/transcribe - Transcribe audio to text using Whisper
 * Note: For serverless, use browser Web Speech API instead
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Note: Whisper would require Python subprocess on serverless
    // which is not ideal for Vercel. Instead, recommend:
    // 1. Use browser Web Speech API (free, native)
    // 2. Use external transcription service (OpenAI, AssemblyAI, etc.)

    return NextResponse.json(
      {
        error: 'Use browser Web Speech API for STT',
        info: 'Implement external transcription service (OpenAI Whisper API, AssemblyAI, etc.)',
      },
      { status: 501 }
    );

    // Alternative: Call OpenAI Whisper API
    // const audioBuffer = await audioFile.arrayBuffer();
    // const whisperFormData = new FormData();
    // whisperFormData.append('file', new Blob([audioBuffer]), 'audio.wav');
    // whisperFormData.append('model', 'whisper-1');
    // const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    //   body: whisperFormData,
    // });
    // const data = await response.json();
    // return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('Error in /api/transcribe:', error);
    return NextResponse.json(
      { error: 'Transcription failed', details: String(error) },
      { status: 500 }
    );
  }
}
