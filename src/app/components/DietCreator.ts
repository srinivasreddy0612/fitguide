"use client"
import { DietPlan, MealType } from './types';

// System prompt for diet plan generation in JSON format
const systemPrompt = `You are Tony, an expert fitness and nutrition coach who specializes in creating personalized diet plans.
Generate a complete diet plan in valid JSON format that matches this structure:
{
  "title": "Diet Plan Title",
  "description": "Brief description of the diet plan",
  "dietType": "balanced" | "keto" | "vegan" | "paleo" | "intermittent",
  "calorieRange": "1500-1800" | "1800-2200" | "2200-2500" | "2500-3000",
  "meals": [
    { 
      "mealType": "breakfast" | "lunch" | "dinner" | "snack",
      "title": "Meal title",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2", ...]
    },
    ...
  ]
}
Keep the response ONLY in valid JSON format with no additional text.`;

// Function to generate a diet plan using Groq API
export const generateDietPlan = async (userRequest: string): Promise<DietPlan | null> => {
  try {
    // Prepare prompt for Groq
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userRequest }
    ];
    
    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error generating diet plan');
    }
    
    // Extract the JSON response
    const jsonResponse = data.choices[0].message.content;
    
    // Parse the JSON
    const dietData = JSON.parse(jsonResponse);
    
    // Add visual styling based on diet type
    const styleInfo = getDietStyles(dietData.dietType);
    
    // Create the complete diet plan object
    const dietPlan: DietPlan = {
      id: Math.floor(Math.random() * 1000) + 5,
      title: dietData.title,
      description: dietData.description,
      dietType: dietData.dietType,
      calorieRange: dietData.calorieRange,
      meals: dietData.meals,
      ...styleInfo
    };
    
    return dietPlan;
    
  } catch (error) {
    console.error('Error generating diet plan:', error);
    return null;
  }
};

// Helper function to get the visual styling based on diet type
const getDietStyles = (dietType: string) => {
  switch(dietType) {
    case 'balanced':
      return {
        color: 'from-teal-500/40 to-emerald-600/40',
        borderColor: 'border-teal-500/20',
        iconColor: 'text-teal-500',
        iconBg: 'bg-teal-500/10'
      };
    case 'keto':
      return {
        color: 'from-indigo-500/40 to-purple-600/40',
        borderColor: 'border-indigo-500/20',
        iconColor: 'text-indigo-500',
        iconBg: 'bg-indigo-500/10'
      };
    case 'vegan':
      return {
        color: 'from-green-500/40 to-lime-600/40',
        borderColor: 'border-green-500/20',
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10'
      };
    case 'paleo':
      return {
        color: 'from-amber-500/40 to-orange-600/40',
        borderColor: 'border-amber-500/20',
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10'
      };
    case 'intermittent':
      return {
        color: 'from-blue-500/40 to-sky-600/40',
        borderColor: 'border-blue-500/20',
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10'
      };
    default:
      return {
        color: 'from-teal-500/40 to-emerald-600/40',
        borderColor: 'border-teal-500/20',
        iconColor: 'text-teal-500',
        iconBg: 'bg-teal-500/10'
      };
  }
};