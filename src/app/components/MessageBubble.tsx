'use client';

import React, { useState } from 'react';

export interface Source {
  content: string;
  score: number;
  chunk_index: number;
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  sources?: Source[];
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`${
          isUser
            ? 'message-user bg-blue-500 text-white'
            : 'message-bot bg-gray-100 text-gray-900'
        } rounded-lg px-4 py-3 max-w-lg break-words`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300 border-opacity-30">
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-xs font-semibold text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <span>{showSources ? '▼' : '▶'}</span>
              <span>Sources ({message.sources.length})</span>
            </button>

            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="bg-white bg-opacity-50 rounded px-2 py-2 text-xs text-gray-700"
                  >
                    <div className="font-semibold mb-1">
                      Source {idx + 1} (Score: {source.score.toFixed(3)})
                    </div>
                    <p className="line-clamp-2 text-gray-600">
                      {source.content.substring(0, 150)}
                      {source.content.length > 150 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2 opacity-70">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
