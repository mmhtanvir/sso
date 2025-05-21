import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';

// Helper function to create error response or redirect
const createErrorResponse = (error: string, status: number) => {
  // Check if this is an API call or a page navigation
  const isApiCall = true; // Default to API response
  
  if (isApiCall) {
    return NextResponse.json({ error }, { status });
  } else {
    // For page navigation, redirect to error page
    const params = new URLSearchParams();
    params.append('message', error);
    params.append('code', status.toString());
    
    return NextResponse.redirect(new URL(`/error?${params.toString()}`, process.env.NEXTAUTH_URL));
  }
};

export async function POST(request: Request) {
  try {
    await connectDB();
    const requestJson = await request.json();
    console.log("request.json()", requestJson);

    const { token, redirectUrl, clientOrigin } = requestJson;
    const acceptHeader = request.headers.get('accept') || '';
    // Check if this is a browser request (likely to be a page navigation) or an API call
    const isApiCall = acceptHeader.includes('application/json');
    // Validate required fields
    if (!token || !redirectUrl) {
      return isApiCall
        ? NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        : createErrorResponse('Missing required parameters', 400);
    }

    // Find client by token
    const client = await Client.findOne({ token });

    if (!client) {
      return isApiCall
        ? NextResponse.json({ error: 'Invalid client token' }, { status: 401 })
        : createErrorResponse('Invalid client token', 401);
    }

    // Validate redirect URL
    const isValidRedirectUrl = client.redirectUrls.some((url: string) => 
      redirectUrl.toLowerCase().startsWith(url.toLowerCase())
    );

    if (!isValidRedirectUrl) {
      return isApiCall
        ? NextResponse.json({ error: 'Invalid redirect URL' }, { status: 400 })
        : createErrorResponse('Invalid redirect URL', 400);
    }

    // Validate clientOrigin if present
    if (clientOrigin) {
      const isValidOrigin = client.allowedOrigins.some((allowedOrigin: string) => 
        clientOrigin.toLowerCase() === allowedOrigin.toLowerCase() || 
        // Handle wildcard subdomains (e.g., *.example.com)
        (allowedOrigin.startsWith('*') && 
         clientOrigin.toLowerCase().endsWith(allowedOrigin.toLowerCase().substring(1)))
      );

      if (!isValidOrigin) {
        console.error(`Origin validation failed: ${clientOrigin} not in allowed origins:`, client.allowedOrigins);
        return isApiCall
          ? NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
          : createErrorResponse('Invalid request origin', 403);
      }
    } else {
      // If clientOrigin is not provided, log a warning but don't block the request
      // This allows for development and testing without origin validation
      console.warn('Client origin not provided for validation. Skipping origin check.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Client validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate client' },
      { status: 500 }
    );
  }
}
