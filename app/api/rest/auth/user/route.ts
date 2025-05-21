import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

/**
 * REST API endpoint to get the current user's profile
 * This endpoint requires a valid JWT token in the Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authorization header is required',
          code: 'MISSING_AUTH_HEADER'
        },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Bearer token is required',
          code: 'MISSING_TOKEN'
        },
        { status: 401 }
      );
    }

    // Verify the token
    let userId;
    try {
      userId = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectDB();

    // Find the user
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

    // Return the user data (excluding sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('REST API User Profile error:', error);
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
