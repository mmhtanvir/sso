import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email, password, token, redirectUrl } = await request.json();

    // Validate required fields
    if (!email || !password || !token || !redirectUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate client token and redirect URL again for security
    const client = await Client.findOne({ token });

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid client token' },
        { status: 401 }
      );
    }

    const isValidRedirectUrl = client.redirectUrls.some((url: string) => 
      redirectUrl.toLowerCase().startsWith(url.toLowerCase())
    );

    if (!isValidRedirectUrl) {
      return NextResponse.json(
        { error: 'Invalid redirect URL' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const jwtToken = createToken(user._id.toString());

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({ 
      success: true,
      token: jwtToken,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
