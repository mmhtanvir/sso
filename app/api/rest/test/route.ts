import { NextRequest, NextResponse } from 'next/server';

/**
 * Test API endpoint that returns a simple success message
 * @param request The incoming request
 * @returns JSON response with a success message
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Test API endpoint is working!',
    timestamp: new Date().toISOString()
  });
}

/**
 * POST handler for the test endpoint
 * @param request The incoming request
 * @returns JSON response with the received data and a success message
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Data received successfully!',
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to parse JSON data',
      error: (error as Error).message
    }, { status: 400 });
  }
}
