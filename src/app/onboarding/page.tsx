"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, ArrowLeft, Dumbbell, Calendar, Clock, Target, Award } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

// Define TypeScript interfaces
interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface Step {
  title: string;
  description: string;
  field: keyof FormData;
  options: Option[];
  type: 'single' | 'multiple';
}

interface FormData {
  fitnessGoal: string;
  experienceLevel: string;
  workoutFrequency: string;
  workoutDuration: string;
  preferredWorkoutTypes: string[];
  limitations: string[];
}

interface Workout {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  workoutType: string;
  exercises: string[];
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
}

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    fitnessGoal: '',
    experienceLevel: '',
    workoutFrequency: '',
    workoutDuration: '',
    preferredWorkoutTypes: [],
    limitations: []
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fitnessGoals: Option[] = [
    { id: 'lose-weight', label: 'Lose Weight', icon: <Target className="h-6 w-6" /> },
    { id: 'build-muscle', label: 'Build Muscle', icon: <Dumbbell className="h-6 w-6" /> },
    { id: 'improve-fitness', label: 'Improve Overall Fitness', icon: <Award className="h-6 w-6" /> },
    { id: 'increase-endurance', label: 'Increase Endurance', icon: <Clock className="h-6 w-6" /> }
  ];

  const experienceLevels: Option[] = [
    { id: 'beginner', label: 'Beginner (New to fitness)' },
    { id: 'intermediate', label: 'Intermediate (Some experience)' },
    { id: 'advanced', label: 'Advanced (Experienced)' }
  ];

  const workoutFrequencies: Option[] = [
    { id: '2-3', label: '2-3 times per week' },
    { id: '3-4', label: '3-4 times per week' },
    { id: '5+', label: '5+ times per week' }
  ];

  const workoutDurations: Option[] = [
    { id: '15-30', label: '15-30 minutes' },
    { id: '30-45', label: '30-45 minutes' },
    { id: '45-60', label: '45-60 minutes' },
    { id: '60+', label: '60+ minutes' }
  ];

  const workoutTypes: Option[] = [
    { id: 'strength', label: 'Strength Training' },
    { id: 'hiit', label: 'HIIT/Cardio' },
    { id: 'yoga', label: 'Yoga/Flexibility' },
    { id: 'core', label: 'Core/Abs' }
  ];

  const limitations: Option[] = [
    { id: 'none', label: 'No limitations' },
    { id: 'knee', label: 'Knee issues' },
    { id: 'back', label: 'Back problems' },
    { id: 'shoulder', label: 'Shoulder issues' },
    { id: 'equipment', label: 'Limited equipment' },
    { id: 'space', label: 'Limited space' }
  ];

  const steps: Step[] = [
    {
      title: 'Fitness Goal',
      description: 'What is your primary fitness goal?',
      field: 'fitnessGoal',
      options: fitnessGoals,
      type: 'single'
    },
    {
      title: 'Experience Level',
      description: 'What is your fitness experience level?',
      field: 'experienceLevel',
      options: experienceLevels,
      type: 'single'
    },
    {
      title: 'Workout Frequency',
      description: 'How often do you plan to work out?',
      field: 'workoutFrequency',
      options: workoutFrequencies,
      type: 'single'
    },
    {
      title: 'Workout Duration',
      description: 'How long do you prefer your workouts to be?',
      field: 'workoutDuration',
      options: workoutDurations,
      type: 'single'
    },
    {
      title: 'Preferred Workout Types',
      description: 'What types of workouts do you enjoy? (Select all that apply)',
      field: 'preferredWorkoutTypes',
      options: workoutTypes,
      type: 'multiple'
    },
    {
      title: 'Limitations',
      description: 'Do you have any physical limitations or constraints? (Select all that apply)',
      field: 'limitations',
      options: limitations,
      type: 'multiple'
    }
  ];

  const handleSingleSelect = (field: keyof FormData, value: string): void => {
    setFormData({ ...formData, [field]: value });
  };

  const handleMultipleSelect = (field: keyof FormData, value: string): void => {
    if (field !== 'preferredWorkoutTypes' && field !== 'limitations') return;
    
    const currentValues = formData[field] || [];
    if (value === 'none') {
      // If "none" is selected, clear all other selections
      setFormData({ ...formData, [field]: ['none'] });
      return;
    }
    
    // If selecting something else and "none" was selected, remove "none"
    let newValues = currentValues.filter(v => v !== 'none');
    
    if (newValues.includes(value)) {
      // Remove if already selected
      newValues = newValues.filter(v => v !== value);
    } else {
      // Add if not already selected
      newValues.push(value);
    }
    
    // If nothing is selected, default to "none"
    if (newValues.length === 0) {
      newValues = ['none'];
    }
    
    setFormData({ ...formData, [field]: newValues });
  };

  const nextStep = (): void => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateWorkoutPlan();
    }
  };

  const prevStep = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = (): boolean => {
    const currentField = steps[currentStep].field;
    if (steps[currentStep].type === 'single') {
      return !!formData[currentField];
    } else {
      return (formData[currentField as 'preferredWorkoutTypes' | 'limitations'] || []).length > 0;
    }
  };

  // Client-side fallback function to generate a workout plan
  const generateFallbackWorkoutPlan = (): Workout[] => {
    // Determine how many workouts to generate based on frequency
    let workoutsPerWeek = 3;
    if (formData.workoutFrequency === '2-3') {
      workoutsPerWeek = 3;
    } else if (formData.workoutFrequency === '3-4') {
      workoutsPerWeek = 4;
    } else if (formData.workoutFrequency === '5+') {
      workoutsPerWeek = 5;
    }
    
    // Create workouts array
    const workouts: Workout[] = [];
    
    // Define workout types based on user preferences
    let workoutTypePreferences = formData.preferredWorkoutTypes || [];
    if (workoutTypePreferences.length === 0 || workoutTypePreferences.includes('none')) {
      workoutTypePreferences = ['strength', 'hiit', 'yoga', 'core'];
    }
    
    // Ensure we have enough types to fill the week
    while (workoutTypePreferences.length < workoutsPerWeek) {
      workoutTypePreferences = [...workoutTypePreferences, ...workoutTypePreferences];
    }
    
    // Generate workouts for each day
    for (let i = 0; i < workoutsPerWeek; i++) {
      const workoutType = workoutTypePreferences[i % workoutTypePreferences.length];
      
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
      
      // Select a focus area based on type
      let focusArea = '';
      let exercises: string[] = [];
      
      if (workoutType === 'strength') {
        focusArea = i % 2 === 0 ? 'Upper Body' : 'Lower Body';
        
        if (focusArea === 'Upper Body') {
          exercises = [
            '3 sets of 10-12 push-ups',
            '3 sets of 10-12 dumbbell shoulder press',
            '3 sets of 10-12 dumbbell rows',
            '3 sets of 10-12 bicep curls',
            '3 sets of 10-12 tricep dips'
          ];
        } else {
          exercises = [
            '3 sets of 12 squats',
            '3 sets of 10 lunges per leg',
            '3 sets of 12 deadlifts',
            '3 sets of 15 calf raises',
            '3 sets of 12 glute bridges'
          ];
        }
      } else if (workoutType === 'hiit') {
        focusArea = i % 2 === 0 ? 'Cardio' : 'Fat Burn';
        
        exercises = [
          '30 sec jumping jacks, 15 sec rest',
          '30 sec high knees, 15 sec rest',
          '30 sec burpees, 15 sec rest',
          '30 sec mountain climbers, 15 sec rest',
          '30 sec squat jumps, 15 sec rest',
          'Repeat 4 times'
        ];
      } else if (workoutType === 'yoga') {
        focusArea = i % 2 === 0 ? 'Flexibility' : 'Balance';
        
        exercises = [
          '5 min sun salutations',
          '1 min each side warrior II pose',
          '1 min each side triangle pose',
          '1 min each side seated forward fold',
          '5 min final relaxation'
        ];
      } else if (workoutType === 'core') {
        focusArea = i % 2 === 0 ? 'Abs' : 'Full Core';
        
        exercises = [
          '3 sets of 20 crunches',
          '3 sets of 30-sec planks',
          '3 sets of 15 Russian twists',
          '3 sets of 12 leg raises',
          '3 sets of 20 bicycle crunches'
        ];
      }
      
      // If the user is a beginner, make the exercises easier
      if (formData.experienceLevel === 'beginner') {
        exercises = exercises.map(ex => {
          return ex.replace('3 sets', '2 sets')
                   .replace('30-sec', '20-sec')
                   .replace('Repeat 4', 'Repeat 3');
        });
      }
      // If the user is advanced, make them harder
      else if (formData.experienceLevel === 'advanced') {
        exercises = exercises.map(ex => {
          return ex.replace('3 sets', '4 sets')
                   .replace('30-sec', '45-sec')
                   .replace('Repeat 4', 'Repeat 5');
        });
      }
      
      // Determine workout duration
      let duration = '30 min';
      if (formData.workoutDuration === '15-30') {
        duration = '25 min';
      } else if (formData.workoutDuration === '30-45') {
        duration = '40 min';
      } else if (formData.workoutDuration === '45-60') {
        duration = '50 min';
      } else if (formData.workoutDuration === '60+') {
        duration = '60 min';
      }
      
      // Create workout object
      const workout: Workout = {
        id: i + 1,
        title: `Day ${i + 1}: ${focusArea}`,
        description: `A ${formData.experienceLevel} level ${workoutType} workout focusing on ${focusArea.toLowerCase()}.`,
        duration: duration,
        difficulty: formData.experienceLevel === 'beginner' ? 'Beginner' : 
                   formData.experienceLevel === 'intermediate' ? 'Intermediate' : 'Advanced',
        workoutType: workoutType,
        exercises: exercises,
        color: color,
        borderColor: borderColor,
        iconColor: iconColor,
        iconBg: iconBg
      };
      
      workouts.push(workout);
    }
    
    return workouts;
  };

  const generateWorkoutPlan = async (): Promise<void> => {
    setIsGenerating(true);
    setError('');
    
    try {
      console.log("Generating workout plan with form data:", formData);
      
      // Store in localStorage first as a backup
      localStorage.setItem('onboardingFormData', JSON.stringify({
        name: user?.firstName || 'User',
        ...formData
      }));
      
      // Generate workout plan directly on the client
      console.log("Generating workout plan directly on client");
      const workoutPlan = generateFallbackWorkoutPlan();
      
      // Store in localStorage
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('initialWorkoutPlan', JSON.stringify(workoutPlan));
      
      // Set client-side cookie
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
      document.cookie = `onboardingComplete=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
      
      console.log("Client: Set onboardingComplete cookie:", document.cookie);
      
      try {
        // Try to call the API to mark onboarding as complete
        const completeResponse = await fetch('/api/complete-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workoutPlan: workoutPlan
          }),
        });
        
        if (!completeResponse.ok) {
          console.error("Failed to mark onboarding as complete via API, status:", completeResponse.status);
          // We can still proceed because we saved to localStorage and set the cookie
        } else {
          console.log("Onboarding marked as complete via API");
        }
      } catch (completeError) {
        console.error("Error marking onboarding as complete:", completeError);
        // We can continue since we've already set the cookie and localStorage
      }
      
      // Add a small delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to home
      router.push('/home?skipOnboardingCheck=true');
      
    } catch (error) {
      console.error('Error generating workout plan:', error);
      setError('There was an issue creating your workout plan. Please try again.');
      setIsGenerating(false);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-3"></div>
      
      <div className="relative px-4 py-12 min-h-screen flex flex-col items-center justify-center">
        {/* Progress bar */}
        <div className="w-full max-w-2xl mb-10">
          <div className="relative pt-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-white/70">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-white/70">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1">
              <div 
                className="bg-white/50 h-1 rounded-full transition-all duration-300" 
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Error message if any */}
        {error && (
          <div className="w-full max-w-2xl mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-white/90">
            {error}
          </div>
        )}
        
        {/* Main card */}
        <div className="w-full max-w-2xl backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-1 text-white/90">
              {currentStepData.title}
            </h1>
            <p className="text-white/60 mb-8">
              {currentStepData.description}
            </p>
            
            <div className="space-y-3">
              {currentStepData.type === 'single' ? (
                // Single select options
                currentStepData.options.map((option) => (
                  <div 
                    key={option.id}
                    className={`flex items-center p-4 rounded-lg backdrop-blur-sm cursor-pointer transition-all
                      ${formData[currentStepData.field] === option.id 
                        ? 'bg-white/20 border border-white/20' 
                        : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                    onClick={() => handleSingleSelect(currentStepData.field, option.id)}
                  >
                    <div className="flex-1 flex items-center">
                      {option.icon && <div className="mr-3 text-white/80">{option.icon}</div>}
                      <span className="text-sm font-medium text-white/90">{option.label}</span>
                    </div>
                    {formData[currentStepData.field] === option.id && (
                      <CheckCircle className="h-5 w-5 text-white/80" />
                    )}
                  </div>
                ))
              ) : (
                // Multiple select options
                currentStepData.options.map((option) => (
                  <div 
                    key={option.id}
                    className={`flex items-center p-4 rounded-lg backdrop-blur-sm cursor-pointer transition-all
                      ${(formData[currentStepData.field as 'preferredWorkoutTypes' | 'limitations'] || []).includes(option.id) 
                        ? 'bg-white/20 border border-white/20' 
                        : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                    onClick={() => handleMultipleSelect(currentStepData.field, option.id)}
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white/90">{option.label}</span>
                    </div>
                    {(formData[currentStepData.field as 'preferredWorkoutTypes' | 'limitations'] || []).includes(option.id) && (
                      <CheckCircle className="h-5 w-5 text-white/80" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="px-8 py-4 border-t border-white/10 bg-white/5 flex justify-between">
            <button
              onClick={prevStep}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                currentStep === 0 
                  ? 'text-white/30 cursor-not-allowed' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!isStepComplete() || isGenerating}
              className={`flex items-center px-6 py-2 rounded-lg transition-all ${
                !isStepComplete() 
                  ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {currentStep === steps.length - 1 ? (
                isGenerating ? 'Creating Your Plan...' : 'Create My Plan'
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
        
        {isGenerating && (
          <div className="mt-6 text-white/60 text-sm animate-pulse">
            Building your personalized workout plan...
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;