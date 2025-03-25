// models/Workout.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkout extends Document {
  userId: string;
  title: string;
  description: string;
  workoutType: 'strength' | 'hiit' | 'yoga' | 'core';
  difficulty: string;
  duration: string;
  exercises: string[];
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
  focusArea?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    workoutType: { 
      type: String, 
      enum: ['strength', 'hiit', 'yoga', 'core'], 
      required: true 
    },
    difficulty: { type: String, required: true },
    duration: { type: String, required: true },
    exercises: [{ type: String, required: true }],
    color: { type: String, required: true },
    borderColor: { type: String, required: true },
    iconColor: { type: String, required: true },
    iconBg: { type: String, required: true },
    focusArea: { type: String },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Workout || mongoose.model<IWorkout>('Workout', WorkoutSchema);