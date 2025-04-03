// src/app/api/workout/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { messages } = body;
    
    // Check if messages is valid
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ 
        error: 'Invalid request: messages array required' 
      }, { status: 400 });
    }
    
    // Use the correct environment variable name
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      console.log('API key not configured: NEXT_PUBLIC_GROQ_API_KEY is missing, using fallback workout');
      
      // Create a fallback workout
      const workoutType = determineWorkoutType(messages);
      const focusArea = determineFocusArea(workoutType, messages);
      return NextResponse.json({ 
        content: createStandardizedWorkout(workoutType, focusArea)
      });
    }
    
    console.log('Calling Groq API for workout generation with model: llama3-8b-8192');
    
    // Create enhanced prompt to match the standardized format
    const enhancedMessages = [
      ...messages.slice(0, messages.length - 1),
      {
        role: 'system',
        content: `When creating the workout, please make sure to include a specific focus area for the workout, such as "Upper Body", "Lower Body", "Core", "Full Body", etc. This focus area should be returned in the JSON response as a "focusArea" field.`
      },
      messages[messages.length - 1]
    ];
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: enhancedMessages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    
    // Check for response status
    if (!response.ok) {
      console.log('Groq API error, using fallback workout');
      
      // Use fallback workout if API fails
      const workoutType = determineWorkoutType(messages);
      const focusArea = determineFocusArea(workoutType, messages);
      return NextResponse.json({ 
        content: createStandardizedWorkout(workoutType, focusArea)
      });
    }
    
    const data = await response.json();
    
    try {
      // Extract the JSON response
      const jsonResponse = data.choices[0].message.content;
      
      // Try to parse the JSON
      let workoutData;
      try {
        workoutData = JSON.parse(jsonResponse);
      } catch (parseError) {
        console.log('Error parsing workout JSON, using fallback');
        
        // Use fallback workout if parsing fails
        const workoutType = determineWorkoutType(messages);
        const focusArea = determineFocusArea(workoutType, messages);
        return NextResponse.json({ 
          content: createStandardizedWorkout(workoutType, focusArea)
        });
      }
      
      // Validate the workout data
      if (!workoutData.title || !workoutData.workoutType || !workoutData.exercises) {
        console.log('Invalid workout data structure, using fallback');
        
        // Use fallback workout if data is invalid
        const workoutType = determineWorkoutType(messages);
        const focusArea = determineFocusArea(workoutType, messages);
        return NextResponse.json({ 
          content: createStandardizedWorkout(workoutType, focusArea)
        });
      }
      
      // Extract data from the API response
      const { 
        workoutType = 'strength', 
        difficulty = 'Intermediate',
        exercises = [],
        focusArea = determineFocusArea(workoutData.workoutType, messages)
      } = workoutData;
      
      // Add visual styling based on workout type
      const styleInfo = getWorkoutStyles(workoutType);
      
      // Generate an ID based on timestamp to ensure uniqueness
      const id = Date.now();
      
      // Create the standardized workout object (matching onboarding format)
      const workout = {
        id,
        // Use the standardized title format: "Day X: Focus Area"
        title: `New Workout: ${focusArea}`,
        description: `A ${difficulty.toLowerCase()} level ${workoutType} workout focusing on ${focusArea.toLowerCase()}.`,
        workoutType,
        difficulty,
        duration: workoutData.duration || "30-45 min",
        exercises,
        focusArea,
        ...styleInfo
      };
      
      return NextResponse.json({ content: workout });
      
    } catch (processingError) {
      console.log('Error processing workout response, using fallback');
      
      // Use fallback workout if processing fails
      const workoutType = determineWorkoutType(messages);
      const focusArea = determineFocusArea(workoutType, messages);
      return NextResponse.json({ 
        content: createStandardizedWorkout(workoutType, focusArea)
      });
    }
    
  } catch (error) {
    console.error('Workout API error:', error);
    
    // Return a fallback workout rather than an error
    return NextResponse.json({ 
      content: createStandardizedWorkout("core", "Abs")
    });
  }
}

// Helper function to determine workout type from messages
function determineWorkoutType(messages: any[]): 'strength' | 'hiit' | 'yoga' | 'core' {
  try {
    // Get the user's message content (usually the last message)
    const userMessage = messages.find(msg => msg.role === 'user')?.content || '';
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (lowerCaseMessage.includes('abs') || lowerCaseMessage.includes('core')) {
      return 'core';
    } else if (lowerCaseMessage.includes('cardio') || lowerCaseMessage.includes('hiit')) {
      return 'hiit';
    } else if (lowerCaseMessage.includes('stretch') || lowerCaseMessage.includes('yoga')) {
      return 'yoga';
    } else {
      return 'strength';
    }
  } catch (error) {
    console.error('Error determining workout type:', error);
    return 'strength'; // Default fallback
  }
}

// Helper function to determine focus area based on workout type and user message
function determineFocusArea(workoutType: string, messages: any[]): string {
  try {
    const userMessage = messages.find(msg => msg.role === 'user')?.content || '';
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (workoutType === 'strength') {
      if (lowerCaseMessage.includes('upper') || 
          lowerCaseMessage.includes('arm') || 
          lowerCaseMessage.includes('chest') || 
          lowerCaseMessage.includes('shoulder')) {
        return 'Upper Body';
      } else if (lowerCaseMessage.includes('lower') || 
                lowerCaseMessage.includes('leg') || 
                lowerCaseMessage.includes('glute') || 
                lowerCaseMessage.includes('quad')) {
        return 'Lower Body';
      } else if (lowerCaseMessage.includes('full')) {
        return 'Full Body';
      } else {
        // Default based on workout type
        return 'Full Body';
      }
    } else if (workoutType === 'core') {
      if (lowerCaseMessage.includes('oblique')) {
        return 'Obliques';
      } else if (lowerCaseMessage.includes('lower')) {
        return 'Lower Core';
      } else {
        return 'Abs';
      }
    } else if (workoutType === 'hiit') {
      if (lowerCaseMessage.includes('fat') || lowerCaseMessage.includes('burn')) {
        return 'Fat Burn';
      } else if (lowerCaseMessage.includes('endurance')) {
        return 'Endurance';
      } else {
        return 'Cardio';
      }
    } else if (workoutType === 'yoga') {
      if (lowerCaseMessage.includes('balance')) {
        return 'Balance';
      } else if (lowerCaseMessage.includes('recovery') || lowerCaseMessage.includes('relax')) {
        return 'Recovery';
      } else {
        return 'Flexibility';
      }
    }
    
    // Default focus areas for each workout type
    const defaultFocusAreas = {
      'strength': 'Full Body',
      'hiit': 'Cardio',
      'yoga': 'Flexibility',
      'core': 'Abs'
    };
    
    return defaultFocusAreas[workoutType as keyof typeof defaultFocusAreas] || 'General';
  } catch (error) {
    console.error('Error determining focus area:', error);
    return 'General'; // Default fallback
  }
}

// Create a standardized workout (matching onboarding format)
function createStandardizedWorkout(
  workoutType: 'strength' | 'hiit' | 'yoga' | 'core', 
  focusArea: string
) {
  const styleInfo = getWorkoutStyles(workoutType);
  let difficulty = 'Intermediate';
  let duration = '30-45 min';
  let exercises: string[] = [];
  
  // Generate a unique ID based on timestamp
  const id = Date.now();
  
  switch (workoutType) {
    case 'core':
      if (focusArea === 'Abs') {
        exercises = [
          '3 sets of 20 crunches',
          '3 sets of 15 leg raises',
          '3 sets of 20 bicycle crunches',
          '3 sets of 30-sec planks',
          '3 sets of 15 toe touches'
        ];
      } else if (focusArea === 'Obliques') {
        exercises = [
          '3 sets of 15 Russian twists',
          '3 sets of 10 side planks each side',
          '3 sets of 15 standing side bends',
          '3 sets of 15 bicycle crunches',
          '3 sets of 15 side crunches each side'
        ];
      } else if (focusArea === 'Lower Core') {
        exercises = [
          '3 sets of 15 reverse crunches',
          '3 sets of 15 leg raises',
          '3 sets of 15 flutter kicks',
          '3 sets of 20-sec hollow holds',
          '3 sets of 15 hip raises'
        ];
      } else {
        exercises = [
          '3 sets of 20 crunches',
          '3 sets of 30-second planks',
          '3 sets of 15 Russian twists',
          '3 sets of 12 leg raises',
          '3 sets of 20 bicycle crunches',
          '3 sets of 15 mountain climbers'
        ];
      }
      break;
      
    case 'hiit':
      if (focusArea === 'Fat Burn') {
        exercises = [
          '40 sec jump squats, 20 sec rest',
          '40 sec burpees, 20 sec rest',
          '40 sec mountain climbers, 20 sec rest',
          '40 sec high knees, 20 sec rest',
          'Repeat 4 times'
        ];
      } else if (focusArea === 'Endurance') {
        exercises = [
          '45 sec jumping jacks, 15 sec rest',
          '45 sec burpees, 15 sec rest',
          '45 sec jump lunges, 15 sec rest',
          '45 sec squat jumps, 15 sec rest',
          'Repeat 3-4 times'
        ];
      } else {
        exercises = [
          '30 sec jumping jacks, 15 sec rest',
          '30 sec high knees, 15 sec rest',
          '30 sec burpees, 15 sec rest',
          '30 sec mountain climbers, 15 sec rest',
          '30 sec squat jumps, 15 sec rest',
          'Repeat circuit 4 times'
        ];
      }
      break;
      
    case 'yoga':
      if (focusArea === 'Balance') {
        exercises = [
          '5 min warm-up poses',
          '1 min each side tree pose',
          '1 min each side warrior III',
          '1 min each side eagle pose',
          '5 min final relaxation'
        ];
      } else if (focusArea === 'Recovery') {
        exercises = [
          '5 min gentle stretches',
          '2 min child\'s pose',
          '2 min each side pigeon pose',
          '2 min supported bridge pose',
          '5 min final relaxation'
        ];
      } else {
        exercises = [
          '5 min warm-up with gentle stretches',
          '5 min sun salutations',
          '1 min each side warrior II pose',
          '1 min each side triangle pose',
          '5 min balance poses',
          '5 min seated stretches',
          '5 min final relaxation'
        ];
      }
      break;
      
    default: // strength
      if (focusArea === 'Upper Body') {
        exercises = [
          '3 sets of 10-12 push-ups',
          '3 sets of 10-12 dumbbell shoulder press',
          '3 sets of 10-12 dumbbell rows',
          '3 sets of 10-12 bicep curls',
          '3 sets of 10-12 tricep dips'
        ];
      } else if (focusArea === 'Lower Body') {
        exercises = [
          '3 sets of 12 squats',
          '3 sets of 10 lunges per leg',
          '3 sets of 12 deadlifts',
          '3 sets of 15 calf raises',
          '3 sets of 12 glute bridges'
        ];
      } else {
        exercises = [
          '3 sets of 12 squats',
          '3 sets of 10 push-ups',
          '3 sets of 10 dumbbell rows',
          '3 sets of 10 lunges per leg',
          '3 sets of 10 shoulder presses',
          '3 sets of 10 glute bridges',
          '3 sets of 30-second planks'
        ];
      }
      break;
  }
  
  return {
    id,
    title: `New Workout: ${focusArea}`,
    description: `A ${difficulty.toLowerCase()} level ${workoutType} workout focusing on ${focusArea.toLowerCase()}.`,
    workoutType,
    difficulty,
    duration,
    exercises,
    focusArea,
    ...styleInfo
  };
}

// Helper function to get the visual styling based on workout type
function getWorkoutStyles(workoutType: string): {
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
} {
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
}