// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  onboardingCompleted: boolean;
  preferences: {
    fitnessGoal?: string;
    experienceLevel?: string;
    workoutFrequency?: string;
    workoutDuration?: string;
    preferredWorkoutTypes?: string[];
    limitations?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true },
    onboardingCompleted: { type: Boolean, default: false },
    preferences: {
      fitnessGoal: { type: String },
      experienceLevel: { type: String },
      workoutFrequency: { type: String },
      workoutDuration: { type: String },
      preferredWorkoutTypes: [{ type: String }],
      limitations: [{ type: String }],
    },
  },
  { timestamps: true }
);

// Prevent model overwrite error during hot reload in development
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);