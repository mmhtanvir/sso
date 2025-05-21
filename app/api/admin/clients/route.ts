import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';

// This is a temporary in-memory store. In a real application, you would use a database.
// let clients: any[] = [];

export async function GET() {
  try {
    await connectDB();
    const clients = await Client.find({});
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { 
      name, 
      allowedOrigins, 
      redirectUrls, 
      logoUrl,
      googleClientId,
      googleClientSecret,
      facebookAppId,
      facebookAppSecret 
    } = body;

    // Validate required fields
    if (!name || !allowedOrigins || !redirectUrls) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a token
    const token = crypto.randomBytes(32).toString('hex');

    // Create new client
    const client = await Client.create({
      name,
      allowedOrigins,
      redirectUrls,
      logoUrl: logoUrl || '',
      googleClientId: googleClientId || '',
      googleClientSecret: googleClientSecret || '',
      facebookAppId: facebookAppId || '',
      facebookAppSecret: facebookAppSecret || '',
      token,
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
