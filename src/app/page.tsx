'use client';

import React, { useState, useEffect } from 'react';
import ChatWindow, { Message } from './components/ChatWindow';
import InputBar from './components/InputBar';
import { askQuestion, textToSpeech, checkHealth } from '@/lib/api';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [enableAudio, setEnableAudio] = useState(false);

  // Check API health on mount
  useEffect(() => {
    checkHealth().then(setIsConnected);
  }, []);

  const playAudio = async (text: string) => {
    if (!enableAudio) return;

    try {
      const audioBlob = await textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleSubmit = async (question: string) => {
    if (!question.trim() || !isConnected) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await askQuestion({
        question,
        num_sources: 5,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Play audio response if enabled
      if (enableAudio) {
        await playAudio(response.answer);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : 'An error occurred while processing your question.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async (transcript: string) => {
    // Automatically submit when voice input is received
    await handleSubmit(transcript);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🧘</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yoga RAG Assistant</h1>
              <p className="text-sm text-gray-600">
                {isConnected ? (
                  <span className="text-green-600">● Connected</span>
                ) : (
                  <span className="text-red-600">● Disconnected</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAudio}
                onChange={(e) => setEnableAudio(e.target.checked)}
                disabled={!isConnected}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">🔊 Audio responses</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col gap-4 p-4">
        <ChatWindow messages={messages} isLoading={isLoading} />
        {!isConnected && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            ⚠️ Cannot connect to backend API. Make sure the backend server is running on
            localhost:8000
          </div>
        )}
        <InputBar
          onSubmit={handleSubmit}
          isLoading={isLoading || !isConnected}
          onVoiceInput={handleVoiceInput}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-3 text-center text-sm text-gray-600">
        <p>
          💡 Ask about yoga poses, benefits, health considerations, and more. The system uses RAG
          to provide accurate information.
        </p>
      </div>
    </div>
  );
}
