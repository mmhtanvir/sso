import Client from '@/models/Client';
import { connectDB } from './db';

/**
 * Validates a client token and redirect URL
 * @param token The client token to validate
 * @param redirectUrl The redirect URL to validate
 * @returns The client ID if valid, null otherwise
 */
export async function validateClient(token: string, redirectUrl: string): Promise<string | null> {
  try {
    await connectDB();

    // Find client by token
    const client = await Client.findOne({ token });
    if (!client) {
      return null;
    }

    // Validate redirect URL
    const isValidRedirectUrl = client.redirectUrls.some((url: string) => 
      redirectUrl.toLowerCase().startsWith(url.toLowerCase())
    );

    if (!isValidRedirectUrl) {
      return null;
    }

    return client._id.toString();
  } catch (error) {
    console.error('Client validation error:', error);
    return null;
  }
}

/**
 * Validates a client token and redirect URL using the API route
 * Used in client-side code or when database access is not available
 * @param token The client token to validate
 * @param redirectUrl The redirect URL to validate
 * @returns The client ID if valid, null otherwise
 */
export async function validateClientViaApi(token: string, redirectUrl: string): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const response = await fetch(`${baseUrl}/api/auth/validate-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        redirectUrl,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.clientId;
  } catch (error) {
    console.error('Client validation error:', error);
    return null;
  }
}
