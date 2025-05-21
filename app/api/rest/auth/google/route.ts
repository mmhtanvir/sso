import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Client from '@/models/Client';
import { createToken } from '@/lib/jwt';

// Create a Google OAuth client
const googleClient = new OAuth2Client();

/**
 * REST API endpoint for Google authentication
 * This endpoint verifies a Google ID token and returns a JWT token
 */
export async function POST(request: NextRequest) {
  try {
    // Get request data - can only read the body once
    const requestData = await request.json();
    console.log("requestData", requestData)
    const { data, type, token, redirectUrl } = requestData;

    // Validate request type
    if (type !== 'success') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid authentication request',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data || !data.idToken) {
      return NextResponse.json(
        { 
          success: false,
          error: 'ID token is required',
          code: 'MISSING_ID_TOKEN'
        },
        { status: 400 }
      );
    }

    if (!data.user || !data.user.email) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User data is required',
          code: 'MISSING_USER_DATA'
        },
        { status: 400 }
      );
    }

    // Extract Google ID token
    const { idToken } = data;
    
    // Check for token and redirectUrl in query params if not in body
    const tokenFromQuery = request.nextUrl.searchParams.get('token');
    const redirectUrlFromQuery = request.nextUrl.searchParams.get('redirect_url');
    
    // Use query params if available, otherwise use body values
    const clientToken = tokenFromQuery || token;
    const clientRedirectUrl = redirectUrlFromQuery || redirectUrl;

    // Validate client token
    if (!clientToken) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client token is required',
          code: 'MISSING_TOKEN'
        },
        { status: 400 }
      );
    }

    if (!clientRedirectUrl) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Redirect URL is required',
          code: 'MISSING_REDIRECT_URL'
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate client token
    const client = await Client.findOne({ token: clientToken });
    if (!client) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid client token',
          code: 'INVALID_CLIENT'
        },
        { status: 401 }
      );
    }

    // Validate redirect URL
    const isValidRedirectUrl = client.redirectUrls.some((url: string) => 
      clientRedirectUrl.toLowerCase().startsWith(url.toLowerCase())
    );

    if (!isValidRedirectUrl) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid redirect URL',
          code: 'INVALID_REDIRECT_URL'
        },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: client.googleClientId, // Use client-specific Google Client ID
      });
      
      const payload = ticket.getPayload();
      
      if (!payload || !payload.sub || !payload.email) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid Google ID token',
            code: 'INVALID_ID_TOKEN'
          },
          { status: 401 }
        );
      }

      // Extract user information from the token payload
      const googleUserId = payload.sub;
      const email = payload.email;
      const name = payload.name || data.user.name;
      const picture = payload.picture || data.user.photo;

      // Find or create user
      let user = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { providerUserId: googleUserId, authProvider: 'google' }
        ]
      });

      if (user) {
        // Check if user was created with a different auth provider
        if (user.authProvider && user.authProvider !== 'google') {
          return NextResponse.json(
            { 
              success: false,
              error: `This account was created using ${user.authProvider} authentication`,
              code: 'DIFFERENT_AUTH_PROVIDER'
            },
            { status: 400 }
          );
        }

        // Update existing user with client ID if not present
        if (!user.clientId) {
          user.clientId = client._id.toString();
        }
        
        // Update Google info if not present
        if (!user.authProvider) {
          user.authProvider = 'google';
          user.providerUserId = googleUserId;
        }
        
        // Always update profile picture from Google since the URL might expire after some time
        user.profileImageUrl = picture || user.profileImageUrl;
        
        // Save all changes
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          name,
          email: email.toLowerCase(),
          profileImageUrl: picture,
          authProvider: 'google',
          providerUserId: googleUserId,
          clientId: client._id.toString(),
        });
      }

      // Create JWT token
      const jwtToken = createToken(user._id.toString());

      // Remove sensitive data from response
      const userResponse = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      };

      return NextResponse.json({ 
        success: true,
        token: jwtToken,
        user: userResponse,
        client: {
          id: client._id.toString(),
          name: client.name,
          logoUrl: client.logoUrl || null
        }
      });
    } catch (error) {
      console.error('Google ID token verification error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to verify Google ID token',
          code: 'VERIFICATION_FAILED'
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('REST API Google auth error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'An unexpected error occurred',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
