import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Find client by token
    const client = await Client.findOne({ token });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Return only necessary client info
    return NextResponse.json({
      name: client.name,
      logoUrl: client.logoUrl || null,
      googleClientId: client.googleClientId || null,
      googleClientSecret: client.googleClientSecret || null,
      facebookAppId: client.facebookAppId || null,
      facebookAppSecret: client.facebookAppSecret || null
    });
  } catch (error) {
    console.error('Error fetching client info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client info' },
      { status: 500 }
    );
  }
}
