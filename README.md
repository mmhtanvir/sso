# Next.js SSO Server

A Single Sign-On (SSO) server built with Next.js, MongoDB, and NextAuth.js that allows you to manage client applications and handle authentication centrally.

## Features

- Centralized authentication system
- Client application management
- Secure token-based authentication
- Admin dashboard for client management
- MongoDB integration for data persistence
- Built with TypeScript for type safety

## Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB database
- npm or yarn package manager

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:5000
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

The server will start on port 5000 by default.

## Client Management

Administrators can manage client applications through the admin dashboard:

1. Visit `/admin/dashboard` to access the admin interface.
2. Default admin credentials:
   - Username: `admin`
   - Password: `admin123`
3. Add new client applications with:
   - Client name
   - Allowed origins
   - Redirect URLs
4. Each client will have a unique token for authentication

## Client Model Structure

```typescript
{
  name: string;          // Name of the client application
  allowedOrigins: string[]; // List of allowed origins for CORS
  redirectUrls: string[];   // Allowed redirect URLs after authentication
  token: string;         // Unique client token
  createdAt: Date;       // Timestamp of client creation
}
```

## Client Integration

To integrate this SSO service into your application, follow these steps:

### 1. Configuration

Configure your client application with the following environment variables or configuration settings:
```
SSO_SERVER_URL=http://localhost:5000
CLIENT_ID=your_client_token        # Obtained from admin dashboard
REDIRECT_URL=https://your-app.com/auth/callback
```

### 2. Authentication Flow

1. **Initiate Login**
   - Redirect users to the SSO login page with required parameters:
   ```
   ${SSO_SERVER_URL}/login?token=${CLIENT_ID}&redirect_url=${REDIRECT_URL}
   ```

2. **Handle Authentication Callback**
   - After successful authentication, users will be redirected back to your `REDIRECT_URL`
   - The URL will include a `token` parameter containing the authentication token
   - Example: `https://your-app.com/auth/callback?token=eyJhbG...`

3. **Store Authentication Token**
   - Save the token securely (e.g., in localStorage, cookies, or session storage)
   - Use this token for subsequent API requests

### 3. API Endpoints

#### Get User Profile
```http
GET ${SSO_SERVER_URL}/api/user/profile
Authorization: Bearer your_auth_token
```

Response:
```json
{
  "id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "profileImageUrl": "https://...",
  "createdAt": "2025-02-23T09:30:58Z"
}
```

### 4. Logout

To log users out:
1. Clear the stored authentication token
2. Optionally redirect to SSO logout page:
   ```
   ${SSO_SERVER_URL}/logout?redirect_url=${YOUR_APP_URL}
   ```

### Security Considerations

1. **Token Storage**
   - Store tokens securely
   - Clear tokens on logout
   - Implement token refresh mechanism if needed

2. **Request Security**
   - Always use HTTPS in production
   - Include tokens in Authorization header
   - Validate tokens on both client and server side

3. **URL Parameters**
   - Properly encode URL parameters
   - Validate redirect URLs against allowed domains

4. **Error Handling**
   - Implement proper error handling for failed requests
   - Handle token expiration gracefully
   - Provide clear feedback to users

### Example Integration Flow

```javascript
// Example authentication flow (pseudocode)
function initiateLogin() {
    const loginUrl = `${SSO_SERVER_URL}/login?token=${CLIENT_ID}&redirect_url=${REDIRECT_URL}`;
    window.location.href = loginUrl;
}

function handleCallback(token) {
    if (!token) return handleError('No token received');
    
    // Store token securely
    storeAuthToken(token);
    
    // Fetch user profile
    fetchUserProfile(token);
}

async function fetchUserProfile(token) {
    const response = await fetch(`${SSO_SERVER_URL}/api/user/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json();
}

function logout() {
    clearAuthToken();
    window.location.href = `${SSO_SERVER_URL}/logout?redirect_url=${YOUR_APP_URL}`;
}
```

## Tech Stack

- Next.js 15.1.6
- React 19
- MongoDB with Mongoose
- NextAuth.js
- TypeScript
- Radix UI Components

## Security

- Implements secure token-based authentication
- CORS protection with allowedOrigins
- Secure redirect handling
- Environment variable based configuration

## License

Private repository - All rights reserved

## Support

For support or questions, please open an issue in the repository.