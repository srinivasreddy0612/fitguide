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

import { getItem, setItem, hasCompletedOnboarding } from '../utils/localStorage';

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

interface WorkoutComponentWorkout extends CustomWorkout {
  id: number | string;
}

export default function HomePage(): React.ReactElement {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [dietHistory, setDietHistory] = useState<DietHistoryItem[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  
  const syncWithMongoDB = useCallback(async (dataType: string, data: any) => {
    if (!user) return false;
    
    try {
      if (!dataType.includes('History')) {
        console.log(`Syncing ${dataType} with MongoDB...`);
      }
      
      let processedData = data;
      
      if (Array.isArray(data) && dataType !== 'workoutHistory' && dataType !== 'dietHistory') {
        processedData = data.map(item => {
          if (!item.id) {
            return { ...item, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
          }
          
          if (typeof item.id === 'number') {
            return { ...item, id: `${dataType}-${item.id}` };
          }
          
          return item;
        });
      }
      
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
        
        setItem(dataType, processedData, user.id);
        return false;
      }
      
      if (!dataType.includes('History')) {
        console.log(`✅ MongoDB: ${result.message}`);
      }
      
      setItem(dataType, processedData, user.id);
      
      return true;
    } catch (error) {
      console.error(`Error syncing with MongoDB:`, error);
      
      setItem(dataType, data, user.id);
      
      return false;
    }
  }, [user]);
  
  const loadFromMongoDB = useCallback(async () => {
    if (!user) return false;
    
    try {
      console.log("Loading data from MongoDB...");
      
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
      
      if (data.workouts && data.workouts.length > 0) {
        itemsLoaded += data.workouts.length;
        
        const processedWorkouts = data.workouts.map((workout: CustomWorkout) => ({
          ...workout,
          icon: <Dumbbell className={workout.iconColor || "text-white"} />,
          id: workout.id || `workout-${Math.floor(Math.random() * 10000)}`
        }));
        
        setCustomWorkouts(processedWorkouts);
        
        setItem('customWorkouts', data.workouts, user.id);
      }
      
      if (data.dietPlans && data.dietPlans.length > 0) {
        itemsLoaded += data.dietPlans.length;
        
        const processedDietPlans = data.dietPlans.map((plan: DietPlan) => ({
          ...plan,
          icon: <Apple className={plan.iconColor || "text-green-500"} />,
          id: plan.id || `diet-${Math.floor(Math.random() * 10000)}`
        }));
        
        setDietPlans(processedDietPlans);
        
        setItem('dietPlans', data.dietPlans, user.id);
      }
      
      if (data.workoutHistory && data.workoutHistory.length > 0) {
        itemsLoaded += data.workoutHistory.length;
        
        setWorkoutHistory(data.workoutHistory);
        
        setItem('workoutHistory', data.workoutHistory, user.id);
      }
      
      if (data.dietHistory && data.dietHistory.length > 0) {
        itemsLoaded += data.dietHistory.length;
        
        setDietHistory(data.dietHistory);
        
        setItem('dietHistory', data.dietHistory, user.id);
      }
      
      if (data.preferences) {
        itemsLoaded += 1;
        
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
  
  const toggleChatbot = (): void => {
    setShowChatbot(prev => !prev);
  };
  
  const addWorkout = (workout: CustomWorkout): void => {
    const workoutWithIcon: CustomWorkout = {
      ...workout,
      icon: workout.icon || <Dumbbell className={workout.iconColor || "text-white"} />,
      id: workout.id || Math.floor(Math.random() * 10000)
    };
    
    setCustomWorkouts(prev => {
      const newWorkouts = [...prev, workoutWithIcon];
      
      if (user) {
        const serializableWorkouts = newWorkouts.map(w => ({
          ...w,
          icon: undefined,
        }));
        
        setItem('customWorkouts', serializableWorkouts, user.id);
        
        syncWithMongoDB('workout', serializableWorkouts);
      }
      
      return newWorkouts;
    });
  };
  
  const addDietPlan = (dietPlan: DietPlan): void => {
    const dietPlanWithIcon: DietPlan = {
      ...dietPlan,
      icon: dietPlan.icon || <Apple className={dietPlan.iconColor || "text-white"} />,
      id: dietPlan.id || Math.floor(Math.random() * 10000)
    };
    
    setDietPlans(prev => {
      const newDietPlans = [...prev, dietPlanWithIcon];
      
      if (user) {
        const serializableDietPlans = newDietPlans.map(plan => ({
          ...plan,
          icon: undefined,
        }));
        
        setItem('dietPlans', serializableDietPlans, user.id);
        
        syncWithMongoDB('dietPlan', serializableDietPlans);
      }
      
      return newDietPlans;
    });
  };
  
  const goToOnboarding = (): void => {
    router.push('/onboarding');
  };
  
  const loadUserData = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    console.log("Loading data for user:", user.id);
    
    try {
      try {
        const mongoSuccess = await loadFromMongoDB();
        
        if (mongoSuccess) {
          setIsDataLoaded(true);
          return;
        }
        
        console.log("No data found in MongoDB, falling back to localStorage");
      } catch (mongoError) {
        console.error("Error loading from MongoDB, falling back to localStorage:", mongoError);
      }
      
      const url = new URL(window.location.href);
      const skipCheck = url.searchParams.get('skipOnboardingCheck') === 'true';
      
      if (skipCheck) {
        console.log("Coming from onboarding, waiting briefly for storage to settle");
      }
      
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
        
        if (processedWorkouts.length > 0) {
          const serializableWorkouts = processedWorkouts.map(workout => ({
            ...workout,
            icon: undefined
          }));
          setItem('customWorkouts', serializableWorkouts, user.id);
          console.log("Also saved to customWorkouts for consistency");
          
          syncWithMongoDB('workout', serializableWorkouts);
        }
      } else {
        console.log("Initial workout plan not found or empty, checking for custom workouts");
        
        if (typeof window !== 'undefined') {
          const allLocalStorageKeys = Object.keys(localStorage);
          const userKeys = allLocalStorageKeys.filter(key => key.includes(user.id));
          console.log("All user localStorage keys:", userKeys);
        }
        
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
          
          syncWithMongoDB('workout', customWorkoutsJson);
        } else if (skipCheck) {
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
              
              syncWithMongoDB('workout', initialPlanRetry);
            }
          }, 1000);
        } else {
          console.log("No workout data found for user, they may need to complete onboarding");
        }
      }
      
      const dietPlansJson = getItem('dietPlans', user.id);
      if (dietPlansJson && Array.isArray(dietPlansJson) && dietPlansJson.length > 0) {
        console.log("Loading diet plans");
        const processedDietPlans = dietPlansJson.map((plan: DietPlan) => ({
          ...plan,
          icon: <Apple className={plan.iconColor || "text-green-500"} />,
          id: plan.id || Math.floor(Math.random() * 10000)
        }));
        
        setDietPlans(processedDietPlans);
        
        syncWithMongoDB('dietPlan', dietPlansJson);
      }
      
      const workoutHistoryJson = getItem('workoutHistory', user.id);
      if (workoutHistoryJson && Array.isArray(workoutHistoryJson)) {
        console.log("Loading workout history");
        setWorkoutHistory(workoutHistoryJson);
        
        syncWithMongoDB('workoutHistory', workoutHistoryJson);
      }
      
      const dietHistoryJson = getItem('dietHistory', user.id);
      if (dietHistoryJson && Array.isArray(dietHistoryJson)) {
        console.log("Loading diet history");
        setDietHistory(dietHistoryJson);
        
        syncWithMongoDB('dietHistory', dietHistoryJson);
      }
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsDataLoaded(true);
    }
  }, [user, loadFromMongoDB, syncWithMongoDB, setCustomWorkouts, setDietPlans, setWorkoutHistory, setDietHistory]);

  useEffect(() => {
    if (!isUserLoaded || !user) return;
    
    const checkUserData = async () => {
      console.log("Checking if user needs onboarding...");
      
      const url = new URL(window.location.href);
      const skipCheck = url.searchParams.get('skipOnboardingCheck') === 'true';
      
      if (skipCheck) {
        console.log("Skipping onboarding check due to URL parameter");
        loadUserData();
        return;
      }
      
      try {
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
        
        if (response.ok) {
          const data = await response.json();
          
          if (
            (data.workouts && data.workouts.length > 0) || 
            (data.dietPlans && data.dietPlans.length > 0)
          ) {
            console.log("Found existing data in MongoDB, skipping onboarding");
            loadUserData();
            return;
          }
        }
      } catch (error) {
        console.error("Error checking MongoDB for existing data:", error);
      }
      
      if (typeof window !== 'undefined') {
        const allLocalStorageKeys = Object.keys(localStorage);
        const userKeys = allLocalStorageKeys.filter(key => key.includes(user.id));
        console.log("User localStorage keys:", userKeys);
        
        if (userKeys.length === 0) {
          console.log("New user detected - no localStorage keys found");
          setNeedsOnboarding(true);
          return;
        }
        
        const onboardingComplete = hasCompletedOnboarding(user.id);
        
        if (!onboardingComplete) {
          console.log("User needs onboarding - no completion flag found");
          setNeedsOnboarding(true);
        } else {
          console.log("Onboarding complete in localStorage, loading user data");
          loadUserData();
        }
      } else {
        console.log("Cannot access localStorage, defaulting to onboarding");
        setNeedsOnboarding(true);
      }
    };
    
    checkUserData();
  }, [isUserLoaded, user, loadUserData]);
  
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
  
  useEffect(() => {
    if (typeof window === 'undefined' || !user || workoutHistory.length === 0) return;
    
    setItem('workoutHistory', workoutHistory, user.id);
    
    syncWithMongoDB('workoutHistory', workoutHistory);
  }, [workoutHistory, user, syncWithMongoDB]);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !user || dietHistory.length === 0) return;
    
    setItem('dietHistory', dietHistory, user.id);
    
    syncWithMongoDB('dietHistory', dietHistory);
  }, [dietHistory, user, syncWithMongoDB]);
  
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
  
  const workoutsWithIds: WorkoutComponentWorkout[] = customWorkouts
    .filter((workout): workout is WorkoutComponentWorkout => 
      workout.id !== undefined
    );
  
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-3"></div>
      
      <div className={`relative transition-all duration-300 ${showChatbot ? 'w-1/2' : 'w-full'}`}>
        <Navbar showChatbot={showChatbot} toggleChatbot={toggleChatbot} />
        
        <div className="container mx-auto px-4 py-6 transition-all duration-300 ease-in-out">
          <h1 className={`text-3xl font-light mb-4 text-white/90 ${showChatbot ? 'text-left' : 'text-center'}`}>
            Welcome{user?.firstName ? `, ${user.firstName}` : ''} to <span className="font-semibold">FitGuide</span>
          </h1>
          <p className={`text-white/60 mb-8 ${showChatbot ? 'text-left text-xs' : 'text-center text-sm max-w-lg mx-auto'}`}>
            {customWorkouts.length > 0 
              ? "Here's your personalized plan. Select a workout to begin your fitness journey or explore your nutrition plans."
              : "Complete the onboarding process or use the AI coach to create personalized workouts and diet plans."}
          </p>
          
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
          
          <WorkoutComponent 
            showChatbot={showChatbot} 
            setWorkoutHistory={setWorkoutHistory}
            customWorkouts={workoutsWithIds.map(workout => ({
              ...workout,
              icon: workout.icon || <Dumbbell className={workout.iconColor || "text-white"} />
            }))}
            defaultWorkouts={[]}
          />
          
          <DietPlanComponent
            showChatbot={showChatbot}
            dietPlans={dietPlans}
            setDietHistory={setDietHistory}
          />
          
          <CalendarComponent 
            showChatbot={showChatbot} 
            workoutHistory={workoutHistory} 
          />
        </div>
      </div>
      
      <AICoach 
        showChatbot={showChatbot} 
        toggleChatbot={toggleChatbot}
        addWorkout={addWorkout}
        addDietPlan={addDietPlan}
      />
    </div>
  );
}