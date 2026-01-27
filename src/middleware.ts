import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { geolocation } from '@vercel/functions';

export function middleware(request: NextRequest) {
  // Supported states
  const supportedStates = ['TX', 'CA', 'FL'];

  // 1. Check for Vercel Geolocation headers
  const { region } = geolocation(request);
  const detectedRegion = region?.toUpperCase();
  
  // 2. Check for manual override cookie
  const cookieState = request.cookies.get('user-state')?.value?.toUpperCase();
  
  let state = 'CA'; // Default fallback

  // Priority logic:
  // 1. Use manual cookie if it's valid
  // 2. Otherwise use detected geo if it's in our supported list
  // 3. Fallback to CA
  
  if (cookieState && supportedStates.includes(cookieState)) {
    state = cookieState;
  } else if (detectedRegion && supportedStates.includes(detectedRegion)) {
    state = detectedRegion;
  }

  // Debug log for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Geo Region: ${region} | Cookie: ${cookieState} | Resolved: ${state}`);
  }

  // Create headers object to pass to the request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-state', state);

  // Create response with modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Persist state in cookie for client-side access
  // We set it again to ensure it's always fresh and matches the resolved state
  response.cookies.set('user-state', state, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}

// Ensure middleware runs on all relevant routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - icon.png (favicon file)
     */
    '/((?!_next/static|_next/image|icon.png).*)',
  ],
};
