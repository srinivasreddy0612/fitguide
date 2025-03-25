// app/api/complete-onboarding/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request: Request) {
  const { userId } = auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    // Extract data from request
    const body = await request.json();
    const { workoutPlan } = body;
    
    // Here you would typically store this data in your database
    // For example, using Prisma:
    // await prisma.user.update({
    //   where: { clerkId: userId },
    //   data: { 
    //     onboardingCompleted: true,
    //     workoutPlans: {
    //       create: workoutPlan.map(plan => ({
    //         ...plan,
    //         userId: userId
    //       }))
    //     }
    //   }
    // });
    
    // Create a response object
    const response = NextResponse.json({
      success: true,
      message: "Onboarding completed successfully"
    });
    
    // Set a cookie to indicate onboarding is complete
    // Make sure the cookie is accessible from both client and server 
    response.cookies.set({
      name: 'onboardingComplete',
      value: 'true',
      httpOnly: false, // Not http-only so JS can access it
      secure: process.env.NODE_ENV === 'production', // Secure in production
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/', // Available on all paths
      sameSite: 'lax' // Allows some cross-site requests
    });
    
    // Log that we set the cookie
    console.log("API: Set onboardingComplete cookie");
    
    return response;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}