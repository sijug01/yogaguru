'use client';

import React, { useState, useRef } from 'react';
// import VoiceButton from './VoiceButton'; // TODO: Re-enable after fixing TypeScript issues

interface InputBarProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  onVoiceInput?: (transcript: string) => void;
}

export default function InputBar({ onSubmit, isLoading, onVoiceInput }: InputBarProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setInput('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
    if (onVoiceInput) {
      onVoiceInput(transcript);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about yoga..."
          disabled={isLoading}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] max-h-[150px] disabled:bg-gray-100"
        />
        <div className="flex flex-col gap-2">
          {/* <VoiceButton onTranscript={handleVoiceTranscript} disabled={isLoading} /> */}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 whitespace-nowrap h-full"
          >
            {isLoading ? (
              <span className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Tip: Press Shift+Enter for a new line, Enter to send
      </div>
    </div>
  );
}
