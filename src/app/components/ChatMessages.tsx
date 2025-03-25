"use client"
import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import { ChatMessage } from '../components/types';

interface ChatMessagesProps {
  chatMessages: ChatMessage[];
  isLoading: boolean;
  showChatbot: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  chatMessages, 
  isLoading, 
  showChatbot 
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Effect to scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current && showChatbot) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatbot]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-black/50 backdrop-blur-sm">
      <div className="space-y-4">
        {chatMessages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs p-3 rounded-lg text-sm ${
                message.role === 'user' 
                  ? 'bg-white/10 text-white/90 rounded-tr-none'
                  : 'bg-white/5 text-white/80 rounded-tl-none border border-white/10'
              }`}
            >
              {message.content}
              {message.isLoading && (
                <div className="mt-2 flex items-center">
                  <Loader2 size={12} className="animate-spin mr-2" />
                  <span className="text-xs text-white/60">Generating workout...</span>
                </div>
              )}
              {message.workout && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <span className="text-xs text-green-400">✓ New workout added to your collection</span>
                </div>
              )}
              {message.tempWorkout && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <span className="text-xs text-blue-400">Preview of workout plan</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && !chatMessages.some(msg => msg.isLoading) && (
          <div className="flex justify-start">
            <div className="max-w-xs p-3 rounded-lg text-sm bg-white/5 text-white/80 rounded-tl-none border border-white/10 flex items-center">
              <Loader2 size={16} className="animate-spin mr-2" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;