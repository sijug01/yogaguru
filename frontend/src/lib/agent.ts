/**
 * Agentic RAG with Conversation Memory
 * LLM decides when to search knowledge base, maintains conversation context
 * Uses Claude's tool_use feature for intelligent retrieval
 */

import Anthropic from '@anthropic-ai/sdk';
import { retrieveDocuments, SearchResult } from './retriever';
import { cleanResponse } from './cleaner';
import { ConversationMessage, contextToMessages } from './conversation';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.LLM_MODEL || 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are an intelligent and compassionate yoga instructor assistant with memory of our conversation.

Your role is to:
1. Understand yoga-related questions, considering the conversation history
2. Reference previous discussions when relevant to provide continuity
3. Decide if you need to search the yoga knowledge base for information
4. If needed, use the search_yoga_knowledge_base tool to retrieve relevant information
5. Provide clear, helpful answers based on retrieved information and conversation context
6. Always mention safety considerations when relevant
7. If the question is outside yoga topics or cannot be answered, explain clearly

Guidelines:
- Be helpful, clear, and encouraging
- Provide step-by-step instructions for poses
- Always remind users to consult healthcare providers for health concerns
- Remove any markdown formatting from your final answer (no #, **, *, etc.)
- Keep responses clear and easy to read
- Cite the yoga concepts and poses you're referring to
- Reference previous discussion points when they're relevant to the current question
- Build on previous answers rather than repeating information`;

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: {
    query: string;
    num_results?: number;
  };
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface AgentResponse {
  question: string;
  answer: string;
  sources: SearchResult[];
  reasoning: string;
  model: string;
}

/**
 * Execute agentic RAG loop with conversation memory
 * LLM decides if/when to use the search tool
 * Maintains context across multiple turns
 */
export async function agentRAG(
  question: string,
  conversationHistory?: ConversationMessage[],
  maxTools: number = 3
): Promise<AgentResponse> {
  // Define the search tool for Claude
  const tools: Anthropic.Tool[] = [
    {
      name: 'search_yoga_knowledge_base',
      description:
        'Search the yoga knowledge base for information about poses, breathing techniques, benefits, and yoga philosophy. Use this when you need specific information from the knowledge base to answer the user question.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string',
            description:
              'Search query to find relevant yoga information (e.g., "Tadasana benefits", "breathing techniques", "warrior pose variations")',
          },
          num_results: {
            type: 'number',
            description: 'Number of results to retrieve (1-10, default 5)',
          },
        },
        required: ['query'],
      },
    },
  ];

  // Initialize messages with conversation history
  let messages: Anthropic.MessageParam[] = [];

  // Add conversation history if provided
  if (conversationHistory && conversationHistory.length > 0) {
    messages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  // Add the new question
  messages.push({
    role: 'user',
    content: question,
  });

  let sources: SearchResult[] = [];
  let reasoning = '';
  let toolCallCount = 0;
  let finalAnswer = '';

  // Agentic loop
  for (let iteration = 0; iteration < maxTools + 1; iteration++) {
    // Call Claude with tools
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: tools,
      messages: messages,
    });

    // Check if we got tool calls
    if (response.stop_reason === 'tool_use') {
      // Find tool use blocks in the response
      const toolUseBlocks = response.content.filter(
        (block) => block.type === 'tool_use'
      ) as unknown as ToolUseBlock[];

      if (toolUseBlocks.length === 0) break;

      // Add assistant's response to messages
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      // Process each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolCall of toolUseBlocks) {
        if (toolCall.name === 'search_yoga_knowledge_base') {
          toolCallCount++;
          const searchQuery = toolCall.input.query;
          const numResults = toolCall.input.num_results || 5;

          // Search knowledge base
          const searchResults = await retrieveDocuments(searchQuery, numResults);
          sources.push(...searchResults);

          // Format search results for Claude
          const formattedResults = searchResults
            .map(
              (result, idx) =>
                `[Result ${idx + 1}]\nContent: ${result.content}\nSource: ${result.source}`
            )
            .join('\n\n');

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: formattedResults,
          });

          reasoning += `Searched for: "${searchQuery}". Found ${searchResults.length} relevant results. `;
        }
      }

      // Add tool results to messages
      if (toolResults.length > 0) {
        messages.push({
          role: 'user',
          content: toolResults,
        });
      }
    } else if (response.stop_reason === 'end_turn') {
      // LLM finished - extract final answer
      const textBlocks = response.content.filter(
        (block) => block.type === 'text'
      ) as unknown as TextBlock[];

      if (textBlocks.length > 0) {
        finalAnswer = textBlocks[0].text;

        // Extract reasoning from assistant's thinking
        const textContent = textBlocks
          .map((block) => block.text)
          .join('\n');

        if (toolCallCount === 0) {
          reasoning = 'Answered from general knowledge without searching the knowledge base.';
        } else {
          reasoning += `Retrieved and processed ${sources.length} sources in ${toolCallCount} search(es).`;
        }
      }
      break;
    } else {
      // Unexpected stop reason
      break;
    }
  }

  // Remove duplicates from sources
  const uniqueSources = Array.from(
    new Map(sources.map((s) => [s.source + s.chunk_index, s])).values()
  );

  // Clean the response (remove markdown)
  const cleanedAnswer = cleanResponse(finalAnswer);

  return {
    question,
    answer: cleanedAnswer,
    sources: uniqueSources,
    reasoning,
    model: MODEL,
  };
}

/**
 * Simple non-agentic RAG for comparison (if needed)
 * Always retrieves documents without LLM decision-making
 * Supports conversation history
 */
export async function simpleRAG(
  question: string,
  conversationHistory?: ConversationMessage[],
  numSources: number = 5
): Promise<AgentResponse> {
  // Always retrieve
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

  // Build messages with conversation history
  let messages: Anthropic.MessageParam[] = [];

  if (conversationHistory && conversationHistory.length > 0) {
    messages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  messages.push({
    role: 'user',
    content: userPrompt,
  });

  // Call Claude
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: messages,
  });

  // Extract answer
  const textBlock = message.content.find((block) => block.type === 'text');
  const answer =
    textBlock && textBlock.type === 'text' ? textBlock.text : '';

  const cleanedAnswer = cleanResponse(answer);

  return {
    question,
    answer: cleanedAnswer,
    sources,
    reasoning: 'Simple RAG - always retrieved top documents',
    model: MODEL,
  };
}
