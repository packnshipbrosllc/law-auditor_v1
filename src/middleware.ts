import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { geolocation } from '@vercel/functions';

export function middleware(request: NextRequest) {
  // Get state from Vercel Geolocation
  const { region } = geolocation(request);
  
  // Supported states
  const supportedStates = ['TX', 'CA', 'FL'];
  
  // Determine state: check if region is supported, otherwise default to 'CA' (Sacramento testing default)
  let state = 'CA';
  if (region && supportedStates.includes(region.toUpperCase())) {
    state = region.toUpperCase();
  }

  // Debug log for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Region: ${region || 'Unknown'} -> State: ${state}`);
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
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
