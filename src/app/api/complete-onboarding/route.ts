import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request: Request) {
  const { userId } = auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { workoutPlan } = body;
    
    const response = NextResponse.json({
      success: true,
      message: "Onboarding completed successfully"
    });
    
    response.cookies.set({
      name: 'onboardingComplete',
      value: 'true',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax'
    });
    
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