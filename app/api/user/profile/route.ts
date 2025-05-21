import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // allow requests from any other domain
  "Access-Control-Allow-Methods": "GET,HEAD,PUT,OPTIONS,PATCH,POST,DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    
    await connectDB();
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
      profileImageUrl: user.profileImageUrl,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}
