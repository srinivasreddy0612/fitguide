"use client"
import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  messageInput: string;
  setMessageInput: (message: string) => void;
  sendMessage: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  isGenerating: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  messageInput, 
  setMessageInput, 
  sendMessage,
  isLoading,
  isGenerating 
}) => {
  return (
    <form onSubmit={sendMessage} className="p-4 border-t border-white/10 backdrop-blur-md bg-white/5">
      <div className="flex">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Ask your AI fitness coach..."
          className="flex-1 bg-white/5 border border-white/10 rounded-l-lg px-4 py-2 text-white/90 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
          disabled={isLoading || isGenerating}
        />
        <button 
          type="submit"
          disabled={!messageInput.trim() || isLoading || isGenerating}
          className="bg-white/10 border border-white/10 border-l-0 rounded-r-lg px-3 py-2 text-white/80 hover:bg-white/15 transition-colors disabled:opacity-50"
        >
          {isLoading || isGenerating ? 
            <Loader2 size={18} className="animate-spin" /> : 
            <Send size={18} />
          }
        </button>
      </div>
    </form>
  );
};

export default ChatInput;