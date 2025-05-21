import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Client from '@/models/Client';
import { createToken } from '@/lib/jwt';
import { validateClient } from '@/lib/client-validation';
import {
  GOOGLE_REDIRECT_URI,
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
} from '@/lib/social-auth';

export interface GoogleUser {
  id: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  picture: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/login?error=Invalid request`);
    }

    // Parse state to get client token and redirect URL
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { clientToken, redirectUrl } = stateData;

    // Validate client token and redirect URL
    const clientId = await validateClient(clientToken, redirectUrl);
    if (!clientId) {
      return NextResponse.redirect(`${baseUrl}/login?error=Invalid client or redirect URL`);
    }
    
    // Get client-specific OAuth credentials
    await connectDB();
    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.redirect(`${baseUrl}/login?error=Client not found`);
    }
    
    // Use client-specific credentials if available, otherwise fall back to environment variables
    const googleClientId = client.googleClientId;
    const googleClientSecret = client.googleClientSecret;
    
    // If no credentials are available, redirect with error
    if (!googleClientId || !googleClientSecret) {
      return NextResponse.redirect(`${baseUrl}/login?error=Google OAuth is not configured for this client`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=Token exchange failed`);
    }

    // Get user info from Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData: GoogleUser = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=Failed to get user info`);
    }

    await connectDB();

    // Find or create user
    let user = await User.findOne({
      $or: [
        { email: userData.email },
        { providerUserId: userData.id, authProvider: 'google' }
      ]
    });

    if (!user) {
      user = await User.create({
        name: userData.name,
        email: userData.email,
        profileImageUrl: userData?.picture,
        authProvider: 'google',
        providerUserId: userData.id,
        clientId,
      });
    } else {
      // Update existing user with client ID if not present
      if (!user.clientId) {
        user.clientId = clientId;
        await user.save();
      }
      // Update Google info if not present
      if (!user.authProvider) {
        user.authProvider = 'google';
        user.providerUserId = userData.id;
      }
      
      // Always update profile picture from Google since the URL might expire after some time
      console.log('Google profile picture URL:', userData?.picture);
      user.profileImageUrl = userData?.picture || user.profileImageUrl;
      
      // Save all changes at once
      await user.save();
    }

    // Create JWT token
    const jwtToken = createToken(user._id.toString());

    // Redirect to login page with token and original redirect URL
    const finalRedirectUrl = `${baseUrl}/login?token=${clientToken}&redirect_url=${encodeURIComponent(redirectUrl)}&social_token=${jwtToken}`;
    return NextResponse.redirect(finalRedirectUrl);
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=Authentication failed`);
  }
}
