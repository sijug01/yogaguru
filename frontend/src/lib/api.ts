/**
 * API client for communicating with the Yoga RAG backend.
 * Now uses Next.js API routes (same domain, /api/ prefix)
 */

// Use relative paths for API calls (same domain/port)
const API_BASE_URL = '/api';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskRequest {
  question: string;
  num_sources?: number;
  conversation_history?: ConversationMessage[];
}

export interface Source {
  content: string;
  source: string;
  chunk_index: number;
  score: number;
}

export interface AskResponse {
  question: string;
  answer: string;
  sources: Source[];
  model: string;
  reasoning?: string;
}

export interface VoiceAskRequest {
  text: string;
  num_sources?: number;
  enable_tts?: boolean;
}

export interface VoiceAskResponse extends AskResponse {
  audio?: string;
  audio_format?: string;
}

/**
 * Ask a question to the Yoga RAG system with optional conversation history.
 */
export async function askQuestion(request: AskRequest): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Ask a question with full conversation context
 */
export async function askQuestionWithContext(
  question: string,
  conversationHistory?: ConversationMessage[],
  numSources: number = 5
): Promise<AskResponse> {
  return askQuestion({
    question,
    num_sources: numSources,
    conversation_history: conversationHistory,
  });
}

/**
 * Ask a question and get voice response.
 */
export async function askVoiceQuestion(
  request: VoiceAskRequest
): Promise<VoiceAskResponse> {
  const response = await fetch(`${API_BASE_URL}/ask-voice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Convert text to speech.
 */
export async function textToSpeech(text: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}/tts?${new URLSearchParams({ text })}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw new Error(`TTS error: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Transcribe audio to text.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');

  const response = await fetch(`${API_BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}

/**
 * Check API health.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
