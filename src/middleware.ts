import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { geolocation } from '@vercel/functions';

export function middleware(request: NextRequest) {
  // Supported states
  const supportedStates = ['TX', 'CA', 'FL'];

  // 1. Check for Vercel Geolocation headers first to ensure we are not ignoring them
  // We use both the modern geolocation helper and the direct request.geo property
  const vercelGeo = geolocation(request);
  const directGeo = (request as any).geo;
  const region = vercelGeo.region || directGeo?.region;
  
  // 2. Check if user has a manual override cookie
  const cookieState = request.cookies.get('user-state')?.value;
  
  let state = 'CA'; // Default fallback if nothing else is found

  if (region && supportedStates.includes(region.toUpperCase())) {
    // If we have a valid region from Vercel, prioritize it unless there's a valid cookie
    // Actually, usually we want to stick with the cookie if it exists to allow manual overrides
    state = region.toUpperCase();
  }

  // 3. If a cookie exists, it should override the detected geo (manual user choice)
  if (cookieState && supportedStates.includes(cookieState.toUpperCase())) {
    state = cookieState.toUpperCase();
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
