// models/UserData.ts
import mongoose, { Schema, Document } from 'mongoose';

// Define a comprehensive schema that can hold all types of user data
export interface IUserData extends Document {
  clerkId: string;
  dataType: 'workout' | 'dietPlan' | 'workoutHistory' | 'dietHistory' | 'preferences';
  data: any; // Using any type to store different structures based on dataType
  createdAt: Date;
  updatedAt: Date;
}

const UserDataSchema: Schema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    dataType: { 
      type: String, 
      required: true, 
      enum: ['workout', 'dietPlan', 'workoutHistory', 'dietHistory', 'preferences'],
      index: true
    },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// Create a compound index for efficient lookups
UserDataSchema.index({ clerkId: 1, dataType: 1 });

// Prevent model overwrite error during hot reload in development
export default mongoose.models.UserData || mongoose.model<IUserData>('UserData', UserDataSchema);