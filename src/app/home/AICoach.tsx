"use client"
import React, { useState } from 'react';
import { Dumbbell, BarChart, Clock } from 'lucide-react';

// Import components
import ChatHeader from '../components/ChatHeader';
import ChatMessages from '../components/ChatMessages';
import ChatInput from '../components/ChatInput';

// Import workout creation utilities
import { generateWorkout } from '../components/WorkoutCreator';

// Define interfaces for our data types
interface ChatMessage {
  role: 'user' | 'system';
  content: string;
  workout?: CustomWorkout;
  tempWorkout?: CustomWorkout;
  isLoading?: boolean;
}

interface CustomWorkout {
  id?: number | string;
  title: string;
  description: string;
  duration: string;
  difficulty?: string;
  workoutType: 'strength' | 'hiit' | 'yoga' | 'core';
  focusArea?: string;
  exercises?: string[];
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
  icon?: React.ReactNode;
}

interface AICoachProps {
  showChatbot: boolean;
  toggleChatbot: () => void;
  addWorkout: (workout: CustomWorkout) => void;
}

/**
 * AI Coach component providing workout suggestions and fitness advice
 */
const AICoach: React.FC<AICoachProps> = ({ showChatbot, toggleChatbot, addWorkout }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'system', content: "Hey, I'm Tony. Ready to help with your fitness goals. What can I do for you today?" }
  ]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingWorkout, setPendingWorkout] = useState<CustomWorkout | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Function to send a message
  const sendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!messageInput.trim() || isLoading || isGenerating) return;
    
    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: messageInput };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Store the user input before clearing it
    const userInput = messageInput;
    
    // Clear input
    setMessageInput('');
    
    // If responding to a workout suggestion
    if (pendingWorkout) {
      handleWorkoutConfirmation(userInput);
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    // Check if user is asking to create a workout
    const isWorkoutRequest = userInput.toLowerCase().includes('workout') || 
                            userInput.toLowerCase().includes('routine') || 
                            userInput.toLowerCase().includes('plan') ||
                            userInput.toLowerCase().includes('exercise') ||
                            userInput.toLowerCase().includes('abs') ||
                            userInput.toLowerCase().includes('cardio') ||
                            userInput.toLowerCase().includes('leg') ||
                            userInput.toLowerCase().includes('training');
    
    if (isWorkoutRequest) {
      await handleWorkoutRequest(userInput);
    } else {
      await handleRegularChat(userInput, userMessage);
    }
    
    setIsLoading(false);
  };
  
  // Handle user confirming/declining a workout
  const handleWorkoutConfirmation = (userInput: string): void => {
    const confirmText = userInput.toLowerCase();
    
    if (!pendingWorkout) return;
    
    if (confirmText.includes('yes') || confirmText.includes('sure') || confirmText.includes('ok') || confirmText.includes('add')) {
      // Add appropriate icon based on workout type
      let icon: React.ReactNode;
      if (pendingWorkout.workoutType === 'hiit') {
        icon = <BarChart className={pendingWorkout.iconColor || ''} />;
      } else if (pendingWorkout.workoutType === 'yoga') {
        icon = <Clock className={pendingWorkout.iconColor || ''} />;
      } else {
        // Default to Dumbbell for strength and core
        icon = <Dumbbell className={pendingWorkout.iconColor || ''} />;
      }
      
      // Create the final workout object with the icon included
      const completeWorkout: CustomWorkout = {
        ...pendingWorkout,
        icon
      };
      
      // Add the workout to the collection
      addWorkout(completeWorkout);
      
      // Confirm addition
      setChatMessages(prev => [
        ...prev,
        { 
          role: 'system', 
          content: `Added "${pendingWorkout.title}" to your collection. Anything else?`,
          workout: completeWorkout
        }
      ]);
      
      // Reset the pending workout
      setPendingWorkout(null);
    } else {
      // User declined
      setChatMessages(prev => [
        ...prev,
        { 
          role: 'system', 
          content: `No problem. Need anything else?`
        }
      ]);
      
      // Reset the pending workout
      setPendingWorkout(null);
    }
  };
  
  // Handle workout generation request
  const handleWorkoutRequest = async (userInput: string): Promise<void> => {
    setIsGenerating(true);
    
    // Add loading message
    setChatMessages(prev => [
      ...prev,
      { 
        role: 'system', 
        content: `Creating a workout plan based on your request...`,
        isLoading: true
      }
    ]);
    
    try {
      // Generate workout using the function
      const workout = await generateWorkout(userInput);
      
      if (workout) {
        // Remove loading message
        setChatMessages(prev => {
          const filteredMessages = prev.filter(msg => !msg.isLoading);
          
          // Format exercises for display
          let exerciseList = '';
          if (workout.exercises) {
            workout.exercises.forEach((exercise: string, index: number) => {
              exerciseList += `${index + 1}. ${exercise}\n`;
            });
          }
          
          return [
            ...filteredMessages,
            { 
              role: 'system', 
              content: `Here's a ${workout.difficulty?.toLowerCase() || 'custom'} ${workout.workoutType} workout:\n\n**${workout.title}**\n${workout.description}\n\nExercises:\n${exerciseList}\n\nAdd this to your collection?`,
              tempWorkout: workout
            }
          ];
        });
        
        // Store the workout as pending for confirmation
        setPendingWorkout(workout);
      } else {
        throw new Error('Failed to generate workout');
      }
    } catch (error) {
      console.error('Error generating workout:', error);
      setChatMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isLoading);
        return [
          ...filteredMessages,
          { 
            role: 'system', 
            content: `Sorry, I had trouble creating a workout plan. Could you try with more details?`
          }
        ];
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle regular chat conversation
  const handleRegularChat = async (userInput: string, userMessage: ChatMessage): Promise<void> => {
    try {
      // Simplified message handling for regular conversation
      const messages = [
        { 
          role: 'system', 
          content: "You are Tony, a fitness coach. Keep responses concise - 1-3 sentences maximum. Be friendly but direct and conversational without excess words."
        },
        ...chatMessages
          .filter(msg => msg.role !== 'system' || (!msg.workout && !msg.tempWorkout && !msg.isLoading))
          .map(msg => ({ role: msg.role, content: msg.content })),
        { role: userMessage.role, content: userMessage.content }
      ];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error calling chat API');
      }
      
      const aiResponse = data.message || data.content || '';
      
      // Add AI's response to chat
      setChatMessages(prev => [
        ...prev,
        { role: 'system', content: aiResponse }
      ]);
    } catch (error) {
      console.error('Error in chat flow:', error);
      setChatMessages(prev => [
        ...prev,
        { role: 'system', content: "Sorry, had a technical issue. Try again?" }
      ]);
    }
  };
  
  return (
    <div 
      className={`fixed top-0 right-0 h-full w-1/2 bg-black border-l border-white/10 z-30 transition-all duration-300 transform ${
        showChatbot ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col`}
    >
      {/* Chat Header Component */}
      <ChatHeader toggleChatbot={toggleChatbot} />
      
      {/* Chat Messages Component */}
      <ChatMessages 
        chatMessages={chatMessages as import("../components/types").ChatMessage[]}
        isLoading={isLoading}
        showChatbot={showChatbot}
      />
      
      {/* Chat Input Component */}
      <ChatInput 
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
        isLoading={isLoading}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default AICoach;