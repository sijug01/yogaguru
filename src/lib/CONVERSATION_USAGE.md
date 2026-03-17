# Conversation Memory - Usage Guide

The Yoga RAG app now supports multi-turn conversations with full context awareness. The LLM remembers previous questions and answers, allowing for natural follow-up questions and continuity.

## Architecture

### Files Created/Modified

- **`src/lib/conversation.ts`** - Conversation management utilities
- **`src/lib/agent.ts`** - Updated to accept conversation history
- **`src/lib/chain.ts`** - Updated to pass history to agent
- **`src/app/api/ask/route.ts`** - Updated to accept history in request
- **`src/lib/api.ts`** - Updated with conversation support

## How It Works

### Flow

```
User Question 1
  ↓
Agentic RAG processes
  ↓
Agent adds answer to history
  ↓
User Question 2 (follow-up)
  ↓
Agentic RAG processes with full history
  ↓
LLM understands context from Question 1
  ↓
Returns contextual answer
```

## Frontend Integration

### 1. Basic Setup in React Component

```typescript
import { createConversation, addMessage } from '@/lib/conversation';
import { askQuestion } from '@/lib/api';

// In your component
const [conversation, setConversation] = useState(createConversation());

// When user asks a question
async function handleAskQuestion(userQuestion: string) {
  try {
    // Add user message to conversation
    addMessage(conversation, 'user', userQuestion);
    setConversation({ ...conversation });

    // Call API with conversation history
    const response = await askQuestion({
      question: userQuestion,
      conversation_history: conversation.messages.map((msg) => ({
        role: msg.role,
        content:
          typeof msg.content === 'string'
            ? msg.content
            : msg.content.map((block) => (block as any).text).join(''),
      })),
    });

    // Add assistant response to conversation
    addMessage(conversation, 'assistant', response.answer);
    setConversation({ ...conversation });

    // Display response to user
    displayAnswer(response);
  } catch (error) {
    console.error('Error asking question:', error);
  }
}
```

### 2. Alternative: Using Helper Function

```typescript
import { askQuestionWithContext, ConversationMessage } from '@/lib/api';

const response = await askQuestionWithContext(
  userQuestion,
  conversation.messages as ConversationMessage[],
  5 // num_sources
);
```

### 3. Conversation Management

```typescript
import {
  createConversation,
  addMessage,
  getConversationSummary,
  clearConversation,
  formatConversationHistory,
  getMessageCount,
} from '@/lib/conversation';

// Create new conversation
const conv = createConversation();

// Add messages
addMessage(conv, 'user', 'What is Tadasana?');
addMessage(conv, 'assistant', 'Tadasana is...');

// Get context summary for display
const summary = getConversationSummary(conv);

// Format for display
const formatted = formatConversationHistory(conv);

// Get stats
const messageCount = getMessageCount(conv);

// Clear when needed
clearConversation(conv);
```

## Example: Multi-Turn Conversation

### Turn 1
```
User: "What is Tadasana?"
Agent: Searches KB → Summarizes → Returns answer about Mountain Pose
[Agent added to history]
```

### Turn 2
```
User: "What are its benefits?"
Agent: Sees previous discussion about Tadasana
       Understands context (no need to search for "its" = Tadasana's benefits)
       Provides specific benefits based on knowledge base
[Both previous exchange + new answer added to history]
```

### Turn 3
```
User: "Can I do it if I have knee problems?"
Agent: Remembers we're discussing Tadasana
       Provides modifications and safety info
       References previous pose discussion
[Full context maintained]
```

## API Request Format

### With Conversation History

```json
POST /api/ask
{
  "question": "What are the benefits?",
  "num_sources": 5,
  "conversation_history": [
    {
      "role": "user",
      "content": "What is Tadasana?"
    },
    {
      "role": "assistant",
      "content": "Tadasana (Mountain Pose) is..."
    }
  ]
}
```

### Response

```json
{
  "question": "What are the benefits?",
  "answer": "The benefits include improved posture, balance, and awareness...",
  "sources": [
    {
      "content": "...",
      "source": "yoga_index",
      "chunk_index": 5,
      "score": 0.89
    }
  ],
  "model": "claude-haiku-4-5-20251001",
  "reasoning": "Retrieved and processed 2 sources in 1 search(es)."
}
```

## Features

### ✅ Context Awareness
- LLM understands previous discussion
- No need to repeat information
- Natural follow-up questions work

### ✅ Memory Management
- Keeps last 20 messages by default (configurable)
- Automatic cleanup of old messages
- Efficient context passing

### ✅ Conversation Utilities
- Get summaries
- Format for display
- Clear history
- Get statistics

### ✅ Clean Output
- All responses automatically cleaned of markdown
- Plain text format
- Includes reasoning about agent decisions

## Best Practices

### 1. Keep History Reasonable
```typescript
// Default keeps 20 messages
conversation.maxMessages = 20;

// Change if needed
conversation.maxMessages = 10; // More recent context only
conversation.maxMessages = 50; // Longer conversations
```

### 2. Serialize Properly for API
```typescript
// Convert to strings before sending to API
const historyForAPI = conversation.messages.map((msg) => ({
  role: msg.role,
  content:
    typeof msg.content === 'string'
      ? msg.content
      : msg.content.map((b) => (b as any).text).join(''),
}));
```

### 3. Clear When Needed
```typescript
// Start fresh conversation
clearConversation(conversation);
setConversation({ ...conversation });
```

### 4. Display Conversation
```typescript
// Format for UI display
const formattedHistory = formatConversationHistory(conversation);
console.log(formattedHistory);
// Output:
// 👤 User: What is Tadasana?
//
// 🤖 Assistant: Tadasana (Mountain Pose) is...
//
// ---
//
// 👤 User: What are its benefits?
// ...
```

## Debugging

### Check Conversation State
```typescript
console.log('Message count:', getMessageCount(conversation));
console.log('Summary:', getConversationSummary(conversation));
console.log('Full history:', formatConversationHistory(conversation));
```

### Verify API Receives History
In browser DevTools → Network tab → /api/ask request → Payload:
```json
{
  "conversation_history": [...]
}
```

### Check Agent Reasoning
Look at the `reasoning` field in API response:
```
"reasoning": "Retrieved and processed 2 sources in 1 search(es)."
```

## Limitations

- History is kept in frontend state (not persisted to database)
- Clearing browser storage clears conversation
- Very long conversations may slow down API calls
- Set `maxMessages` to balance context vs. performance

## Future Enhancements

- [ ] Persist conversation to database
- [ ] User conversation history view
- [ ] Export conversations as PDF
- [ ] Conversation titles/naming
- [ ] Branching conversations (explore alternatives)
