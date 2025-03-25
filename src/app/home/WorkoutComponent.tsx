"use client"
import React, { useState, useEffect } from 'react';
import { BarChart, ChevronRight, Clock, Dumbbell, CheckCircle, X } from 'lucide-react';

// Define TypeScript types and interfaces
type Exercise = string;

type WorkoutType = 'strength' | 'hiit' | 'yoga' | 'core';

interface Workout {
  id: number | string;
  title: string;
  description: string;
  duration: string;
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
  icon: React.ReactNode;
  difficulty: string;
  exercises?: Exercise[];
  workoutType?: WorkoutType;
}

interface WorkoutHistoryItem {
  id: number;
  date: string;
  workout: string;
  duration: string;
  completed: boolean;
}

interface WorkoutComponentProps {
  showChatbot: boolean;
  setWorkoutHistory: React.Dispatch<React.SetStateAction<WorkoutHistoryItem[]>>;
  customWorkouts?: Workout[];
  defaultWorkouts?: Workout[]; // Can be an empty array
}

const WorkoutComponent: React.FC<WorkoutComponentProps> = ({ 
  showChatbot, 
  setWorkoutHistory, 
  customWorkouts = [],
  defaultWorkouts = [] 
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState<boolean>(false);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  
  // Function to format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Effect to handle timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (workoutStarted) {
      intervalId = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [workoutStarted]);
  
  // Function to open workout modal
  const openWorkoutModal = (workout: Workout): void => {
    try {
      // Ensure workout has exercises
      const workoutWithDefaults = {
        ...workout,
        exercises: workout.exercises || getDefaultExercises(workout.workoutType || 'strength')
      };
      
      setSelectedWorkout(workoutWithDefaults);
      setWorkoutStarted(false);
      setTimeElapsed(0);
      setCompletedExercises([]);
    } catch (error) {
      console.error("Error opening workout modal:", error);
    }
  };
  
  // Function to get default exercises based on workout type
  const getDefaultExercises = (workoutType: WorkoutType): Exercise[] => {
    const defaultExercises: Record<WorkoutType, Exercise[]> = {
      strength: [
        '3 sets of 12 squats',
        '3 sets of 10 push-ups',
        '3 sets of 10 lunges per leg',
        '3 sets of 10 dumbbell rows',
        '3 sets of 15 crunches'
      ],
      hiit: [
        '30 sec jumping jacks, 15 sec rest',
        '30 sec mountain climbers, 15 sec rest',
        '30 sec burpees, 15 sec rest',
        '30 sec high knees, 15 sec rest',
        'Repeat 5 times'
      ],
      yoga: [
        '5 min child\'s pose',
        '5 min downward dog',
        '5 min warrior poses',
        '5 min balance poses',
        '5 min seated stretches',
        '5 min savasana'
      ],
      core: [
        '3 sets of 20 crunches',
        '3 sets of 30 sec plank',
        '3 sets of 15 russian twists',
        '3 sets of 10 leg raises',
        '3 sets of 20 bicycle crunches'
      ]
    };
    
    return defaultExercises[workoutType] || defaultExercises.strength;
  };
  
  // Function to close workout modal
  const closeWorkoutModal = (): void => {
    setSelectedWorkout(null);
    setWorkoutStarted(false);
  };
  
  // Function to start workout
  const startWorkout = (): void => {
    setWorkoutStarted(true);
  };
  
  // Function to toggle exercise completion
  const toggleExercise = (index: number): void => {
    setCompletedExercises(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  // Function to end workout and save to history
  const endWorkout = (): void => {
    // Add the current workout to history
    if (selectedWorkout) {
      const newWorkoutRecord: WorkoutHistoryItem = {
        id: new Date().getTime(), // Use timestamp as ID for uniqueness
        date: new Date().toISOString().split('T')[0],
        workout: selectedWorkout.title,
        duration: formatTime(timeElapsed),
        completed: selectedWorkout.exercises 
          ? completedExercises.length === selectedWorkout.exercises.length
          : false
      };
      
      setWorkoutHistory(prev => [newWorkoutRecord, ...prev]);
    }
    
    // Close the modal
    closeWorkoutModal();
  };
  
  // Combine user workouts (from onboarding + AI coach) - ensure IDs are unique
  const allWorkouts: Workout[] = React.useMemo(() => {
    // Start with default workouts if any
    const workouts = [...defaultWorkouts];
    
    // Ensure custom workouts have unique IDs if they conflict with default workouts
    const customWorkoutsWithUniqueIds = customWorkouts.map(workout => {
      // Check if custom workout ID already exists in default workouts
      const idExists = workouts.some(defaultWorkout => 
        defaultWorkout.id.toString() === workout.id?.toString()
      );
      
      // If ID exists, create a new unique ID
      if (idExists && typeof workout.id === 'number') {
        return {
          ...workout,
          id: workout.id + workouts.length * 100 // Ensure it's very different
        };
      }
      
      return workout;
    });
    
    return [...workouts, ...customWorkoutsWithUniqueIds];
  }, [defaultWorkouts, customWorkouts]);
  
  // If no workouts are available
  if (allWorkouts.length === 0) {
    return null; // The parent component will display a message
  }
  
  return (
    <>
      {/* Workout cards */}
      <div className={`grid ${showChatbot ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4 mb-8`}>
        {allWorkouts.map((workout) => (
          <div 
            key={workout.id.toString()} 
            className={`backdrop-blur-lg bg-white/5 rounded-xl overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border ${workout.borderColor} group`}
            onClick={() => openWorkoutModal(workout)}
          >
            <div className={`p-6`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${workout.iconBg} ${workout.iconColor}`}>
                  {workout.icon || (
                    workout.workoutType === 'yoga' ? <Clock className="w-6 h-6" /> :
                    workout.workoutType === 'hiit' ? <BarChart className="w-6 h-6" /> :
                    <Dumbbell className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xs font-light px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/70">{workout.difficulty}</span>
              </div>
              <h2 className="text-lg font-medium mb-2 text-white/90">{workout.title}</h2>
              <p className="text-white/60 text-sm mb-4 line-clamp-2">{workout.description}</p>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-xs text-white/50">
                  <Clock size={14} className="mr-1" />
                  {workout.duration}
                </span>
                <span className="text-white/80 flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Start
                  <ChevronRight size={14} className="ml-1" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Workout Modal */}
      {selectedWorkout && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md transition-all duration-300"
          onClick={closeWorkoutModal}
        >
          <div 
            className="bg-white/10 backdrop-blur-xl rounded-xl max-w-md w-full max-h-screen overflow-y-auto border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={`p-6 bg-gradient-to-r ${selectedWorkout.color} border-b border-white/10`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${selectedWorkout.iconBg} ${selectedWorkout.iconColor}`}>
                    {selectedWorkout.icon}
                  </div>
                  <h2 className="text-xl font-medium ml-3 text-white/90">{selectedWorkout.title}</h2>
                </div>
                <button 
                  onClick={closeWorkoutModal}
                  className="text-white/80 bg-black/20 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/30 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {!workoutStarted ? (
                <>
                  <div className="mb-5">
                    <p className="text-white/70 mb-3 text-sm">{selectedWorkout.description}</p>
                    <div className="flex space-x-4 text-xs">
                      <span className="flex items-center text-white/60">
                        <Clock size={14} className="mr-1" />
                        {selectedWorkout.duration}
                      </span>
                      <span className="flex items-center text-white/60">
                        <BarChart size={14} className="mr-1" />
                        {selectedWorkout.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="font-medium mb-3 text-base text-white/80">Exercises:</h3>
                    <ul className="space-y-2">
                      {(selectedWorkout.exercises || []).map((exercise, index) => (
                        <li key={index} className="flex items-start p-2 rounded bg-white/5 text-sm">
                          <span className="inline-block w-6 text-white/40 flex-shrink-0">•</span>
                          <span className="text-white/80">{exercise}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button 
                    className="mt-6 w-full bg-white/10 hover:bg-white/15 backdrop-blur-sm py-3 rounded-lg font-medium transition-all duration-200 border border-white/10 text-white/90"
                    onClick={startWorkout}
                  >
                    Start Workout
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-light text-white/90 mb-2">{formatTime(timeElapsed)}</div>
                    <div className="text-xs text-white/50">Workout in progress</div>
                    <div className="mt-4 py-2 px-4 bg-white/5 backdrop-blur-sm text-white/80 rounded-lg inline-block text-xs">
                      {selectedWorkout.title} workout has begun!
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-5">
                    <h3 className="font-medium mb-3 text-base flex items-center text-white/80">
                      <CheckCircle size={16} className="mr-2 text-white/40" />
                      Track your progress
                    </h3>
                    <ul className="space-y-2">
                      {(selectedWorkout.exercises || []).map((exercise, index) => (
                        <li 
                          key={index} 
                          className={`flex items-center p-2.5 rounded text-sm ${completedExercises.includes(index) ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5'} cursor-pointer`}
                          onClick={() => toggleExercise(index)}
                        >
                          <span className={`flex-shrink-0 w-5 h-5 mr-2 flex items-center justify-center rounded-full ${completedExercises.includes(index) ? 'bg-green-500/60 text-white' : 'bg-white/10'}`}>
                            {completedExercises.includes(index) ? (
                              <CheckCircle size={12} />
                            ) : (
                              <span className="text-xs">{index + 1}</span>
                            )}
                          </span>
                          <span className={`${completedExercises.includes(index) ? 'line-through text-white/40' : 'text-white/80'}`}>{exercise}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    <button 
                      className="flex-1 bg-white/10 hover:bg-white/15 backdrop-blur-sm py-2.5 rounded-lg font-medium transition-all duration-200 text-sm text-white/90 border border-white/5"
                      onClick={() => setWorkoutStarted(false)}
                    >
                      Pause
                    </button>
                    <button 
                      className="flex-1 bg-white/10 hover:bg-white/15 backdrop-blur-sm py-2.5 rounded-lg font-medium transition-all duration-200 text-sm text-white/90 border border-white/5"
                      onClick={endWorkout}
                    >
                      End Workout
                    </button>
                  </div>
                  
                  <div className="mt-4 text-center text-xs text-white/50">
                    {completedExercises.length}/{selectedWorkout.exercises ? selectedWorkout.exercises.length : 0} exercises completed
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkoutComponent;