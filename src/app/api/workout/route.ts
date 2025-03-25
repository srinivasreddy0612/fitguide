// app/api/workout/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request: Request) {
  console.log("Workout API route called");
  
  try {
    // Get the authenticated user
    const { userId } = auth();
    
    // Check if the user is authenticated
    if (!userId) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }
    
    const { messages } = body;
    
    // Check if messages is valid
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid or missing messages array in request");
      return NextResponse.json({ 
        error: 'Invalid request: messages array required' 
      }, { status: 400 });
    }
    
    // Verify that GROQ_API_KEY is defined
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not defined in environment variables');
      
      // Fallback to a simple workout instead of failing
      console.log("Using fallback workout due to missing API key");
      return NextResponse.json({ 
        content: createFallbackWorkout("core")
      });
    }
    
    console.log(`Calling Groq API for workout generation with ${messages.length} messages`);
    
    // Call Groq API with error handling and timeout
    try {
      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3-8b-8192', // Try a different model that's definitely available
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      
      // Check for response status
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Groq API error response:', errorData);
        
        // Use fallback workout if API fails
        const workoutType = determineWorkoutType(messages);
        return NextResponse.json({ 
          content: createFallbackWorkout(workoutType)
        });
      }
      
      const data = await response.json();
      console.log('Successfully received workout data from Groq');
      
      try {
        // Extract the JSON response
        const jsonResponse = data.choices[0].message.content;
        
        // Try to parse the JSON
        let workoutData;
        try {
          workoutData = JSON.parse(jsonResponse);
        } catch (parseError) {
          console.error('Error parsing workout JSON:', parseError);
          console.error('Raw content:', jsonResponse);
          
          // Use fallback workout if parsing fails
          const workoutType = determineWorkoutType(messages);
          return NextResponse.json({ 
            content: createFallbackWorkout(workoutType)
          });
        }
        
        // Validate the workout data
        if (!workoutData.title || !workoutData.workoutType || !workoutData.exercises) {
          console.error('Invalid workout data structure:', workoutData);
          
          // Use fallback workout if data is invalid
          const workoutType = determineWorkoutType(messages);
          return NextResponse.json({ 
            content: createFallbackWorkout(workoutType)
          });
        }
        
        // Add visual styling based on workout type
        const styleInfo = getWorkoutStyles(workoutData.workoutType);
        
        // Create the complete workout object
        const workout = {
          id: Math.floor(Math.random() * 1000) + 5,
          title: workoutData.title,
          description: workoutData.description,
          workoutType: workoutData.workoutType,
          difficulty: workoutData.difficulty,
          duration: workoutData.duration,
          exercises: workoutData.exercises,
          ...styleInfo
        };
        
        return NextResponse.json({ content: workout });
        
      } catch (processingError) {
        console.error('Error processing workout response:', processingError);
        
        // Use fallback workout if processing fails
        const workoutType = determineWorkoutType(messages);
        return NextResponse.json({ 
          content: createFallbackWorkout(workoutType)
        });
      }
      
    } catch (fetchError) {
      console.error('Error fetching from Groq API:', fetchError);
      
      // Handle timeout specifically
      if (fetchError.name === 'AbortError') {
        console.log("Request to Groq API timed out");
      }
      
      // Use fallback workout for any fetch error
      const workoutType = determineWorkoutType(messages);
      return NextResponse.json({ 
        content: createFallbackWorkout(workoutType)
      });
    }
    
  } catch (error) {
    console.error('Workout API unhandled error:', error);
    
    // Return a fallback workout rather than an error
    return NextResponse.json({ 
      content: createFallbackWorkout("core")
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

// Create a fallback workout when API fails
function createFallbackWorkout(workoutType: 'strength' | 'hiit' | 'yoga' | 'core') {
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