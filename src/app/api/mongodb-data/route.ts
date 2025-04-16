// api/mongodb-data/route.ts
// This API route doesn't depend on Clerk middleware
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '../../lib/mongodb';

// Define a basic schema for user data
const UserDataSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, index: true },
  dataType: { 
    type: String, 
    required: true, 
    enum: ['workout', 'dietPlan', 'workoutHistory', 'dietHistory', 'preferences'],
    index: true
  },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

// Create the model (only if it doesn't exist)
const UserData = mongoose.models.UserData || mongoose.model('UserData', UserDataSchema);

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId, dataType, data, action } = body;
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Missing userId parameter', 
        success: false 
      }, { status: 400 });
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Handle fetch action (no dataType required)
    if (action === 'fetch') {
      // Fetch all data types
      const workouts = await UserData.find({ clerkId: userId, dataType: 'workout' }).lean();
      const dietPlans = await UserData.find({ clerkId: userId, dataType: 'dietPlan' }).lean();
      const workoutHistory = await UserData.find({ clerkId: userId, dataType: 'workoutHistory' }).lean();
      const dietHistory = await UserData.find({ clerkId: userId, dataType: 'dietHistory' }).lean();
      const preferences = await UserData.findOne({ clerkId: userId, dataType: 'preferences' }).lean();
      
      return NextResponse.json({ 
        success: true, 
        workouts: workouts.map(entry => entry.data),
        dietPlans: dietPlans.map(entry => entry.data),
        workoutHistory: workoutHistory.map(entry => entry.data),
        dietHistory: dietHistory.map(entry => entry.data),
        preferences: preferences?.data || null
      });
    }
    
    // For save action, we need dataType and data
    if (action === 'save') {
      if (!dataType || data === undefined) {
        return NextResponse.json({ 
          error: 'Missing dataType or data for save action', 
          success: false 
        }, { status: 400 });
      }
      
      // Validate dataType
      if (!['workout', 'dietPlan', 'workoutHistory', 'dietHistory', 'preferences'].includes(dataType)) {
        return NextResponse.json({ 
          error: 'Invalid dataType',
          success: false
        }, { status: 400 });
      }
      
      // Save data based on type
      if (dataType === 'workout' || dataType === 'dietPlan') {
        // For arrays, replace all items
        await UserData.deleteMany({ clerkId: userId, dataType });
        
        if (Array.isArray(data) && data.length > 0) {
          // Create entries without Clerk dependency
          const entries = data.map(item => ({
            clerkId: userId,
            dataType,
            data: item
          }));
          
          await UserData.insertMany(entries);
          return NextResponse.json({ 
            success: true, 
            message: `Saved ${entries.length} ${dataType} items`
          });
        } else {
          return NextResponse.json({ 
            success: true, 
            message: `No ${dataType} items to save` 
          });
        }
      } else if (dataType === 'preferences') {
        // For preferences, update or create
        const result = await UserData.findOneAndUpdate(
          { clerkId: userId, dataType },
          { clerkId: userId, dataType, data },
          { upsert: true, new: true }
        );
        
        return NextResponse.json({ 
          success: true, 
          message: 'Preferences updated'
        });
      } else {
        // For history items, add incrementally
        if (Array.isArray(data) && data.length > 0) {
          // Get existing IDs to avoid duplicates
          const existingEntries = await UserData.find({ clerkId: userId, dataType });
          const existingIds = new Set(existingEntries.map(entry => entry.data.id));
          
          // Add only new items
          const newEntries = data
            .filter(item => !existingIds.has(item.id))
            .map(item => ({
              clerkId: userId,
              dataType,
              data: item
            }));
          
          if (newEntries.length > 0) {
            await UserData.insertMany(newEntries);
          }
          
          return NextResponse.json({ 
            success: true, 
            message: `Added ${newEntries.length} new ${dataType} items`
          });
        } else {
          return NextResponse.json({ 
            success: true, 
            message: `No ${dataType} items to add`
          });
        }
      }
    }
    
    return NextResponse.json({ 
      error: 'Invalid action. Must be "fetch" or "save"',
      success: false
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in mongodb-data API route:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}