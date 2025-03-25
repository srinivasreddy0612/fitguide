import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export default async function middleware(req: NextRequest) {
  const { userId } = await auth();
  const publicRoutes = ['/', '/sign-in', '/sign-up'];
  
  if (!userId && !publicRoutes.includes(req.nextUrl.pathname)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  if (userId && req.nextUrl.pathname === '/home') {
    const onboardingComplete = req.cookies.get('onboardingComplete')?.value === 'true';
    
    if (!onboardingComplete) {
      const referer = req.headers.get('referer') || '';
      const hasOnboardingReferer = referer.includes('/onboarding');
      
      const url = new URL(req.url);
      const skipCheck = url.searchParams.get('skipOnboardingCheck') === 'true';
      
      const hasCompletedOnboarding = req.headers.get('X-Onboarding-Complete') === 'true';
      
      if (hasOnboardingReferer || skipCheck || hasCompletedOnboarding) {
        return NextResponse.next();
      }
      
      const onboardingUrl = new URL('/onboarding', req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }
  
  if (userId && req.nextUrl.pathname === '/onboarding') {
    const onboardingComplete = req.cookies.get('onboardingComplete')?.value === 'true';
    
    if (onboardingComplete) {
      const homeUrl = new URL('/home', req.url);
      return NextResponse.redirect(homeUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};