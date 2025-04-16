"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Apple } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import AICoach from './AICoach';
import CalendarComponent from './CalendarComponent';
import WorkoutComponent from './WorkoutComponent';
import DietPlanComponent from './DietPlanComponent';

// Import our localStorage helpers
import { getItem, setItem, hasCompletedOnboarding } from '../utils/localStorage';

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
  const { user, isLoaded: isUserLoaded } = useUser();
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
  
  // State to track if data is loaded
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  
  // Function to sync data with MongoDB - UPDATED with cleaner logging
  const syncWithMongoDB = useCallback(async (dataType: string, data: any) => {
    if (!user) return false;
    
    try {
      // Only log for non-history items to reduce console noise
      if (!dataType.includes('History')) {
        console.log(`Syncing ${dataType} with MongoDB...`);
      }
      
      // Ensure all items have unique IDs that won't conflict across resets
      let processedData = data;
      
      // For arrays of items, ensure each has a properly formatted ID
      if (Array.isArray(data) && dataType !== 'workoutHistory' && dataType !== 'dietHistory') {
        processedData = data.map(item => {
          // If no ID exists, create one
          if (!item.id) {
            return { ...item, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
          }
          
          // If ID is just a number (from Date.now()), convert it to a string with prefix
          if (typeof item.id === 'number') {
            return { ...item, id: `${dataType}-${item.id}` };
          }
          
          return item;
        });
      }
      
      // Use the updated API endpoint
      const response = await fetch('/api/mongodb-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          dataType,
          data: processedData,
          action: 'save'
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error(`MongoDB sync error (${dataType}):`, result.error || 'Unknown error');
        
        // Always save to localStorage as fallback
        setItem(dataType, processedData, user.id);
        return false;
      }
      
      // Only log success for non-history items
      if (!dataType.includes('History')) {
        console.log(`✅ MongoDB: ${result.message}`);
      }
      
      // Also save processed data to localStorage for offline access
      setItem(dataType, processedData, user.id);
      
      return true;
    } catch (error) {
      console.error(`Error syncing with MongoDB:`, error);
      
      // Always save to localStorage as fallback
      setItem(dataType, data, user.id);
      
      return false;
    }
  }, [user]);
  
  
  // Function to load data from MongoDB - UPDATED with cleaner logging
  const loadFromMongoDB = useCallback(async () => {
    if (!user) return false;
    
    try {
      console.log("Loading data from MongoDB...");
      
      // Use the middleware-free endpoint
      const response = await fetch('/api/mongodb-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'fetch'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`MongoDB fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }
      
      let itemsLoaded = 0;
      
      // Process workouts if available
      if (data.workouts && data.workouts.length > 0) {
        itemsLoaded += data.workouts.length;
        
        const processedWorkouts = data.workouts.map((workout: CustomWorkout) => ({
          ...workout,
          icon: <Dumbbell className={workout.iconColor || "text-white"} />,
          id: workout.id || `workout-${Math.floor(Math.random() * 10000)}`
        }));
        
        setCustomWorkouts(processedWorkouts);
        
        // Also update localStorage for offline use
        setItem('customWorkouts', data.workouts, user.id);
      }
      
      // Process diet plans if available
      if (data.dietPlans && data.dietPlans.length > 0) {
        itemsLoaded += data.dietPlans.length;
        
        const processedDietPlans = data.dietPlans.map((plan: DietPlan) => ({
          ...plan,
          icon: <Apple className={plan.iconColor || "text-green-500"} />,
          id: plan.id || `diet-${Math.floor(Math.random() * 10000)}`
        }));
        
        setDietPlans(processedDietPlans);
        
        // Also update localStorage for offline use
        setItem('dietPlans', data.dietPlans, user.id);
      }
      
      // Process workout history if available
      if (data.workoutHistory && data.workoutHistory.length > 0) {
        itemsLoaded += data.workoutHistory.length;
        
        setWorkoutHistory(data.workoutHistory);
        
        // Also update localStorage for offline use
        setItem('workoutHistory', data.workoutHistory, user.id);
      }
      
      // Process diet history if available
      if (data.dietHistory && data.dietHistory.length > 0) {
        itemsLoaded += data.dietHistory.length;
        
        setDietHistory(data.dietHistory);
        
        // Also update localStorage for offline use
        setItem('dietHistory', data.dietHistory, user.id);
      }
      
      // Process preferences if available
      if (data.preferences) {
        itemsLoaded += 1;
        
        // Update preferences in localStorage
        setItem('onboardingFormData', data.preferences, user.id);
      }
      
      if (itemsLoaded > 0) {
        console.log(`✅ MongoDB: Loaded ${itemsLoaded} items successfully`);
        return true;
      } else {
        console.log("No data found in MongoDB, falling back to localStorage");
        return false;
      }
    } catch (error) {
      console.error("MongoDB load error:", error);
      console.log("Falling back to localStorage...");
      return false;
    }
  }, [user, setCustomWorkouts, setDietPlans, setWorkoutHistory, setDietHistory]);
  
  // Function to toggle chatbot visibility
  const toggleChatbot = (): void => {
    setShowChatbot(prev => !prev);
  };
  
  // Function to add a new workout from AI with user isolation
  const addWorkout = (workout: CustomWorkout): void => {
    // Make sure we have an icon for the workout
    const workoutWithIcon: CustomWorkout = {
      ...workout,
      icon: workout.icon || <Dumbbell className={workout.iconColor || "text-white"} />,
      // Ensure the id is set if it's undefined
      id: workout.id || Math.floor(Math.random() * 10000)
    };
    
    // Update local state
    setCustomWorkouts(prev => {
      const newWorkouts = [...prev, workoutWithIcon];
      
      // Sync with MongoDB in the background
      if (user) {
        // Create serializable version for storage
        const serializableWorkouts = newWorkouts.map(w => ({
          ...w,
          icon: undefined,
        }));
        
        // Update localStorage
        setItem('customWorkouts', serializableWorkouts, user.id);
        
        // Sync with MongoDB (non-blocking)
        syncWithMongoDB('workout', serializableWorkouts);
      }
      
      return newWorkouts;
    });
  };
  
  // Function to add a new diet plan from AI with user isolation
  const addDietPlan = (dietPlan: DietPlan): void => {
    // Make sure we have an icon for the diet plan
    const dietPlanWithIcon: DietPlan = {
      ...dietPlan,
      icon: dietPlan.icon || <Apple className={dietPlan.iconColor || "text-white"} />,
      // Ensure the id is set if it's undefined
      id: dietPlan.id || Math.floor(Math.random() * 10000)
    };
    
    // Update local state
    setDietPlans(prev => {
      const newDietPlans = [...prev, dietPlanWithIcon];
      
      // Sync with MongoDB in the background
      if (user) {
        // Create serializable version for storage
        const serializableDietPlans = newDietPlans.map(plan => ({
          ...plan,
          icon: undefined,
        }));
        
        // Update localStorage
        setItem('dietPlans', serializableDietPlans, user.id);
        
        // Sync with MongoDB (non-blocking)
        syncWithMongoDB('dietPlan', serializableDietPlans);
      }
      
      return newDietPlans;
    });
  };
  
  // Function to redirect to onboarding
  const goToOnboarding = (): void => {
    router.push('/onboarding');
  };
  
  // Check if user needs onboarding when loaded
  useEffect(() => {
    if (!isUserLoaded || !user) return;
    
    console.log("Checking if user needs onboarding...");
    
    // Check if the URL includes the skip parameter
    const url = new URL(window.location.href);
    const skipCheck = url.searchParams.get('skipOnboardingCheck') === 'true';
    
    if (skipCheck) {
      // Skip onboarding check if explicitly requested
      console.log("Skipping onboarding check due to URL parameter");
      loadUserData();
      return;
    }
    
    // For new users, do a more aggressive check
    // Check localStorage directly for ANY user data
    if (typeof window !== 'undefined') {
      const allLocalStorageKeys = Object.keys(localStorage);
      const userKeys = allLocalStorageKeys.filter(key => key.includes(user.id));
      console.log("User localStorage keys:", userKeys);
      
      // If the user has NO data at all, they're definitely new
      if (userKeys.length === 0) {
        console.log("New user detected - no localStorage keys found");
        setNeedsOnboarding(true);
        return;
      }
    }
    
    // Regular onboarding check for returning users
    const onboardingComplete = hasCompletedOnboarding(user.id);
    
    if (!onboardingComplete) {
      console.log("User needs onboarding - redirecting");
      setNeedsOnboarding(true);
    } else {
      console.log("Onboarding complete, loading user data");
      loadUserData();
    }
  }, [isUserLoaded, user, loadFromMongoDB]);
  
  // Function to load user-specific data
  const loadUserData = async (): Promise<void> => {
    if (!user) return;
    
    console.log("Loading data for user:", user.id);
    
    try {
      // Try to load from MongoDB first
      try {
        const mongoSuccess = await loadFromMongoDB();
        
        // If MongoDB loading was successful, we're done
        if (mongoSuccess) {
          setIsDataLoaded(true);
          return;
        }
        
        // Otherwise, fall back to localStorage
        console.log("No data found in MongoDB, falling back to localStorage");
      } catch (mongoError) {
        console.error("Error loading from MongoDB, falling back to localStorage:", mongoError);
      }
      
      // Immediately after navigation from onboarding, check URL parameters
      const url = new URL(window.location.href);
      const skipCheck = url.searchParams.get('skipOnboardingCheck') === 'true';
      
      // Force a small delay when coming directly from onboarding
      // to ensure localStorage has time to be fully updated
      if (skipCheck) {
        console.log("Coming from onboarding, waiting briefly for storage to settle");
      }
      
      // Load initial workout plan - most critical part for onboarding users
      const initialPlanJson = getItem('initialWorkoutPlan', user.id);
      console.log("Retrieved initial plan from localStorage:", initialPlanJson);
      
      if (initialPlanJson && Array.isArray(initialPlanJson) && initialPlanJson.length > 0) {
        console.log("Loading initial workout plan with", initialPlanJson.length, "workouts");
        
        const processedWorkouts = initialPlanJson.map((workout: CustomWorkout) => ({
          ...workout,
          icon: <Dumbbell className={workout.iconColor || "text-white"} />,
          id: workout.id || Math.floor(Math.random() * 10000)
        }));
        
        setCustomWorkouts(processedWorkouts);
        console.log("Successfully loaded", processedWorkouts.length, "workouts from initial plan");
        
        // Also ensure these are saved to customWorkouts for consistency
        if (processedWorkouts.length > 0) {
          const serializableWorkouts = processedWorkouts.map(workout => ({
            ...workout,
            icon: undefined  // Don't include React elements
          }));
          setItem('customWorkouts', serializableWorkouts, user.id);
          console.log("Also saved to customWorkouts for consistency");
          
          // Sync with MongoDB
          syncWithMongoDB('workout', serializableWorkouts);
        }
      } else {
        // Troubleshooting if workout plan not found
        console.log("Initial workout plan not found or empty, checking for custom workouts");
        
        // Try to get all localStorage keys for this user
        if (typeof window !== 'undefined') {
          // Debug what's in localStorage
          const allLocalStorageKeys = Object.keys(localStorage);
          const userKeys = allLocalStorageKeys.filter(key => key.includes(user.id));
          console.log("All user localStorage keys:", userKeys);
        }
        
        // Load custom workouts if no initial plan
        const customWorkoutsJson = getItem('customWorkouts', user.id);
        
        if (customWorkoutsJson && Array.isArray(customWorkoutsJson) && customWorkoutsJson.length > 0) {
          console.log("Loading", customWorkoutsJson.length, "custom workouts");
          
          const processedWorkouts = customWorkoutsJson.map((workout: CustomWorkout) => ({
            ...workout,
            icon: <Dumbbell className={workout.iconColor || "text-white"} />,
            id: workout.id || Math.floor(Math.random() * 10000)
          }));
          
          setCustomWorkouts(processedWorkouts);
          console.log("Successfully loaded custom workouts");
          
          // Sync with MongoDB
          syncWithMongoDB('workout', customWorkoutsJson);
        } else if (skipCheck) {
          // If we came from onboarding but no data found, try once more after delay
          console.log("Came from onboarding but no data found. Trying once more after delay...");
          
          setTimeout(() => {
            const initialPlanRetry = getItem('initialWorkoutPlan', user.id);
            if (initialPlanRetry && Array.isArray(initialPlanRetry) && initialPlanRetry.length > 0) {
              console.log("Found data after retry!");
              const processedWorkouts = initialPlanRetry.map((workout: CustomWorkout) => ({
                ...workout,
                icon: <Dumbbell className={workout.iconColor || "text-white"} />,
                id: workout.id || Math.floor(Math.random() * 10000)
              }));
              
              setCustomWorkouts(processedWorkouts);
              
              // Sync with MongoDB
              syncWithMongoDB('workout', initialPlanRetry);
            }
          }, 1000);
        } else {
          console.log("No workout data found for user, they may need to complete onboarding");
        }
      }
      
      // Load diet plans
      const dietPlansJson = getItem('dietPlans', user.id);
      if (dietPlansJson && Array.isArray(dietPlansJson) && dietPlansJson.length > 0) {
        console.log("Loading diet plans");
        const processedDietPlans = dietPlansJson.map((plan: DietPlan) => ({
          ...plan,
          icon: <Apple className={plan.iconColor || "text-green-500"} />,
          id: plan.id || Math.floor(Math.random() * 10000)
        }));
        
        setDietPlans(processedDietPlans);
        
        // Sync with MongoDB
        syncWithMongoDB('dietPlan', dietPlansJson);
      }
      
      // Load workout history
      const workoutHistoryJson = getItem('workoutHistory', user.id);
      if (workoutHistoryJson && Array.isArray(workoutHistoryJson)) {
        console.log("Loading workout history");
        setWorkoutHistory(workoutHistoryJson);
        
        // Sync with MongoDB
        syncWithMongoDB('workoutHistory', workoutHistoryJson);
      }
      
      // Load diet history
      const dietHistoryJson = getItem('dietHistory', user.id);
      if (dietHistoryJson && Array.isArray(dietHistoryJson)) {
        console.log("Loading diet history");
        setDietHistory(dietHistoryJson);
        
        // Sync with MongoDB
        syncWithMongoDB('dietHistory', dietHistoryJson);
      }
      
      // Mark data as loaded
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsDataLoaded(true); // Still mark as loaded even on error
    }
  };
  
  // If we need onboarding, redirect after a short delay
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let redirectTimer: NodeJS.Timeout | undefined;
    
    if (needsOnboarding) {
      redirectTimer = setTimeout(() => {
        console.log("Redirecting to onboarding...");
        router.push('/onboarding');
      }, 500);
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [needsOnboarding, router]);
  
  // Save workout history when it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !user || workoutHistory.length === 0) return;
    
    // Save to localStorage
    setItem('workoutHistory', workoutHistory, user.id);
    
    // Also sync with MongoDB
    syncWithMongoDB('workoutHistory', workoutHistory);
  }, [workoutHistory, user, syncWithMongoDB]);
  
  // Save diet history when it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !user || dietHistory.length === 0) return;
    
    // Save to localStorage
    setItem('dietHistory', dietHistory, user.id);
    
    // Also sync with MongoDB
    syncWithMongoDB('dietHistory', dietHistory);
  }, [dietHistory, user, syncWithMongoDB]);
  
  // If not loaded or needs onboarding, show a loading state
  if (!isUserLoaded || needsOnboarding || !isDataLoaded) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-3"></div>
        <div className="relative text-center">
          <h1 className="text-2xl font-light mb-4">
            {needsOnboarding 
              ? "Setting up your fitness journey..." 
              : "Loading your personal fitness data..."}
          </h1>
          <div className="animate-pulse">
            {needsOnboarding 
              ? "Redirecting to onboarding..." 
              : "Please wait..."}
          </div>
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