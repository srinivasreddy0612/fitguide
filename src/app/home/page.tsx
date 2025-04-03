"use client"
import React, { useState, useEffect } from 'react';
import { Dumbbell, Apple } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import AICoach from './AICoach';
import CalendarComponent from './CalendarComponent';
import WorkoutComponent from './WorkoutComponent';
import DietPlanComponent from './DietPlanComponent';

// Define interfaces for our data types
interface WorkoutHistoryItem {
  id: number;
  date: string;
  workout: string;
  duration: string;
  completed: boolean;
}

interface DietHistoryItem {
  id: number;
  date: string;
  mealName: string;
  dietPlanName: string;
  completed: boolean;
}

interface CustomWorkout {
  id?: number | string;
  title: string;
  description: string;
  duration: string;
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
  icon?: React.ReactNode;
  difficulty: string;
  exercises?: string[];
  workoutType?: 'strength' | 'hiit' | 'yoga' | 'core';
  focusArea?: string;
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

// Define a more specific type with required fields for WorkoutComponent
interface WorkoutComponentWorkout extends CustomWorkout {
  id: number | string; // Make id required for this type
}

export default function HomePage(): React.ReactElement {
  const { user } = useUser();
  const router = useRouter();
  
  // State for showing/hiding the chatbot
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  
  // State for custom workouts created by AI
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  
  // New state for diet plans created by AI
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  
  // State for workout history
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  
  // New state for diet history
  const [dietHistory, setDietHistory] = useState<DietHistoryItem[]>([]);
  
  // State for redirecting to onboarding if needed
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
  
  // Function to toggle chatbot visibility
  const toggleChatbot = (): void => {
    setShowChatbot(prev => !prev);
  };
  
  // Function to add a new workout from AI
  const addWorkout = (workout: CustomWorkout): void => {
    // Make sure we have an icon for the workout
    const workoutWithIcon: CustomWorkout = {
      ...workout,
      icon: workout.icon || <Dumbbell className={workout.iconColor || "text-white"} />,
      // Ensure the id is set if it's undefined
      id: workout.id || Math.floor(Math.random() * 10000)
    };
    
    setCustomWorkouts(prev => [...prev, workoutWithIcon]);
    
    // Also save to localStorage to persist the data
    const existingWorkouts = JSON.parse(localStorage.getItem('customWorkouts') || '[]');
    // Make sure we're storing a serializable version without React elements
    const serializableWorkout = {
      ...workout,
      // Don't include the icon when storing in localStorage as it's a React element
      icon: undefined,
      id: workout.id || Math.floor(Math.random() * 10000)
    };
    localStorage.setItem('customWorkouts', JSON.stringify([...existingWorkouts, serializableWorkout]));
  };
  
  // Function to add a new diet plan from AI
  const addDietPlan = (dietPlan: DietPlan): void => {
    // Make sure we have an icon for the diet plan
    const dietPlanWithIcon: DietPlan = {
      ...dietPlan,
      icon: dietPlan.icon || <Apple className={dietPlan.iconColor || "text-white"} />,
      // Ensure the id is set if it's undefined
      id: dietPlan.id || Math.floor(Math.random() * 10000)
    };
    
    setDietPlans(prev => [...prev, dietPlanWithIcon]);
    
    // Also save to localStorage to persist the data
    const existingDietPlans = JSON.parse(localStorage.getItem('dietPlans') || '[]');
    // Make sure we're storing a serializable version without React elements
    const serializableDietPlan = {
      ...dietPlan,
      // Don't include the icon when storing in localStorage as it's a React element
      icon: undefined,
      id: dietPlan.id || Math.floor(Math.random() * 10000)
    };
    localStorage.setItem('dietPlans', JSON.stringify([...existingDietPlans, serializableDietPlan]));
  };
  
  // Function to redirect to onboarding
  const goToOnboarding = (): void => {
    router.push('/onboarding');
  };
  
  // Check for onboarding status and load workout & diet data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log("HomePage mounted - checking for workout plans and diet plans");
    
    // Check if this is a direct access or coming from onboarding
    const url = new URL(window.location.href);
    const skipCheck = url.searchParams.get('skipOnboardingCheck') === 'true';
    
    // Check both the cookie and localStorage for onboarding completion
    const isOnboardingComplete = document.cookie
      .split('; ')
      .find(row => row.startsWith('onboardingComplete='))
      ?.split('=')[1];
      
    console.log("Onboarding complete from cookie:", isOnboardingComplete);
    
    // If we don't have a cookie but have the localStorage flag, try to set the cookie
    if (!isOnboardingComplete && localStorage.getItem('onboardingComplete') === 'true') {
      console.log("Found onboardingComplete in localStorage but not in cookie, setting cookie");
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
      document.cookie = `onboardingComplete=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
    }
    
    // Determine if we need to redirect to onboarding
    if (!isOnboardingComplete && !skipCheck && !localStorage.getItem('onboardingComplete')) {
      console.log("Needs onboarding - no cookie or localStorage flag");
      setNeedsOnboarding(true);
      return; // Don't load workout data yet
    }
    
    // First try loading the initial workout plan from onboarding
    const initialPlanJson = localStorage.getItem('initialWorkoutPlan');
    
    if (initialPlanJson) {
      try {
        console.log("Found initial workout plan in localStorage");
        const initialPlans = JSON.parse(initialPlanJson);
        
        // Process each workout to ensure it has an icon
        const processedWorkouts = initialPlans.map((workout: CustomWorkout) => ({
          ...workout,
          icon: <Dumbbell className={workout.iconColor || "text-white"} />,
          id: workout.id || Math.floor(Math.random() * 10000)
        }));
        
        // Only add if we don't already have workouts (to avoid duplicates on rerenders)
        if (customWorkouts.length === 0) {
          console.log("Setting initial workout plans:", processedWorkouts);
          setCustomWorkouts(processedWorkouts);
        }
      } catch (error) {
        console.error("Error loading initial workout plan:", error);
      }
    } else {
      console.log("No initial workout plan found in localStorage");
      
      // If no initial plan, try loading custom workouts
      const customWorkoutsJson = localStorage.getItem('customWorkouts');
      if (customWorkoutsJson && customWorkouts.length === 0) {
        try {
          const savedWorkouts = JSON.parse(customWorkoutsJson);
          const processedWorkouts = savedWorkouts.map((workout: CustomWorkout) => ({
            ...workout,
            icon: <Dumbbell className={workout.iconColor || "text-white"} />,
            id: workout.id || Math.floor(Math.random() * 10000)
          }));
          setCustomWorkouts(processedWorkouts);
          console.log("Loaded saved custom workouts:", processedWorkouts);
        } catch (error) {
          console.error("Error loading custom workouts:", error);
        }
      }
    }
    
    // Load diet plans if available
    const dietPlansJson = localStorage.getItem('dietPlans');
    if (dietPlansJson && dietPlans.length === 0) {
      try {
        const savedDietPlans = JSON.parse(dietPlansJson);
        const processedDietPlans = savedDietPlans.map((plan: DietPlan) => ({
          ...plan,
          icon: <Apple className={plan.iconColor || "text-green-500"} />,
          id: plan.id || Math.floor(Math.random() * 10000)
        }));
        setDietPlans(processedDietPlans);
        console.log("Loaded saved diet plans:", processedDietPlans);
      } catch (error) {
        console.error("Error loading diet plans:", error);
      }
    }
    
    // If there's no cookie but we have workout data, try to set the cookie
    if (!isOnboardingComplete && (initialPlanJson || localStorage.getItem('customWorkouts'))) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
      document.cookie = `onboardingComplete=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
      console.log("Set onboardingComplete cookie as it was missing but we have workout data");
    }
    
    // Load workout history if available
    const workoutHistoryJson = localStorage.getItem('workoutHistory');
    if (workoutHistoryJson) {
      try {
        const savedHistory = JSON.parse(workoutHistoryJson);
        setWorkoutHistory(savedHistory);
      } catch (error) {
        console.error("Error loading workout history:", error);
      }
    }
    
    // Load diet history if available
    const dietHistoryJson = localStorage.getItem('dietHistory');
    if (dietHistoryJson) {
      try {
        const savedDietHistory = JSON.parse(dietHistoryJson);
        setDietHistory(savedDietHistory);
      } catch (error) {
        console.error("Error loading diet history:", error);
      }
    }
  }, [customWorkouts.length, dietPlans.length, router]);
  
  // If we need onboarding, redirect after a short delay
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let redirectTimer: NodeJS.Timeout | undefined;
    
    if (needsOnboarding) {
      redirectTimer = setTimeout(() => {
        console.log("Redirecting to onboarding...");
        router.push('/onboarding');
      }, 1000);
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [needsOnboarding, router]);
  
  // Save workout history when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (workoutHistory.length > 0) {
      localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
    }
  }, [workoutHistory]);
  
  // Save diet history when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (dietHistory.length > 0) {
      localStorage.setItem('dietHistory', JSON.stringify(dietHistory));
    }
  }, [dietHistory]);
  
  // If we need onboarding, show a loading state
  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-3"></div>
        <div className="relative text-center">
          <h1 className="text-2xl font-light mb-4">Setting up your fitness journey...</h1>
          <div className="animate-pulse">Redirecting to onboarding...</div>
        </div>
      </div>
    );
  }
  
  // Filter and ensure all workouts have an ID
  const workoutsWithIds: WorkoutComponentWorkout[] = customWorkouts
    .filter((workout): workout is WorkoutComponentWorkout => 
      workout.id !== undefined
    );
  
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-3"></div>
      
      {/* Main container with blur effect */}
      <div className={`relative transition-all duration-300 ${showChatbot ? 'w-1/2' : 'w-full'}`}>
        {/* Navbar Component */}
        <Navbar showChatbot={showChatbot} toggleChatbot={toggleChatbot} />
        
        {/* Main content */}
        <div className="container mx-auto px-4 py-6 transition-all duration-300 ease-in-out">
          <h1 className={`text-3xl font-light mb-4 text-white/90 ${showChatbot ? 'text-left' : 'text-center'}`}>
            Welcome{user?.firstName ? `, ${user.firstName}` : ''} to <span className="font-semibold">FitGuide</span>
          </h1>
          <p className={`text-white/60 mb-8 ${showChatbot ? 'text-left text-xs' : 'text-center text-sm max-w-lg mx-auto'}`}>
            {customWorkouts.length > 0 
              ? "Here's your personalized plan. Select a workout to begin your fitness journey or explore your nutrition plans."
              : "Complete the onboarding process or use the AI coach to create personalized workouts and diet plans."}
          </p>
          
          {/* No workouts message */}
          {customWorkouts.length === 0 && dietPlans.length === 0 && (
            <div className="text-center mb-8 max-w-lg mx-auto p-6 backdrop-blur-lg bg-white/5 rounded-xl border border-white/10">
              <h2 className="text-xl font-medium mb-4 text-white/90">Get Started with Your Fitness Journey</h2>
              <p className="text-white/60 mb-6">You don't have any workouts or nutrition plans yet. Complete the onboarding to create a personalized plan based on your goals.</p>
              <button 
                onClick={goToOnboarding}
                className="bg-white/10 backdrop-blur-sm border border-white/10 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/15 transition mx-auto"
              >
                Create Your Plan
              </button>
              <p className="text-white/40 text-xs mt-4">Or use the AI Coach to create individual workouts and nutrition plans.</p>
            </div>
          )}
          
          {/* Workout Component */}
          <WorkoutComponent 
            showChatbot={showChatbot} 
            setWorkoutHistory={setWorkoutHistory}
            customWorkouts={workoutsWithIds.map(workout => ({
              ...workout,
              icon: workout.icon || <Dumbbell className={workout.iconColor || "text-white"} />
            }))}
            defaultWorkouts={[]} // No more default workouts
          />
          
          {/* Diet Plan Component */}
          <DietPlanComponent
            showChatbot={showChatbot}
            dietPlans={dietPlans}
            setDietHistory={setDietHistory}
          />
          
          {/* Calendar Component */}
          <CalendarComponent 
            showChatbot={showChatbot} 
            workoutHistory={workoutHistory} 
          />
        </div>
      </div>
      
      {/* AI Coach Component */}
      <AICoach 
        showChatbot={showChatbot} 
        toggleChatbot={toggleChatbot}
        addWorkout={addWorkout}
        addDietPlan={addDietPlan}
      />
    </div>
  );
}