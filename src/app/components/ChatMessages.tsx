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

  // Function to format meal data from diet plans
  const formatMeals = (meals: any[]) => {
    if (!meals || !Array.isArray(meals) || meals.length === 0) {
      return <p className="text-white/60 italic">No meals specified</p>;
    }

    return (
      <div className="space-y-3 mt-3">
        {meals.map((meal, index) => (
          <div key={index} className="bg-white/5 rounded-md p-2">
            <div className="flex justify-between items-center">
              <div className="font-medium text-white/90">{meal.title}</div>
              <div className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70">{meal.mealType}</div>
            </div>
            <div className="text-xs text-white/70 mt-1">{meal.description}</div>
            {meal.ingredients && meal.ingredients.length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-white/60 mb-1">Ingredients:</p>
                <div className="flex flex-wrap gap-1">
                  {meal.ingredients.map((ingredient: string, idx: number) => (
                    <span key={idx} className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-white/80">
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

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
                  <span className="text-xs text-white/60">Generating...</span>
                </div>
              )}
              
              {/* Display workout information if available */}
              {(message.workout || message.tempWorkout) && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  {message.workout ? (
                    <span className="text-xs text-green-400">✓ New workout added to your collection</span>
                  ) : (
                    <span className="text-xs text-blue-400">Preview of workout plan</span>
                  )}
                </div>
              )}
              
              {/* Display diet plan information if available */}
              {(message.dietPlan || message.tempDietPlan) && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  {message.dietPlan ? (
                    <>
                      <span className="text-xs text-green-400 block mb-2">✓ New diet plan added</span>
                      {message.dietPlan.meals && formatMeals(message.dietPlan.meals)}
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-blue-400 block mb-2">Preview of nutrition plan</span>
                      {message.tempDietPlan && message.tempDietPlan.meals && formatMeals(message.tempDietPlan.meals)}
                    </>
                  )}
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