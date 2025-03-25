// app/components/WorkoutCreator.ts
"use client"

// Updated prompt to request JSON format directly and be more specific
const systemPrompt = `You are Tony, an expert fitness coach who specializes in creating personalized workout plans.
Generate a complete workout in valid JSON format that matches this structure:
{
  "title": "Workout Title",
  "description": "Brief description of the workout",
  "workoutType": "strength" | "hiit" | "yoga" | "core",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "duration": "15-20 min" | "30-40 min" | "45-60 min",
  "exercises": ["Exercise 1 with details", "Exercise 2 with details", ...]
}

For exercise details, include sets, reps, and rest periods for strength workouts. For HIIT, include work/rest intervals.
For core workouts, focus on abdominal and core muscle exercises.

Keep the response ONLY in valid JSON format with no additional text.`;

// Simplified workout generation function with improved error handling
export const generateWorkout = async (userRequest: string) => {
  try {
    console.log("Generating workout with request:", userRequest);
    
    // Create a more specific prompt based on the user request
    let enhancedRequest = userRequest;
    
    // Check if the request mentions a specific body part or workout type
    if (userRequest.toLowerCase().includes('abs') || userRequest.toLowerCase().includes('core')) {
      enhancedRequest += ". Focus on core exercises that target the abdominals, obliques, and lower back.";
      if (!userRequest.toLowerCase().includes('workout type')) {
        enhancedRequest += " Workout type should be core.";
      }
    } else if (userRequest.toLowerCase().includes('leg') || userRequest.toLowerCase().includes('lower body')) {
      enhancedRequest += ". Focus on exercises for quadriceps, hamstrings, glutes, and calves.";
      if (!userRequest.toLowerCase().includes('workout type')) {
        enhancedRequest += " Workout type should be strength.";
      }
    } else if (userRequest.toLowerCase().includes('arm') || userRequest.toLowerCase().includes('upper body')) {
      enhancedRequest += ". Focus on exercises for biceps, triceps, shoulders, and chest.";
      if (!userRequest.toLowerCase().includes('workout type')) {
        enhancedRequest += " Workout type should be strength.";
      }
    } else if (userRequest.toLowerCase().includes('cardio') || userRequest.toLowerCase().includes('hiit')) {
      enhancedRequest += ". Focus on high-intensity interval exercises that elevate heart rate.";
      if (!userRequest.toLowerCase().includes('workout type')) {
        enhancedRequest += " Workout type should be hiit.";
      }
    }
    
    // Add intensity information if mentioned
    if (userRequest.toLowerCase().includes('intense') || userRequest.toLowerCase().includes('intensity')) {
      enhancedRequest += " Make the workout challenging with higher intensity exercises.";
      if (!userRequest.toLowerCase().includes('difficulty')) {
        enhancedRequest += " Difficulty should be Advanced.";
      }
    }
    
    // Prepare prompt for Groq - add the enhanced user request
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: enhancedRequest }
    ];
    
    console.log("Sending to API with enhanced request:", enhancedRequest);
    
    // Call workout API
    const response = await fetch('/api/workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from workout API:", errorData);
      throw new Error(errorData.error || `API returned ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Workout API response:", data);
    
    // Check if we got content back
    if (!data.content) {
      console.error("No content in response:", data);
      throw new Error("No workout data received");
    }
    
    // Return the workout data
    return data.content;
    
  } catch (error) {
    console.error('Error generating workout:', error);
    return null;
  }
};

// Helper function to get the visual styling based on workout type
export const getWorkoutStyles = (workoutType: 'strength' | 'hiit' | 'yoga' | 'core'): {
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
} => {
  switch(workoutType) {
    case 'strength':
      return {
        color: 'from-purple-500/40 to-indigo-600/40',
        borderColor: 'border-purple-500/20',
        iconColor: 'text-purple-500',
        iconBg: 'bg-purple-500/10'
      };
    case 'hiit':
      return {
        color: 'from-red-500/40 to-orange-600/40',
        borderColor: 'border-red-500/20',
        iconColor: 'text-red-500',
        iconBg: 'bg-red-500/10'
      };
    case 'yoga':
      return {
        color: 'from-blue-500/40 to-teal-600/40',
        borderColor: 'border-blue-500/20',
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10'
      };
    case 'core':
      return {
        color: 'from-green-500/40 to-emerald-600/40',
        borderColor: 'border-green-500/20',
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10'
      };
    default:
      return {
        color: 'from-purple-500/40 to-indigo-600/40',
        borderColor: 'border-purple-500/20',
        iconColor: 'text-purple-500',
        iconBg: 'bg-purple-500/10'
      };
  }
};