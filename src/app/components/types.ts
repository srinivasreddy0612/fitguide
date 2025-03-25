"use client"
import { ReactNode } from 'react';

// Define the workout type
export type WorkoutType = 'strength' | 'hiit' | 'yoga' | 'core';

// Define the diet type
export type DietType = 'balanced' | 'keto' | 'vegan' | 'paleo' | 'intermittent';

// Define the meal type
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Define interfaces for our data types
export interface ChatMessage {
  role: 'user' | 'system';
  content: string;
  workout?: CustomWorkout | null;
  dietPlan?: DietPlan | null;
  tempWorkout?: CustomWorkout | null;
  tempDietPlan?: DietPlan | null;
  isLoading?: boolean;
}

export interface CustomWorkout {
  id: number | string;
  title: string;
  description: string;
  duration: string;
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
  icon: ReactNode | null;
  difficulty: string;
  exercises?: string[];
  workoutType?: WorkoutType;
  focusArea?: string;
}

export interface Meal {
  mealType: MealType;
  title: string;
  description: string;
  ingredients: string[];
}

export interface DietPlan {
  id: number | string;
  title: string;
  description: string;
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
  icon: ReactNode | null;
  dietType: DietType;
  calorieRange: string;
  meals: Meal[];
}

export interface AIResponse {
  text: string;
  workout: CustomWorkout | null;
  dietPlan: DietPlan | null;
}

export interface WorkoutHistoryItem {
  id: number;
  date: string;
  workout: string;
  duration: string;
  completed: boolean;
}

export interface DietHistoryItem {
  id: number;
  date: string;
  mealName: string;
  dietPlanName: string;
  completed: boolean;
}