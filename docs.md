# Next.js SSO Server Documentation

This document explains how to integrate and use the Next.js SSO server in your client applications.

## Table of Contents
- [Setup](#setup)
- [Authentication Flow](#authentication-flow)
- [Integration Guide](#integration-guide)
- [API Reference](#api-reference)
- [Example Implementation](#example-implementation)

## Setup

### Prerequisites
- MongoDB server running locally or in the cloud
- Google OAuth credentials (for Google login)
- Facebook OAuth credentials (for Facebook login)

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/next-sso
JWT_SECRET=your-secure-random-string
NEXT_PUBLIC_APP_URL=http://localhost:5000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## Authentication Flow

1. Client app redirects to SSO server with client token and redirect URL
2. User logs in via:
   - Email/Password
   - Google
   - Facebook
3. SSO server validates credentials and redirects back with JWT token
4. Client app uses JWT token for API authentication

## Integration Guide

### 1. Register Your Client Application

First, register your client application in the SSO database to get a client token and set up allowed redirect URLs.

```typescript
// Example client registration in MongoDB
{
  "token": "your-client-token",
  "name": "Your App Name",
  "redirectUrls": [
    "http://localhost:3000/callback",
    "https://your-production-domain.com/callback"
  ]
}
```

### 2. Implement Login Flow

#### Redirect to SSO Login
```typescript
// Example redirect function
const redirectToSSO = () => {
  const ssoUrl = 'http://localhost:5000';
  const clientToken = 'your-client-token';
  const redirectUrl = 'http://localhost:3000/callback';
  
  window.location.href = `${ssoUrl}/login?token=${clientToken}&redirect_url=${encodeURIComponent(redirectUrl)}`;
};
```

#### Handle SSO Callback
```typescript
// Example callback handler
const handleCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const authToken = urlParams.get('auth_token');
  
  if (authToken) {
    // Store the token securely
    localStorage.setItem('auth_token', authToken);
    // Redirect to your app's dashboard
    window.location.href = '/dashboard';
  }
};
```

### 3. Use JWT Token for API Requests

```typescript
// Example API request with JWT token
const fetchUserProfile = async () => {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('http://localhost:5000/api/user/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  return response.json();
};
```

## API Reference

### Authentication Endpoints

#### 1. Login Page
- **URL**: `/login`
- **Method**: GET
- **Query Parameters**:
  - `token`: Client application token
  - `redirect_url`: URL to redirect after successful login

#### 2. User Profile
- **URL**: `/api/user/profile`
- **Method**: GET
- **Headers**:
  - `Authorization`: Bearer token

#### 3. Register Page
- **URL**: `/register`
- **Method**: GET
- **Query Parameters**:
  - `token`: Client application token
  - `redirect_url`: URL to redirect after successful registration

### Response Format

#### Success Response
```json
{
  "id": "user-id",
  "name": "User Name",
  "email": "user@example.com",
  "authProvider": "google|facebook|null"
}
```

#### Error Response
```json
{
  "error": "Error message"
}
```

## Example Implementation

### React Example
```typescript
// AuthContext.tsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext<{
  token: string | null;
  login: () => void;
  logout: () => void;
}>({
  token: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );

  const login = () => {
    const ssoUrl = 'http://localhost:5000';
    const clientToken = 'your-client-token';
    const redirectUrl = 'http://localhost:3000/callback';
    
    window.location.href = `${ssoUrl}/login?token=${clientToken}&redirect_url=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// CallbackPage.tsx
export const CallbackPage = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('auth_token');
    
    if (authToken) {
      localStorage.setItem('auth_token', authToken);
      window.location.href = '/dashboard';
    }
  }, []);

  return <div>Loading...</div>;
};

// UserProfile.tsx
export const UserProfile = () => {
  const [user, setUser] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  return user ? (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  ) : (
    <div>Loading profile...</div>
  );
};
```

### Security Considerations

1. Always use HTTPS in production
2. Store JWT tokens securely
3. Validate redirect URLs
4. Implement token refresh mechanism
5. Add rate limiting
6. Use secure session management

For more information or support, please contact our team or refer to the GitHub repository.
