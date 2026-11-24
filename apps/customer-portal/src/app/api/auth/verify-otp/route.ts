// src/app/api/auth/verify-otp/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

if (!BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get the code from the frontend request
    const body = await request.json();
    
    // 2. Get the xeco_otp cookie that the browser saved from the login step
    const otpCookie = request.cookies.get('xeco_otp')?.value;

    if (!otpCookie) {
      return NextResponse.json(
        { success: false, message: 'Verification session not found. Please log in again.' },
        { status: 401 }
      );
    }

    // 3. Forward the request to the Render backend, passing the cookie in the header
    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Send the cookie exactly as your backend expects it
        'Cookie': `xeco_otp=${otpCookie}`,
      },
      body: JSON.stringify({ code: body.code }), // Your backend expects "code", not "otp"
    });

    const data = await backendResponse.json();

    const nextResponse = NextResponse.json(data, {
      status: backendResponse.status,
    });

    // 4. If successful, the backend will send back xeco_session and xeco_refresh cookies.
    // We pass them directly to the browser.
    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }

    return nextResponse;

  } catch (error) {
    console.error('OTP Proxy Error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}