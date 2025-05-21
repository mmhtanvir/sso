import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Client from '@/models/Client';
import { createToken } from '@/lib/jwt';
import { validateClient } from '@/lib/client-validation';
import {
  FACEBOOK_REDIRECT_URI,
  FACEBOOK_TOKEN_URL,
  FACEBOOK_USERINFO_URL,
} from '@/lib/social-auth';

export interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture: {
    data: {
      url: string;
    };
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Handle Facebook login cancellation or errors
    if (error || errorReason) {
      // If state exists, try to extract the original redirect URL
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
          const { redirectUrl } = stateData;
          if (redirectUrl) {
            const url = new URL(redirectUrl);
            return NextResponse.redirect(`${baseUrl}/login?cancelled=true`);
          }
        } catch (e) {
          console.error('Failed to parse state data:', e);
        }
      }
      // Fallback to base URL if state parsing fails
      return NextResponse.redirect(`${baseUrl}/login?cancelled=true`);
    }

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
    const facebookAppId = client.facebookAppId;
    const facebookAppSecret = client.facebookAppSecret;
    
    // If no credentials are available, redirect with error
    if (!facebookAppId || !facebookAppSecret) {
      return NextResponse.redirect(`${baseUrl}/login?error=Facebook OAuth is not configured for this client`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `${FACEBOOK_TOKEN_URL}?client_id=${facebookAppId}&client_secret=${facebookAppSecret}&code=${code}&redirect_uri=${FACEBOOK_REDIRECT_URI}`
    );

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('Facebook token exchange failed:', tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('Failed to authenticate with Facebook')}`);
    }

    // Get user info from Facebook
    const userInfoResponse = await fetch(
      `${FACEBOOK_USERINFO_URL}?fields=id,name,email,picture.width(400).height(400)&access_token=${tokenData.access_token}`
    );

    const userData = await userInfoResponse.json();
    if (!userInfoResponse.ok) {
      console.error('Facebook user info failed:', userData);
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('Failed to get Facebook user info')}`);
    }

    // Validate required Facebook user data
    if (!userData.id || !userData.name) {
      console.error('Missing required Facebook user data:', userData);
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('Missing required Facebook profile information')}`);
    }

    await connectDB();

    // Find or create user
    let user = await User.findOne({
      $or: [
        ...(userData.email ? [{ email: userData.email }] : []),
        { providerUserId: userData.id, authProvider: 'facebook' }
      ]
    });

    if (!user) {
      user = await User.create({
        name: userData.name,
        ...(userData.email && { email: userData.email }),
        profileImageUrl: userData?.picture?.data?.url || null,
        authProvider: 'facebook',
        providerUserId: userData.id,
        clientId,
      });
    } else {
      // Update existing user with client ID if not present
      if (!user.clientId) {
        user.clientId = clientId;
        await user.save();
      }
      // Update Facebook info if not present
      if (!user.authProvider) {
        user.authProvider = 'facebook';
        user.providerUserId = userData.id;
      }
      
      // Always update profile picture from Facebook since the URL expires after some time
      console.log('Facebook profile picture URL:', userData?.picture?.data?.url);
      user.profileImageUrl = userData?.picture?.data?.url || user.profileImageUrl;
      
      // Save all changes at once
      await user.save();
    }

    // Create JWT token
    const jwtToken = createToken(user._id.toString());

    // Redirect to login page with token and original redirect URL
    const finalRedirectUrl = `${baseUrl}/login?token=${clientToken}&redirect_url=${encodeURIComponent(redirectUrl)}&social_token=${jwtToken}`;
    return NextResponse.redirect(finalRedirectUrl);
  } catch (error) {
    console.error('Facebook callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=Authentication failed`);
  }
}
