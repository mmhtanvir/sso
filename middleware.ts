import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Hardcoded admin credentials - in production, these should be environment variables
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

export async function middleware(request: NextRequest) {
  // Handle REST API routes with CORS headers
  if (request.nextUrl.pathname.startsWith('/api/rest')) {
    // Create a response object to add CORS headers
    const response = NextResponse.next();
    
    // Add CORS headers to allow requests from any origin
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 204,
        headers: response.headers
      });
    }
    
    return response;
  }
  
  // Check if it's an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access Required"',
        },
      });
    }

    try {
      const credentials = atob(authHeader.split(' ')[1]);
      const [username, password] = credentials.split(':');

      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return new NextResponse('Unauthorized', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Access Required"',
          },
        });
      }
    } catch (error) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access Required"',
        },
      });
    }

    return NextResponse.next();
  }

  // Get the origin making the request
  const origin = request.headers.get('origin') || '';

  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const redirectUrl = searchParams.get('redirect_url');
  const cancelled = searchParams.get('cancelled');
  const socialToken = searchParams.get('social_token');

  // Allow direct access to login page for cancelled logins or when no auth flow is initiated
  if (path === '/login' && (!token && !redirectUrl && !socialToken || cancelled)) {
    return NextResponse.next();
  }

  // Check for required parameters only when initiating auth flow
  if (!token || !redirectUrl) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    // Extract the origin from the redirect URL
    let clientOrigin = '';
    try {
      const redirectUrlObj = new URL(redirectUrl);
      clientOrigin = redirectUrlObj.origin;

      console.log("clientOrigin", clientOrigin)
    } catch (error) {
      console.error('Failed to parse redirect URL:', error);
    }

    // Validate client token and redirect URL
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/validate-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        redirectUrl,
        clientOrigin,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Invalid client or redirect URL' },
        { status: 401 }
      );
    }

    // If everything is valid, redirect to the client's redirect URL
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: ['/login', '/register', '/admin/:path*', '/api/rest/:path*'],
};
