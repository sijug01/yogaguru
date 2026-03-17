/**
 * RAG chain for generating answers with Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { retrieveDocuments, SearchResult } from './retriever';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.LLM_MODEL || 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are a knowledgeable and compassionate yoga instructor assistant.
Answer the user's question about yoga using ONLY the provided context information.

Guidelines:
- Be helpful, clear, and encouraging
- Always mention safety considerations when relevant
- If the answer involves a pose, provide clear, step-by-step instructions
- If the query mentions health concerns, remind them to consult a healthcare provider
- If the question cannot be answered from the provided context, say so clearly
- Cite which yoga poses or concepts you're referring to`;

export interface RAGResponse {
  question: string;
  answer: string;
  sources: SearchResult[];
  model: string;
}

/**
 * Generate answer using RAG (Retrieval-Augmented Generation)
 */
export async function generateAnswer(
  question: string,
  numSources: number = 5
): Promise<RAGResponse> {
  // Retrieve relevant documents
  const sources = await retrieveDocuments(question, numSources);

  // Format context from retrieved documents
  const context = sources
    .map((source, idx) => `[Source ${idx + 1}]\n${source.content}`)
    .join('\n\n---\n\n');

  // Create prompt
  const userPrompt = `Context from yoga knowledge base:
${context}

Question: ${question}

Answer:`;

  // Call Claude API
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // Extract answer
  const answer =
    message.content[0].type === 'text' ? message.content[0].text : '';

  return {
    question,
    answer,
    sources,
    model: MODEL,
  };
}

/**
 * Generate answer with streaming (for real-time UI updates)
 */
export async function generateAnswerStream(
  question: string,
  numSources: number = 5
) {
  // Retrieve relevant documents
  const sources = await retrieveDocuments(question, numSources);

  // Format context
  const context = sources
    .map((source, idx) => `[Source ${idx + 1}]\n${source.content}`)
    .join('\n\n---\n\n');

  // Create prompt
  const userPrompt = `Context from yoga knowledge base:
${context}

Question: ${question}

Answer:`;

  // Stream response
  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  return { stream, sources };
}
