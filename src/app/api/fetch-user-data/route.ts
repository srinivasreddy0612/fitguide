import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '../../lib/mongodb';
import UserData from '../../models/UserData';

export async function GET(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Debug environment variable
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    try {
      // Try to connect to MongoDB with better error handling
      console.log('Attempting to connect to MongoDB from API route...');
      await connectToDatabase();
      console.log('MongoDB connection successful in API route');
      
      // Get query parameters
      const url = new URL(request.url);
      const dataType = url.searchParams.get('dataType');
      
      // Query based on dataType
      if (dataType) {
        // Validate dataType
        if (!['workout', 'dietPlan', 'workoutHistory', 'dietHistory', 'preferences'].includes(dataType)) {
          return NextResponse.json({ error: 'Invalid dataType' }, { status: 400 });
        }
        
        // Fetch specific data type
        const entries = await UserData.find({ 
          clerkId: userId,
          dataType
        }).lean();
        
        console.log(`Found ${entries.length} ${dataType} entries for user ${userId}`);
        
        // Return data according to type
        if (dataType === 'preferences' && entries.length > 0) {
          return NextResponse.json({ 
            success: true,
            data: entries[0].data
          });
        } else {
          return NextResponse.json({ 
            success: true,
            data: entries.map(entry => entry.data)
          });
        }
      } else {
        // Fetch basic data only - simplified for debugging
        const workouts = await UserData.find({ clerkId: userId, dataType: 'workout' }).lean();
        console.log(`Found ${workouts.length} workouts for user ${userId}`);
        
        return NextResponse.json({ 
          success: true,
          workouts: workouts.map(entry => entry.data),
          dietPlans: [], // Empty placeholders for now
          workoutHistory: [],
          dietHistory: [],
          preferences: null
        });
      }
    } catch (dbError) {
      // Detailed error for database issues
      console.error('MongoDB connection or query error:', dbError);
      
      // Return error with fallback flag
      return NextResponse.json({ 
        success: false,
        error: 'Database connection failed',
        message: dbError instanceof Error ? dbError.message : 'Unknown database error',
        fallback: true // Signal client to use localStorage
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in fetch-user-data API route:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch user data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}