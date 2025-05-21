import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';

export async function getAuthUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    const userId = await verifyToken(token);
    
    return userId;
  } catch (error) {
    throw new Error('Authentication failed');
  }
}

export function extractAuthToken(redirectUrl: string, token: string): string {
  const separator = redirectUrl.includes('?') ? '&' : '?';
  return `${redirectUrl}${separator}auth_token=${token}`;
}
