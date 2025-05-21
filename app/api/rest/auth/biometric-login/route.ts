import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import User from '@/models/User';
import { createToken } from '@/lib/jwt';

/**
 * REST API endpoint for biometric login
 * This endpoint allows users to authenticate using biometric credentials
 * by providing their userId
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { userId, token, redirectUrl } = await request.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client token is required',
          code: 'MISSING_TOKEN'
        },
        { status: 400 }
      );
    }

    if (!redirectUrl) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Redirect URL is required',
          code: 'MISSING_REDIRECT_URL'
        },
        { status: 400 }
      );
    }

    // Validate client token
    const client = await Client.findOne({ token });
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
      redirectUrl.toLowerCase().startsWith(url.toLowerCase())
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

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
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
    console.error('REST API Biometric Login error:', error);
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
