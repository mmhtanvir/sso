import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/jwt';

/**
 * REST API endpoint for user login
 * This is a publicly accessible endpoint that can be called from any origin
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, password, token, redirectUrl } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Password is required',
          code: 'MISSING_PASSWORD'
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

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Check if user was created with social auth and doesn't have a password
    if (user.authProvider && !user.password) {
      return NextResponse.json(
        { 
          success: false,
          error: `This account was created using ${user.authProvider} authentication`,
          code: 'SOCIAL_AUTH_ACCOUNT'
        },
        { status: 400 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
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
    console.error('REST API Login error:', error);
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
