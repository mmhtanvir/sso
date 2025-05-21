import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { createToken } from '@/lib/jwt';
import { validateClient } from '@/lib/client-validation';

export async function POST(request: Request) {
  try {
    const { name, email, password, token, redirectUrl } = await request.json();

    // Validate client token and redirect URL
    const clientId = await validateClient(token, redirectUrl);
    if (!clientId) {
      return NextResponse.json(
        { error: 'Invalid client or redirect URL' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      clientId,
    });

    // Create JWT token
    const jwtToken = createToken(user._id.toString());

    return NextResponse.json({ token: jwtToken });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
