/**
 * Conversation management - Maintains context and memory for multi-turn conversations
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string | any[];
}

export interface ConversationContext {
  messages: ConversationMessage[];
  maxMessages?: number;
}

/**
 * Create a new conversation context
 */
export function createConversation(): ConversationContext {
  return {
    messages: [],
    maxMessages: 20, // Keep last 20 messages for context
  };
}

/**
 * Add a message to the conversation
 */
export function addMessage(
  context: ConversationContext,
  role: 'user' | 'assistant',
  content: string | any[]
): void {
  context.messages.push({ role, content });

  // Trim old messages if exceeding limit
  if (context.maxMessages && context.messages.length > context.maxMessages) {
    context.messages = context.messages.slice(-context.maxMessages);
  }
}

/**
 * Get conversation summary for context
 * Extracts key information from conversation history
 */
export function getConversationSummary(context: ConversationContext): string {
  if (context.messages.length === 0) {
    return 'This is the start of the conversation.';
  }

  // Get last 5 exchanges for context
  const recentMessages = context.messages.slice(-10);

  const summary = recentMessages
    .map((msg) => {
      const content =
        typeof msg.content === 'string'
          ? msg.content
          : msg.content
              .map((block) => {
                if ('type' in block && block.type === 'text' && 'text' in block) {
                  return block.text;
                }
                return '';
              })
              .join(' ');

      return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${content.substring(0, 200)}...`;
    })
    .join('\n\n');

  return summary;
}

/**
 * Convert conversation context to Claude messages format
 */
export function contextToMessages(
  context: ConversationContext
): Anthropic.MessageParam[] {
  return context.messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Format conversation history for display
 */
export function formatConversationHistory(context: ConversationContext): string {
  return context.messages
    .map((msg) => {
      const content =
        typeof msg.content === 'string'
          ? msg.content
          : msg.content
              .map((block) => {
                if ('type' in block && block.type === 'text' && 'text' in block) {
                  return block.text;
                }
                return '';
              })
              .join('');

      return `${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}: ${content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Clear conversation history
 */
export function clearConversation(context: ConversationContext): void {
  context.messages = [];
}

/**
 * Get last N messages
 */
export function getLastMessages(
  context: ConversationContext,
  n: number = 5
): ConversationMessage[] {
  return context.messages.slice(-n);
}

/**
 * Check if conversation is empty
 */
export function isConversationEmpty(context: ConversationContext): boolean {
  return context.messages.length === 0;
}

/**
 * Get message count
 */
export function getMessageCount(context: ConversationContext): number {
  return context.messages.length;
}
