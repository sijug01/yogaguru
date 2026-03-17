'use client';

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  sources?: Array<{
    content: string;
    score: number;
    chunk_index: number;
  }>;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center text-gray-400">
          <div>
            <div className="text-4xl mb-4">🧘</div>
            <p className="text-lg font-semibold">Welcome to Yoga RAG</p>
            <p className="text-sm mt-2">Ask any questions about yoga poses, benefits, or techniques</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-3">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollEndRef} />
        </>
      )}
    </div>
  );
}
