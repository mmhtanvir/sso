// Google OAuth configuration
export const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback` : '';

// Facebook OAuth configuration
export const FACEBOOK_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback` : '';

// Google OAuth URLs
export const GOOGLE_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth`;
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// Facebook OAuth URLs
export const FACEBOOK_AUTH_URL = 'https://facebook.com/v18.0/dialog/oauth';
export const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v12.0/oauth/access_token';
export const FACEBOOK_USERINFO_URL = 'https://graph.facebook.com/me';

export const generateGoogleAuthUrl = (state: string, clientId?: string | null) => {
  // Use client-specific Google Client ID if provided, otherwise fall back to environment variable
  const googleClientId = clientId;
  
  // If no Google Client ID is available, return null
  if (!googleClientId) return null;
  
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const generateFacebookAuthUrl = (state: string, appId?: string | null) => {
  // Use client-specific Facebook App ID if provided, otherwise fall back to environment variable
  const facebookAppId = appId;
  
  // If no Facebook App ID is available, return null
  if (!facebookAppId) return null;
  
  const params = new URLSearchParams({
    client_id: facebookAppId,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    state,
    scope: 'email public_profile',
  });

  return `${FACEBOOK_AUTH_URL}?${params.toString()}`;
};

export const loginWithFacebookApp = (appId?: string | null) => {
  // Use client-specific Facebook App ID if provided, otherwise fall back to environment variable
  const facebookAppId = appId;
  
  // If no Facebook App ID is available, return false to indicate failure
  if (!facebookAppId) return false;
  
  const redirectUri = encodeURIComponent(FACEBOOK_REDIRECT_URI);
  const fbAppUri = `fb://facewebmodal/f?href=https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${redirectUri}&state=customState&scope=public_profile,email&response_type=token`;

  // Open Facebook App
  window.location.href = fbAppUri;

  // If the app fails to open, fallback to web login after a short delay
  setTimeout(() => {
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${redirectUri}&state=customState&scope=public_profile,email&response_type=token&display=touch`;
  }, 1500);
  
  return true;
};
