'use client';

import React, { useEffect, useState, useRef } from 'react';

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

export default function VoiceButton({ onTranscript, disabled = false }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.language = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            onTranscript(transcript);
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current || !isSupported) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        title="Speech recognition not supported in your browser"
        className="bg-gray-400 text-white p-2 rounded-lg cursor-not-allowed opacity-50"
      >
        🎤
      </button>
    );
  }

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`${
        isListening
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-gray-500 hover:bg-gray-600'
      } disabled:bg-gray-400 text-white font-semibold p-2 rounded-lg transition-colors duration-200`}
      title={isListening ? 'Click to stop listening' : 'Click to start listening'}
    >
      🎤 {isListening ? '●' : ''}
    </button>
  );
}
