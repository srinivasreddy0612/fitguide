import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable not found');
  throw new Error('Please define the MONGODB_URI environment variable');
}

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return mongoose;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    
    isConnected = true;
    
    return mongoose;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export default connectToDatabase;