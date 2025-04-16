// api/mongodb-data/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '../../lib/mongodb';

// Define a better schema for user data with improved uniqueness constraints
const UserDataSchema = new mongoose.Schema({
  clerkId: { 
    type: String, 
    required: true,
    index: true 
  },
  dataType: { 
    type: String, 
    required: true, 
    enum: ['workout', 'dietPlan', 'workoutHistory', 'dietHistory', 'preferences'],
  },
  // Add unique composite index to prevent duplicates
  data: { 
    type: mongoose.Schema.Types.Mixed,
    required: true 
  }
}, { 
  timestamps: true 
});

// Create a compound index to ensure uniqueness for each user+type combination
UserDataSchema.index({ clerkId: 1, dataType: 1 }, { unique: false });

// For workout history, create a compound index on clerkId, dataType, and data.id
// This prevents duplicate history entries with the same ID
UserDataSchema.index({ 
  clerkId: 1, 
  dataType: 1, 
  "data.id": 1 
}, { 
  unique: true,
  // Only apply this index if dataType is one of the history types
  partialFilterExpression: {
    dataType: { $in: ['workoutHistory', 'dietHistory'] }
  },
  // If MongoDB version supports it, make this a sparse index
  sparse: true
});

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
      // Find workout data - use findOne for single entries
      const workoutData = await UserData.findOne({ 
        clerkId: userId, 
        dataType: 'workout' 
      }).lean();
      
      // Find diet plan data - use findOne for single entries
      const dietPlanData = await UserData.findOne({ 
        clerkId: userId, 
        dataType: 'dietPlan' 
      }).lean();
      
      // For history items, find multiple entries
      const workoutHistory = await UserData.find({ 
        clerkId: userId, 
        dataType: 'workoutHistory' 
      }).sort({ 'data.date': -1 }).lean();
      
      const dietHistory = await UserData.find({ 
        clerkId: userId, 
        dataType: 'dietHistory' 
      }).sort({ 'data.date': -1 }).lean();
      
      // For preferences, find single entry
      const preferences = await UserData.findOne({ 
        clerkId: userId, 
        dataType: 'preferences' 
      }).lean();
      
      // Prepare response data format
      const response = {
        success: true,
        workouts: workoutData?.data || [],
        dietPlans: dietPlanData?.data || [],
        workoutHistory: workoutHistory.map(entry => entry.data),
        dietHistory: dietHistory.map(entry => entry.data),
        preferences: preferences?.data || null
      };
      
      // For workouts and diet plans, convert single object to array if needed
      if (!Array.isArray(response.workouts)) {
        response.workouts = [response.workouts].filter(Boolean);
      }
      
      if (!Array.isArray(response.dietPlans)) {
        response.dietPlans = [response.dietPlans].filter(Boolean);
      }
      
      return NextResponse.json(response);
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
      
      // Save based on the type of data
      if (dataType === 'workout' || dataType === 'dietPlan') {
        // Check if an entry already exists for this user and dataType
        const existingEntry = await UserData.findOne({ 
          clerkId: userId, 
          dataType 
        });
        
        if (existingEntry) {
          // Update the existing entry
          existingEntry.data = data;
          await existingEntry.save();
          
          return NextResponse.json({
            success: true,
            message: `Updated ${dataType} data successfully`
          });
        } else {
          // Create a new entry
          await UserData.create({
            clerkId: userId,
            dataType,
            data
          });
          
          return NextResponse.json({
            success: true,
            message: `Created new ${dataType} data successfully`
          });
        }
      } else if (dataType === 'preferences') {
        // For preferences, update or create
        await UserData.findOneAndUpdate(
          { clerkId: userId, dataType },
          { clerkId: userId, dataType, data },
          { upsert: true }
        );
        
        return NextResponse.json({ 
          success: true, 
          message: 'Preferences updated successfully'
        });
      } else if (dataType === 'workoutHistory' || dataType === 'dietHistory') {
        // For history items, add incrementally
        if (Array.isArray(data) && data.length > 0) {
          // Bulk upsert operations
          const bulkOps = data.map(item => ({
            updateOne: {
              filter: { 
                clerkId: userId, 
                dataType, 
                'data.id': item.id 
              },
              update: { 
                $set: { 
                  clerkId: userId, 
                  dataType, 
                  data: item 
                } 
              },
              upsert: true
            }
          }));
          
          // Use bulkWrite for efficiency
          if (bulkOps.length > 0) {
            const result = await UserData.bulkWrite(bulkOps);
            
            return NextResponse.json({
              success: true,
              message: `Updated ${dataType} data successfully (${result.upsertedCount} new items, ${result.modifiedCount} updated items)`
            });
          }
        }
        
        return NextResponse.json({
          success: true,
          message: `No changes to ${dataType} data`
        });
      }
    } else if (action === 'reset') {
      // Handle reset action - deletes all workout data for a user
      if (!dataType) {
        return NextResponse.json({ 
          error: 'Missing dataType for reset action', 
          success: false 
        }, { status: 400 });
      }
      
      if (dataType === 'all') {
        // Delete all data for this user except history
        await UserData.deleteMany({ 
          clerkId: userId, 
          dataType: { $nin: ['workoutHistory', 'dietHistory'] } 
        });
        
        return NextResponse.json({
          success: true,
          message: `Reset all data (except history) for user`
        });
      } else {
        // Delete specific data type
        await UserData.deleteMany({ 
          clerkId: userId, 
          dataType 
        });
        
        return NextResponse.json({
          success: true,
          message: `Reset ${dataType} data for user`
        });
      }
    }
    
    return NextResponse.json({ 
      error: 'Invalid action. Must be "fetch", "save", or "reset"',
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