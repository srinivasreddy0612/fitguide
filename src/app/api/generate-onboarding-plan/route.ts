// app/api/generate-onboarding-plan/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// Define types for better type safety
type WorkoutType = 'strength' | 'hiit' | 'yoga' | 'core';

interface UserPreferences {
  name?: string;
  fitnessGoal?: string;
  experienceLevel: string;
  workoutFrequency: string;
  workoutDuration: string;
  preferredWorkoutTypes?: string[];
  limitations?: string[];
}

interface Workout {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  workoutType: WorkoutType;
  exercises: string[];
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
}

// Function to generate a workout plan based on user preferences
export async function POST(request: Request) {
  try {
    // Verify authentication
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log("API route called - generate-onboarding-plan");

    // Extract data from request
    const body = await request.json();
    const { userData } = body;

    // Validate data
    if (!userData) {
      console.error("Missing userData in request");
      return NextResponse.json({ error: "Missing userData" }, { status: 400 });
    }

    console.log("Received user preferences for workout generation");

    // Extract user preferences
    const {
      name,
      fitnessGoal,
      experienceLevel,
      workoutFrequency,
      workoutDuration,
      preferredWorkoutTypes,
      limitations
    } = userData as UserPreferences;

    // Validate required fields
    if (!experienceLevel || !workoutFrequency || !workoutDuration) {
      console.error("Missing required fields in userData");
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: { experienceLevel, workoutFrequency, workoutDuration } 
      }, { status: 400 });
    }

    // Determine how many workouts to generate based on frequency
    let workoutsPerWeek = 3;
    if (workoutFrequency === '2-3') {
      workoutsPerWeek = 3;
    } else if (workoutFrequency === '3-4') {
      workoutsPerWeek = 4;
    } else if (workoutFrequency === '5+') {
      workoutsPerWeek = 5;
    }

    console.log(`Generating ${workoutsPerWeek} workouts based on frequency: ${workoutFrequency}`);

    // Create workouts array
    const workouts: Workout[] = [];
    
    // Define workout types based on user preferences
    let workoutTypes: string[] = preferredWorkoutTypes || [];
    if (workoutTypes.length === 0 || workoutTypes.includes('none')) {
      workoutTypes = ['strength', 'hiit', 'yoga', 'core'];
    }
    
    console.log(`Using workout types: ${workoutTypes.join(', ')}`);
    
    // Ensure we have enough types to fill the week
    while (workoutTypes.length < workoutsPerWeek) {
      workoutTypes = [...workoutTypes, ...workoutTypes];
    }
    
    // Generate workouts for each day
    for (let i = 0; i < workoutsPerWeek; i++) {
      const workoutType = workoutTypes[i % workoutTypes.length] as WorkoutType;
      
      // Define workout color scheme based on type
      let color = 'from-purple-500/40 to-indigo-600/40';
      let borderColor = 'border-purple-500/20';
      let iconColor = 'text-purple-500';
      let iconBg = 'bg-purple-500/10';
      
      if (workoutType === 'hiit') {
        color = 'from-red-500/40 to-orange-600/40';
        borderColor = 'border-red-500/20';
        iconColor = 'text-red-500';
        iconBg = 'bg-red-500/10';
      } else if (workoutType === 'yoga') {
        color = 'from-blue-500/40 to-teal-600/40';
        borderColor = 'border-blue-500/20';
        iconColor = 'text-blue-500';
        iconBg = 'bg-blue-500/10';
      } else if (workoutType === 'core') {
        color = 'from-green-500/40 to-emerald-600/40';
        borderColor = 'border-green-500/20';
        iconColor = 'text-green-500';
        iconBg = 'bg-green-500/10';
      }
      
      // Select a focus area based on type and fitness goal
      let focusArea = '';
      let exercises: string[] = [];
      
      if (workoutType === 'strength') {
        if (fitnessGoal === 'build-muscle') {
          focusArea = i % 2 === 0 ? 'Upper Body' : 'Lower Body';
        } else {
          const areas = ['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Push/Pull'];
          focusArea = areas[i % areas.length];
        }
        
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
        } else if (focusArea === 'Full Body') {
          exercises = [
            '3 sets of 10 push-ups',
            '3 sets of 12 squats',
            '3 sets of 10 dumbbell rows',
            '3 sets of 10 lunges per leg',
            '3 sets of 15 crunches'
          ];
        } else if (focusArea === 'Core') {
          exercises = [
            '3 sets of 20 crunches',
            '3 sets of 30-sec planks',
            '3 sets of 15 Russian twists',
            '3 sets of 12 leg raises',
            '3 sets of 20 bicycle crunches'
          ];
        } else if (focusArea === 'Push/Pull') {
          exercises = [
            '3 sets of 10 push-ups',
            '3 sets of 10 dumbbell rows',
            '3 sets of 10 shoulder press',
            '3 sets of 10 pull-ups or lat pulldowns',
            '3 sets of 10 tricep extensions'
          ];
        }
      } else if (workoutType === 'hiit') {
        const areas = ['Cardio', 'Fat Burn', 'Endurance', 'Power'];
        focusArea = areas[i % areas.length];
        
        if (focusArea === 'Cardio') {
          exercises = [
            '30 sec jumping jacks, 15 sec rest',
            '30 sec high knees, 15 sec rest',
            '30 sec burpees, 15 sec rest',
            '30 sec mountain climbers, 15 sec rest',
            '30 sec squat jumps, 15 sec rest',
            'Repeat 4 times'
          ];
        } else if (focusArea === 'Fat Burn') {
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
        } else if (focusArea === 'Power') {
          exercises = [
            '30 sec box jumps or squat jumps, 30 sec rest',
            '30 sec burpees, 30 sec rest',
            '30 sec plyo push-ups, 30 sec rest',
            '30 sec jump lunges, 30 sec rest',
            'Repeat 3-4 times'
          ];
        }
      } else if (workoutType === 'yoga') {
        const areas = ['Flexibility', 'Balance', 'Recovery', 'Strength'];
        focusArea = areas[i % areas.length];
        
        if (focusArea === 'Flexibility') {
          exercises = [
            '5 min sun salutations',
            '1 min each side warrior II pose',
            '1 min each side triangle pose',
            '1 min each side seated forward fold',
            '5 min final relaxation'
          ];
        } else if (focusArea === 'Balance') {
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
        } else if (focusArea === 'Strength') {
          exercises = [
            '5 min sun salutations',
            '1 min each side warrior I, II, and III',
            '1 min each side plank pose',
            '1 min chair pose',
            '5 min final relaxation'
          ];
        }
      } else if (workoutType === 'core') {
        const areas = ['Abs', 'Obliques', 'Lower Back', 'Stability'];
        focusArea = areas[i % areas.length];
        
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
        } else if (focusArea === 'Lower Back') {
          exercises = [
            '3 sets of 12 supermans',
            '3 sets of 10 bird-dogs each side',
            '3 sets of 12 glute bridges',
            '3 sets of 30-sec planks',
            '3 sets of 15 pelvic tilts'
          ];
        } else if (focusArea === 'Stability') {
          exercises = [
            '3 sets of 30-sec planks',
            '3 sets of 20-sec side planks each side',
            '3 sets of 10 stability ball rollouts',
            '3 sets of 30-sec hollow holds',
            '3 sets of 10 plank shoulder taps each side'
          ];
        }
      }
      
      // Check for limitations and adjust exercises if needed
      if (limitations && limitations.length > 0 && !limitations.includes('none')) {
        // Basic adaptation for common limitations
        if (limitations.includes('knee')) {
          exercises = exercises.map(ex => 
            ex.includes('squat') || ex.includes('lunge') || ex.includes('jump')
              ? ex.replace('jump', 'modified') + ' (modify for knee issues)'
              : ex
          );
        }
        
        if (limitations.includes('back')) {
          exercises = exercises.map(ex => 
            ex.includes('deadlift') || ex.includes('twist') || ex.includes('sit-up')
              ? ex + ' (modify for back issues)'
              : ex
          );
        }
        
        if (limitations.includes('shoulder')) {
          exercises = exercises.map(ex => 
            ex.includes('push-up') || ex.includes('press') || ex.includes('plank')
              ? ex + ' (modify for shoulder issues)'
              : ex
          );
        }
      }
      
      // If the user is a beginner, make the exercises easier
      if (experienceLevel === 'beginner') {
        exercises = exercises.map(ex => {
          return ex.replace('3 sets', '2 sets')
                   .replace('30-sec', '20-sec')
                   .replace('Repeat 4-5 times', 'Repeat 3 times')
                   .replace('Repeat 4 times', 'Repeat 2-3 times')
                   .replace('Repeat 3-4 times', 'Repeat 2 times');
        });
      }
      // If the user is advanced, make them harder
      else if (experienceLevel === 'advanced') {
        exercises = exercises.map(ex => {
          return ex.replace('3 sets', '4 sets')
                   .replace('30-sec', '45-sec')
                   .replace('Repeat 4-5 times', 'Repeat 5-6 times')
                   .replace('Repeat 4 times', 'Repeat 5 times')
                   .replace('Repeat 3-4 times', 'Repeat 4-5 times');
        });
      }
      
      // Determine workout duration
      let duration = '30 min';
      if (workoutDuration === '15-30') {
        duration = '25 min';
      } else if (workoutDuration === '30-45') {
        duration = '40 min';
      } else if (workoutDuration === '45-60') {
        duration = '50 min';
      } else if (workoutDuration === '60+') {
        duration = '60 min';
      }
      
      // Create workout object
      const workout: Workout = {
        id: i + 1,
        title: `Day ${i + 1}: ${focusArea}`,
        description: `A ${experienceLevel} level ${workoutType} workout focusing on ${focusArea.toLowerCase()}.`,
        duration: duration,
        difficulty: experienceLevel === 'beginner' ? 'Beginner' : 
                  experienceLevel === 'intermediate' ? 'Intermediate' : 'Advanced',
        workoutType: workoutType,
        exercises: exercises,
        color: color,
        borderColor: borderColor,
        iconColor: iconColor,
        iconBg: iconBg
      };
      
      workouts.push(workout);
    }

    console.log(`Successfully generated ${workouts.length} workouts`);

    // Return the workout plan
    return NextResponse.json({
      workoutPlan: workouts,
      message: "Workout plan generated successfully"
    });
  } catch (error) {
    console.error('Error in generate-onboarding-plan API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}