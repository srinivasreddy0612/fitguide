import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export default async function middleware(req: NextRequest) {
  const { userId } = await auth();
  const publicRoutes = ['/', '/sign-in', '/sign-up'];
  
  // Handle authentication - redirect to sign in for non-public routes
  if (!userId && !publicRoutes.includes(req.nextUrl.pathname)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // Handle onboarding checks for authenticated users going to /home
  if (userId && req.nextUrl.pathname === '/home') {
    // Check for the user-specific cookie format that includes the userId
    const userSpecificCookie = `user_${userId}_onboardingComplete`;
    const hasUserSpecificCookie = req.cookies.get(userSpecificCookie)?.value === 'true';
    const generalCookie = req.cookies.get('onboardingComplete')?.value === 'true';
    
    // Check URL parameters
    const url = new URL(req.url);
    const skipCheck = url.searchParams.get('skipOnboardingCheck') === 'true';
    if (skipCheck) {
      return NextResponse.next();
    }
    
    // Check if onboarding can be skipped based on referrer
    const referer = req.headers.get('referer') || '';
    const hasOnboardingReferer = referer.includes('/onboarding');
    const hasCompletedOnboarding = req.headers.get('X-Onboarding-Complete') === 'true';
    
    // Only consider onboarding complete if a cookie exists or we're coming from onboarding
    const onboardingComplete = hasUserSpecificCookie || generalCookie || hasOnboardingReferer || hasCompletedOnboarding;
    
    if (!onboardingComplete) {
      console.log(`User ${userId} needs onboarding - redirecting`);
      const onboardingUrl = new URL('/onboarding', req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }
  
  // Special case for newly created accounts - auto-redirect to onboarding
  // This catches users right after they sign up
  if (userId && req.nextUrl.pathname === '/home') {
    const referer = req.headers.get('referer') || '';
    const comingFromSignUp = referer.includes('/sign-up') || referer.includes('/clerk/sign-up');
    
    if (comingFromSignUp) {
      console.log(`New user from sign-up - redirecting to onboarding`);
      const onboardingUrl = new URL('/onboarding', req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }
  
  // Handle case where user with completed onboarding tries to access onboarding page
  if (userId && req.nextUrl.pathname === '/onboarding') {
    const userSpecificCookie = `user_${userId}_onboardingComplete`;
    const hasUserSpecificCookie = req.cookies.get(userSpecificCookie)?.value === 'true';
    const generalCookie = req.cookies.get('onboardingComplete')?.value === 'true';
    
    // If onboarding is complete, redirect to home
    if (hasUserSpecificCookie || generalCookie) {
      const homeUrl = new URL('/home', req.url);
      return NextResponse.redirect(homeUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};