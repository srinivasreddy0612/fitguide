import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '../../lib/mongodb';
import UserData from '../../models/UserData';

export async function POST(request: Request) {
  let userId = null;
  
  try {
    // Get auth from Clerk (may fail if middleware not run)
    const authResult = await auth();
    userId = authResult?.userId;
    
    // If Clerk auth fails, try to get userId from request body or headers
    if (!userId) {
      // Try to get from request body
      const body = await request.json();
      
      if (body.userId) {
        console.log("Using userId from request body as fallback");
        userId = body.userId;
      } else {
        // Try to get from Authorization header as last resort
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          userId = authHeader.substring(7); // Remove 'Bearer ' prefix
          console.log("Using userId from Authorization header as fallback");
        }
      }
    }
    
    // Still no userId, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body (clone request if already consumed)
    let body;
    try {
      body = await request.clone().json();
    } catch (e) {
      // If we already parsed the body above, use that data
      if (!body && request.headers.get('content-type') === 'application/json') {
        const text = await request.text();
        body = JSON.parse(text);
      }
    }
    
    const { dataType, data } = body;
    
    if (!dataType || !data) {
      return NextResponse.json({ error: 'Missing dataType or data' }, { status: 400 });
    }
    
    // Validate dataType
    if (!['workout', 'dietPlan', 'workoutHistory', 'dietHistory', 'preferences'].includes(dataType)) {
      return NextResponse.json({ error: 'Invalid dataType' }, { status: 400 });
    }
    
    try {
      // Connect to the database
      console.log("Connecting to MongoDB...");
      await connectToDatabase();
      console.log("MongoDB connection successful");
      
      // Different handling based on dataType
      if (dataType === 'workout' || dataType === 'dietPlan') {
        // These are array types, so we'll replace all existing items
        
        // Delete existing entries of this type
        await UserData.deleteMany({ 
          clerkId: userId,
          dataType
        });
        
        if (Array.isArray(data) && data.length > 0) {
          // Insert new entries
          const entries = data.map(item => ({
            clerkId: userId,
            dataType,
            data: item
          }));
          
          await UserData.insertMany(entries);
          
          return NextResponse.json({ 
            success: true, 
            message: `Synchronized ${entries.length} ${dataType} items successfully`
          });
        } else {
          return NextResponse.json({ 
            success: true, 
            message: `Cleared all ${dataType} items`
          });
        }
      } else if (dataType === 'workoutHistory' || dataType === 'dietHistory') {
        // For history entries, we'll add them incrementally
        
        if (Array.isArray(data) && data.length > 0) {
          // Get existing history IDs to avoid duplicates
          const existingEntries = await UserData.find({ 
            clerkId: userId,
            dataType
          });
          
          const existingIds = new Set(existingEntries.map(entry => entry.data.id));
          
          // Filter out items that already exist
          const newEntries = data
            .filter(item => !existingIds.has(item.id))
            .map(item => ({
              clerkId: userId,
              dataType,
              data: item
            }));
          
          if (newEntries.length > 0) {
            await UserData.insertMany(newEntries);
            
            return NextResponse.json({ 
              success: true, 
              message: `Added ${newEntries.length} new ${dataType} items`
            });
          } else {
            return NextResponse.json({ 
              success: true, 
              message: `No new ${dataType} items to add`
            });
          }
        } else {
          return NextResponse.json({ 
            success: true, 
            message: `No ${dataType} items to add`
          });
        }
      } else if (dataType === 'preferences') {
        // For preferences, we'll update them
        
        // Find existing preferences
        const existingPreferences = await UserData.findOne({ 
          clerkId: userId,
          dataType: 'preferences'
        });
        
        if (existingPreferences) {
          // Update existing preferences
          existingPreferences.data = data;
          await existingPreferences.save();
        } else {
          // Create new preferences
          await UserData.create({
            clerkId: userId,
            dataType: 'preferences',
            data: data
          });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Preferences updated successfully'
        });
      }
      
      return NextResponse.json({ 
        error: 'Invalid operation'
      }, { status: 400 });
    } catch (dbError) {
      console.error('MongoDB operation error:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in sync-user-data API route:', error);
    return NextResponse.json({ 
      error: 'Failed to sync user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}