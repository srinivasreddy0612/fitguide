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

// Fallback workout to use when API fails
const createFallbackWorkout = (workoutType: 'strength' | 'hiit' | 'yoga' | 'core') => {
  const styleInfo = getWorkoutStyles(workoutType);
  let title, description, difficulty, duration, exercises;
  
  switch (workoutType) {
    case 'core':
      title = "Core Crusher Workout";
      description = "A focused abdominal workout to strengthen your core and improve stability.";
      difficulty = "Intermediate";
      duration = "25-30 min";
      exercises = [
        "3 sets of 20 crunches",
        "3 sets of 30-second planks",
        "3 sets of 15 Russian twists",
        "3 sets of 12 leg raises",
        "3 sets of 20 bicycle crunches",
        "3 sets of 15 mountain climbers"
      ];
      break;
      
    case 'hiit':
      title = "Quick HIIT Burner";
      description = "High-intensity interval training to boost cardio fitness and burn calories.";
      difficulty = "Intermediate";
      duration = "20-25 min";
      exercises = [
        "30 sec jumping jacks, 15 sec rest",
        "30 sec high knees, 15 sec rest",
        "30 sec burpees, 15 sec rest",
        "30 sec mountain climbers, 15 sec rest",
        "30 sec squat jumps, 15 sec rest",
        "Repeat circuit 4 times"
      ];
      break;
      
    case 'yoga':
      title = "Flexibility Flow";
      description = "A yoga flow to improve flexibility, balance, and reduce stress.";
      difficulty = "Beginner";
      duration = "30-35 min";
      exercises = [
        "5 min warm-up with gentle stretches",
        "5 min sun salutations",
        "1 min each side warrior II pose",
        "1 min each side triangle pose",
        "5 min balance poses",
        "5 min seated stretches",
        "5 min final relaxation"
      ];
      break;
      
    default: // strength
      title = "Full Body Strength";
      description = "A balanced strength training workout targeting all major muscle groups.";
      difficulty = "Intermediate";
      duration = "40-45 min";
      exercises = [
        "3 sets of 12 squats",
        "3 sets of 10 push-ups",
        "3 sets of 10 dumbbell rows",
        "3 sets of 10 lunges per leg",
        "3 sets of 10 shoulder presses",
        "3 sets of 10 glute bridges",
        "3 sets of 30-second planks"
      ];
      break;
  }
  
  return {
    id: Math.floor(Math.random() * 1000) + 5,
    title,
    description,
    workoutType,
    difficulty,
    duration,
    exercises,
    ...styleInfo
  };
};

// Determine workout type from user input
const determineWorkoutType = (userInput: string): 'strength' | 'hiit' | 'yoga' | 'core' => {
  const lowerCaseInput = userInput.toLowerCase();
  
  if (lowerCaseInput.includes('abs') || lowerCaseInput.includes('core')) {
    return 'core';
  } else if (lowerCaseInput.includes('cardio') || lowerCaseInput.includes('hiit')) {
    return 'hiit';
  } else if (lowerCaseInput.includes('stretch') || lowerCaseInput.includes('yoga')) {
    return 'yoga';
  } else {
    return 'strength';
  }
};

// Updated workout generation function with better error handling and fallbacks
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
    
    // Try to call different API paths to handle potential routing issues
    let response;
    try {
      // First try the normal path
      response = await fetch('/api/workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages
        })
      });
    } catch (firstError) {
      console.log("First API path failed, trying alternate path", firstError);
      
      // If that fails, try with trailing slash
      response = await fetch('/api/workout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages
        })
      });
    }
    
    if (!response.ok) {
      console.error("Error from workout API:", response.status, response.statusText);
      // Use a fallback workout
      return createFallbackWorkout(determineWorkoutType(userRequest));
    }
    
    const data = await response.json();
    console.log("Workout API response:", data);
    
    // Check if we got content back
    if (!data.content) {
      console.error("No content in response:", data);
      // Use a fallback workout
      return createFallbackWorkout(determineWorkoutType(userRequest));
    }
    
    // Return the workout data
    return data.content;
    
  } catch (error) {
    console.error('Error generating workout:', error);
    // Return a fallback workout rather than null
    return createFallbackWorkout(determineWorkoutType(userRequest));
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