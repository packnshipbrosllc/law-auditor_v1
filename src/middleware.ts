import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { geolocation } from '@vercel/functions';

export function middleware(request: NextRequest) {
  // Get state from Vercel Geolocation
  const { region } = geolocation(request);
  
  // Supported states
  const supportedStates = ['TX', 'CA', 'FL'];
  
  // Determine state: check if region is supported, otherwise default to 'TX'
  let state = 'TX';
  if (region && supportedStates.includes(region.toUpperCase())) {
    state = region.toUpperCase();
  }

  // Create response
  const response = NextResponse.next();

  // Set header and cookie for state persistence
  response.headers.set('x-user-state', state);
  
  // Set cookie with 30 day expiration
  response.cookies.set('user-state', state, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return response;
}

// Only run middleware on the main routes
export const config = {
  matcher: ['/', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

