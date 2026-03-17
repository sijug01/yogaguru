/**
 * RAG chain - Agentic RAG with conversation memory
 * LLM decides when/how to query the knowledge base
 * Maintains context across multiple turns
 */

import { agentRAG, simpleRAG } from './agent';
import { SearchResult } from './retriever';
import { ConversationMessage } from './conversation';

export interface RAGResponse {
  question: string;
  answer: string;
  sources: SearchResult[];
  model: string;
  reasoning?: string;
}

/**
 * Generate answer using Agentic RAG with conversation history
 * LLM decides if it needs to search the knowledge base
 * Automatically removes markdown formatting
 * Maintains context from previous messages
 */
export async function generateAnswer(
  question: string,
  numSources: number = 5,
  conversationHistory?: ConversationMessage[]
): Promise<RAGResponse> {
  // Use agentic RAG - LLM decides when to search
  // Pass conversation history for context awareness
  const agentResult = await agentRAG(question, conversationHistory, 3);

  return {
    question: agentResult.question,
    answer: agentResult.answer,
    sources: agentResult.sources,
    model: agentResult.model,
    reasoning: agentResult.reasoning,
  };
}

/**
 * Alternative: Simple RAG (always retrieves) with conversation history
 * Can be used for comparison or specific use cases
 */
export async function generateAnswerSimple(
  question: string,
  numSources: number = 5,
  conversationHistory?: ConversationMessage[]
): Promise<RAGResponse> {
  const result = await simpleRAG(question, conversationHistory, numSources);

  return {
    question: result.question,
    answer: result.answer,
    sources: result.sources,
    model: result.model,
    reasoning: result.reasoning,
  };
}

