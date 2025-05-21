import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    
    const deletedClient = await Client.findByIdAndDelete(id);

    if (!deletedClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
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

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { 
        name, 
        allowedOrigins, 
        redirectUrls, 
        logoUrl,
        googleClientId,
        googleClientSecret,
        facebookAppId,
        facebookAppSecret 
      },
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}
