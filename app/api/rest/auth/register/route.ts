import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Client from '@/models/Client';
import { createToken } from '@/lib/jwt';

/**
 * REST API endpoint for user registration
 * This is a publicly accessible endpoint that can be called from any origin
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, token, redirectUrl } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Name is required',
          code: 'MISSING_NAME'
        },
        { status: 400 }
      );
    }

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

    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Password must be at least 6 characters long',
          code: 'PASSWORD_TOO_SHORT'
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

    await connectDB();

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

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email already registered',
          code: 'EMAIL_ALREADY_EXISTS'
        },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      clientId: client._id.toString(),
    });

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
  } catch (error: any) {
    console.error('REST API Registration error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email already registered',
          code: 'EMAIL_ALREADY_EXISTS'
        },
        { status: 400 }
      );
    }
    
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
