import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Client from '@/models/Client';
import { createToken } from '@/lib/jwt';

/**
 * REST API endpoint for Facebook authentication
 * This endpoint verifies a Facebook access token and returns a JWT token
 */
export async function POST(request: NextRequest) {
  try {
    // Get request data - can only read the body once
    const requestData = await request.json();
    console.log("requestData", requestData);
    const { accessToken, token, redirectUrl } = requestData;

    // Validate required fields
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Facebook access token is required',
          code: 'MISSING_ACCESS_TOKEN'
        },
        { status: 400 }
      );
    }

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

    // Verify the Facebook access token
    try {
      // First verify the token is valid
      const verifyResponse = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}`);
      
      if (!verifyResponse.ok) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid Facebook access token',
            code: 'INVALID_ACCESS_TOKEN'
          },
          { status: 401 }
        );
      }
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyData || !verifyData.id) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid Facebook access token response',
            code: 'INVALID_TOKEN_RESPONSE'
          },
          { status: 401 }
        );
      }

      // Get user details from Facebook Graph API with larger picture
      const userDetailsResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture.width(500).height(500)&access_token=${accessToken}`
      );
      
      if (!userDetailsResponse.ok) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to fetch user details from Facebook',
            code: 'FETCH_USER_FAILED'
          },
          { status: 401 }
        );
      }
      
      const userData = await userDetailsResponse.json();
      
      if (!userData || !userData.id) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid user data from Facebook',
            code: 'INVALID_USER_DATA'
          },
          { status: 401 }
        );
      }

      // Extract user information
      const facebookUserId = userData.id;
      const email = userData.email?.toLowerCase();
      const name = userData.name;
      const picture = userData.picture?.data?.url;
      
      console.log('Facebook user picture data:', userData.picture?.data);

      // Email is required
      if (!email) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Email is required from Facebook account',
            code: 'MISSING_EMAIL'
          },
          { status: 400 }
        );
      }

      // Find or create user
      let user = await User.findOne({
        $or: [
          { email: email },
          { providerUserId: facebookUserId, authProvider: 'facebook' }
        ]
      });

      if (user) {
        // Check if user was created with a different auth provider
        if (user.authProvider && user.authProvider !== 'facebook') {
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
        
        // Update Facebook info if not present
        if (!user.authProvider) {
          user.authProvider = 'facebook';
          user.providerUserId = facebookUserId;
        }
        
        // Always update profile picture from Facebook since the URL might expire after some time
        if (picture) {
          user.profileImageUrl = picture;
        }
        
        // Save all changes
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          name,
          email,
          profileImageUrl: picture,
          authProvider: 'facebook',
          providerUserId: facebookUserId,
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
      console.error('Facebook access token verification error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to verify Facebook access token',
          code: 'VERIFICATION_FAILED'
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('REST API Facebook auth error:', error);
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
