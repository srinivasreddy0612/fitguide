// models/WorkoutHistory.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkoutHistory extends Document {
  userId: string;
  workoutId: mongoose.Types.ObjectId;
  date: string;
  workout: string;
  duration: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutHistorySchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    workoutId: { type: Schema.Types.ObjectId, ref: 'Workout' },
    date: { type: String, required: true },
    workout: { type: String, required: true },
    duration: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.WorkoutHistory || mongoose.model<IWorkoutHistory>('WorkoutHistory', WorkoutHistorySchema);