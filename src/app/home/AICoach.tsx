"use client"
import React, { useState, useCallback, useRef } from 'react';
import { Dumbbell, BarChart, Clock, Apple } from 'lucide-react';

// Import components
import ChatHeader from '../components/ChatHeader';
import ChatMessages from '../components/ChatMessages';
import ChatInput from '../components/ChatInput';

// Define interfaces for our data types
interface ChatMessage {
  role: 'user' | 'system';
  content: string;
  workout?: CustomWorkout;
  dietPlan?: DietPlan;
  tempWorkout?: CustomWorkout;
  tempDietPlan?: DietPlan;
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

interface Meal {
  id: number;
  mealType: string;
  title: string;
  description: string;
  ingredients: string[];
}

interface DietPlan {
  id: number | string;
  title: string;
  description: string;
  dietType: string;
  calorieRange: string;
  meals: Meal[];
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
  addDietPlan?: (dietPlan: DietPlan) => void; // Optional prop for diet plans
}

/**
 * AI Coach component providing workout suggestions and fitness advice
 */
const AICoach: React.FC<AICoachProps> = ({ showChatbot, toggleChatbot, addWorkout, addDietPlan }) => {
  // Reference to track the context of the conversation
  const conversationContext = useRef({
    lastSuggestionType: null as 'workout' | 'diet' | null,
    dietRestrictions: [] as string[],
    pendingAction: null as string | null
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'system', content: "Hey, I'm Tony. Ready to help with your fitness goals and nutrition. What can I do for you today?" }
  ]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingWorkout, setPendingWorkout] = useState<CustomWorkout | null>(null);
  const [pendingDietPlan, setPendingDietPlan] = useState<DietPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Function to send a message
  const sendMessage = useCallback(async (e: React.FormEvent): Promise<void> => {
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
    
    // If responding to a diet plan suggestion
    if (pendingDietPlan) {
      handleDietPlanConfirmation(userInput);
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Check for diet restrictions in the message
      const lowerInput = userInput.toLowerCase();
      const dietRestrictions = [];
      
      if (lowerInput.includes('no chicken') || lowerInput.includes('not into chicken') || lowerInput.includes("don't eat chicken")) {
        dietRestrictions.push('chicken');
      }
      if (lowerInput.includes('no beef') || lowerInput.includes('not into beef') || lowerInput.includes("don't eat beef") || lowerInput.includes('hindu')) {
        dietRestrictions.push('beef');
      }
      if (lowerInput.includes('no pork') || lowerInput.includes('not into pork') || lowerInput.includes("don't eat pork") || lowerInput.includes('muslim') || lowerInput.includes('halal')) {
        dietRestrictions.push('pork');
      }
      if (lowerInput.includes('no seafood') || lowerInput.includes('not into seafood') || lowerInput.includes("don't eat seafood") || lowerInput.includes('no fish')) {
        dietRestrictions.push('seafood');
      }
      if (lowerInput.includes('vegetarian')) {
        dietRestrictions.push('meat');
      }
      if (lowerInput.includes('vegan')) {
        dietRestrictions.push('animal products');
      }
      
      // Update conversation context with any detected restrictions
      if (dietRestrictions.length > 0) {
        conversationContext.current.dietRestrictions = [
          ...new Set([...conversationContext.current.dietRestrictions, ...dietRestrictions])
        ];
      }
      
      // Check if this is a follow-up request for a specific type of content
      const isGenerateConfirmation = lowerInput.includes('yes generate') || 
                                   lowerInput.includes('go with it') || 
                                   lowerInput.includes('go ahead') ||
                                   lowerInput.includes('sounds good');
                                   
      const isAlternativeRequest = lowerInput.includes('suits that') || 
                                 lowerInput.includes('alternative') || 
                                 lowerInput.includes('instead') ||
                                 lowerInput.includes('different');
      
      if ((isGenerateConfirmation || isAlternativeRequest) && conversationContext.current.lastSuggestionType === 'diet') {
        // This is a follow-up to generate a diet plan with possible restrictions
        await handleDietRequest(userInput, true);
      } else if ((isGenerateConfirmation || isAlternativeRequest) && conversationContext.current.lastSuggestionType === 'workout') {
        // This is a follow-up to generate a workout
        await handleWorkoutRequest(userInput);
      } else {
        // Check if user is asking to create a workout
        const isWorkoutRequest = lowerInput.includes('workout') || 
                                lowerInput.includes('routine') || 
                                lowerInput.includes('exercise') ||
                                lowerInput.includes('abs') ||
                                lowerInput.includes('cardio') ||
                                lowerInput.includes('leg') ||
                                lowerInput.includes('training') ||
                                lowerInput.includes('fitness');
        
        // Check if user is asking for nutrition or diet advice
        const isDietRequest = lowerInput.includes('diet') || 
                             lowerInput.includes('nutrition') ||
                             lowerInput.includes('meal') ||
                             lowerInput.includes('food') ||
                             lowerInput.includes('eat') ||
                             lowerInput.includes('eating') ||
                             lowerInput.includes('keto') ||
                             lowerInput.includes('vegan') ||
                             lowerInput.includes('calories');
        
        if (isWorkoutRequest && !isDietRequest) {
          conversationContext.current.lastSuggestionType = 'workout';
          await handleWorkoutRequest(userInput);
        } else if (isDietRequest) {
          conversationContext.current.lastSuggestionType = 'diet';
          await handleDietRequest(userInput, false);
        } else {
          await handleRegularChat(userInput);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setChatMessages(prev => [
        ...prev,
        { 
          role: 'system', 
          content: "I'm having trouble connecting right now. Please try again in a moment."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messageInput, isLoading, isGenerating, pendingWorkout, pendingDietPlan]);
  
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
    
    // Reset conversation context
    conversationContext.current.lastSuggestionType = null;
  };
  
  // Handle user confirming/declining a diet plan
  const handleDietPlanConfirmation = (userInput: string): void => {
    const confirmText = userInput.toLowerCase();
    
    if (!pendingDietPlan) return;
    
    if (confirmText.includes('yes') || confirmText.includes('sure') || confirmText.includes('ok') || confirmText.includes('add')) {
      // Add icon to diet plan
      const completeDietPlan: DietPlan = {
        ...pendingDietPlan,
        icon: <Apple className={pendingDietPlan.iconColor || ''} />
      };
      
      // Add the diet plan to the collection if the callback is provided
      if (addDietPlan) {
        addDietPlan(completeDietPlan);
        
        // Confirm addition
        setChatMessages(prev => [
          ...prev,
          { 
            role: 'system', 
            content: `Added "${pendingDietPlan.title}" to your nutrition plans. Would you like any specific details about this plan?`,
            dietPlan: completeDietPlan
          }
        ]);
      } else {
        // If no callback is provided, just display the plan in the chat
        setChatMessages(prev => [
          ...prev,
          { 
            role: 'system', 
            content: `Here's your "${pendingDietPlan.title}" plan. Since this feature is still being developed, I can't save it to your profile yet, but you can reference it here in our chat.`,
            dietPlan: completeDietPlan
          }
        ]);
      }
      
      // Reset the pending diet plan
      setPendingDietPlan(null);
    } else {
      // Check if user is expressing dietary restrictions
      const lowerInput = userInput.toLowerCase();
      const hasRestrictions = lowerInput.includes('no ') || 
                             lowerInput.includes('not into') || 
                             lowerInput.includes("don't eat") ||
                             lowerInput.includes('hindu') ||
                             lowerInput.includes('muslim') ||
                             lowerInput.includes('vegetarian') ||
                             lowerInput.includes('vegan');
                             
      if (hasRestrictions) {
        // Remember the restrictions for the next diet plan
        if (lowerInput.includes('no chicken') || lowerInput.includes('not into chicken')) {
          conversationContext.current.dietRestrictions.push('chicken');
        }
        if (lowerInput.includes('no beef') || lowerInput.includes('not into beef') || lowerInput.includes('hindu')) {
          conversationContext.current.dietRestrictions.push('beef');
        }
        if (lowerInput.includes('no pork') || lowerInput.includes('not into pork') || lowerInput.includes('muslim')) {
          conversationContext.current.dietRestrictions.push('pork');
        }
        if (lowerInput.includes('no seafood') || lowerInput.includes('not into seafood')) {
          conversationContext.current.dietRestrictions.push('seafood');
        }
        
        // Respond with acknowledgment
        setChatMessages(prev => [
          ...prev,
          { 
            role: 'system', 
            content: `I understand your preferences. Would you like me to create a new diet plan that avoids ${conversationContext.current.dietRestrictions.join(', ')}?`
          }
        ]);
        
        // Set pending action for next user input
        conversationContext.current.pendingAction = 'generate_new_diet';
      } else {
        // Regular decline
        setChatMessages(prev => [
          ...prev,
          { 
            role: 'system', 
            content: `No problem. Need anything else related to nutrition or fitness?`
          }
        ]);
      }
      
      // Reset the pending diet plan
      setPendingDietPlan(null);
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
      // Prepare messages for API
      const messages = [
        { 
          role: 'system', 
          content: `You are Tony, an expert fitness coach who specializes in creating personalized workout plans.
Generate a complete workout in valid JSON format that matches this structure:
{
  "title": "Workout Title",
  "description": "Brief description of the workout",
  "workoutType": "strength" | "hiit" | "yoga" | "core",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "duration": "15-20 min" | "30-40 min" | "45-60 min",
  "exercises": ["Exercise 1 with details", "Exercise 2 with details", ...],
  "focusArea": "Upper Body" | "Lower Body" | "Core" | "Full Body" | "Cardio" | etc.
}

For exercise details, include sets, reps, and rest periods for strength workouts. For HIIT, include work/rest intervals.
For core workouts, focus on abdominal and core muscle exercises.
Make sure to include a focusArea field that specifies what body part or fitness component the workout targets.

Keep the response ONLY in valid JSON format with no additional text.`
        },
        { role: 'user', content: userInput }
      ];
      
      const response = await fetch('/api/workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.content) {
        throw new Error('No workout data returned');
      }
      
      const workout = data.content;
      
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
            content: `Here's a ${workout.difficulty?.toLowerCase() || 'custom'} ${workout.workoutType} workout focusing on ${workout.focusArea || 'general fitness'}:\n\n**${workout.title}**\n${workout.description}\n\nExercises:\n${exerciseList}\n\nAdd this to your collection?`,
            tempWorkout: workout
          }
        ];
      });
      
      // Store the workout as pending for confirmation
      setPendingWorkout(workout);
      conversationContext.current.lastSuggestionType = 'workout';
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
  
  // Handle diet plan generation request
  const handleDietRequest = async (userInput: string, isFollowUp: boolean): Promise<void> => {
    setIsGenerating(true);
    
    // Add loading message
    setChatMessages(prev => [
      ...prev,
      { 
        role: 'system', 
        content: `Creating a nutrition plan based on your request...`,
        isLoading: true
      }
    ]);
    
    try {
      // Create a request that includes dietary restrictions if any
      let enhancedRequest = userInput;
      
      // If this is a follow-up request or we have stored restrictions, include them
      if (isFollowUp || conversationContext.current.dietRestrictions.length > 0) {
        const restrictions = conversationContext.current.dietRestrictions;
        if (restrictions.length > 0) {
          enhancedRequest += ` Please make sure the diet plan avoids: ${restrictions.join(', ')}.`;
        }
      }
      
      // Call diet API with enhanced request
      const response = await fetch('/api/diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: enhancedRequest }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.content) {
        throw new Error('No diet plan data returned');
      }
      
      const dietPlan = data.content;
      
      // Format meals for display
      let mealsList = '';
      if (dietPlan.meals && dietPlan.meals.length > 0) {
        dietPlan.meals.forEach((meal: Meal) => {
          mealsList += `**${meal.title}** (${meal.mealType})\n${meal.description}\n`;
          if (meal.ingredients && meal.ingredients.length > 0) {
            mealsList += `Ingredients: ${meal.ingredients.join(', ')}\n\n`;
          }
        });
      }
      
      // Remove loading message and add diet plan
      setChatMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isLoading);
        return [
          ...filteredMessages,
          { 
            role: 'system', 
            content: `I've created a ${dietPlan.dietType} diet plan (${dietPlan.calorieRange} calories):\n\n**${dietPlan.title}**\n${dietPlan.description}\n\nHere's a summary of the meals:\n${mealsList}\nWould you like to add this nutrition plan to your collection?`,
            tempDietPlan: dietPlan
          }
        ];
      });
      
      // Store the diet plan as pending for confirmation
      setPendingDietPlan(dietPlan);
      conversationContext.current.lastSuggestionType = 'diet';
      conversationContext.current.pendingAction = null;
    } catch (error) {
      console.error('Error generating diet plan:', error);
      setChatMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isLoading);
        return [
          ...filteredMessages,
          { 
            role: 'system', 
            content: `Sorry, I had trouble creating a nutrition plan. Could you try with more details?`
          }
        ];
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle regular chat conversation
  const handleRegularChat = async (userInput: string): Promise<void> => {
    try {
      const lowerInput = userInput.toLowerCase();
      
      // Check if this is a response to a pending action
      if (conversationContext.current.pendingAction === 'generate_new_diet' && 
          (lowerInput.includes('yes') || lowerInput.includes('sure') || 
           lowerInput.includes('ok') || lowerInput.includes('generate'))) {
        // User wants a new diet plan based on restrictions
        await handleDietRequest(userInput, true);
        return;
      }
      
      // Prepare messages for API
      const messages = [
        { 
          role: 'system', 
          content: "You are Tony, a fitness and nutrition coach. Keep responses concise - 1-3 sentences maximum. Be friendly but direct and conversational without excess words."
        },
        ...chatMessages
          .filter(msg => msg.role !== 'system' || (!msg.workout && !msg.tempWorkout && !msg.dietPlan && !msg.tempDietPlan && !msg.isLoading))
          .map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: userInput }
      ];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages })
      });
      
      const data = await response.json();
      
      // Check for errors in the response
      if (!response.ok || data.error) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      
      const aiResponse = data.message || '';
      
      // Add AI's response to chat
      setChatMessages(prev => [
        ...prev,
        { role: 'system', content: aiResponse }
      ]);
      
      // If the AI suggests generating something but isn't doing it, capture that context
      const lowerResponse = aiResponse.toLowerCase();
      if ((lowerResponse.includes('generate') || lowerResponse.includes('create')) && 
          (lowerResponse.includes('diet') || lowerResponse.includes('meal') || lowerResponse.includes('nutrition'))) {
        conversationContext.current.lastSuggestionType = 'diet';
        conversationContext.current.pendingAction = 'generate_new_diet';
      } else if ((lowerResponse.includes('generate') || lowerResponse.includes('create')) && 
                 (lowerResponse.includes('workout') || lowerResponse.includes('exercise'))) {
        conversationContext.current.lastSuggestionType = 'workout';
      }
    } catch (error) {
      console.error('Error in chat flow:', error);
      setChatMessages(prev => [
        ...prev,
        { 
          role: 'system', 
          content: "Sorry, I'm having technical issues. Could you try again with a simpler question?"
        }
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