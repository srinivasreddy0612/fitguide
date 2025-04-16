// lib/mongodb.ts
import mongoose from 'mongoose';

// Get MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI as string;

// Simple connection validator
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable not found');
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Track connection status
let isConnected = false;

/**
 * Connect to MongoDB database with reduced logging
 */
async function connectToDatabase() {
  // If already connected, return mongoose silently
  if (isConnected) {
    return mongoose;
  }

  try {
    // Connect to MongoDB (no logging here to reduce console noise)
    await mongoose.connect(MONGODB_URI);
    
    // Set connected flag
    isConnected = true;
    
    return mongoose;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export default connectToDatabase;