"use client"
import React from 'react';
import { Brain, X } from 'lucide-react';

interface ChatHeaderProps {
  toggleChatbot: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ toggleChatbot }) => {
  return (
    <div className="p-4 border-b border-white/10 backdrop-blur-md bg-white/5 flex justify-between items-center">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-white/10 mr-3">
          <Brain size={18} className="text-white/80" />
        </div>
        <div>
          <h2 className="font-medium text-white/90">AI Fitness Coach</h2>
          <p className="text-xs text-white/60">Powered by Groq</p>
        </div>
      </div>
      <button 
        onClick={toggleChatbot}
        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
      >
        <X size={18} className="text-white/70" />
      </button>
    </div>
  );
};

export default ChatHeader;