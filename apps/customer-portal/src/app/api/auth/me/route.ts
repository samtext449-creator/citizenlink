// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('xeco_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `xeco_session=${sessionCookie}`,
      },
    });

    if (!backendResponse.ok) {
      // If the token is expired or invalid, clear the cookie on the client
      const response = NextResponse.json(
        { success: false, message: 'Session expired' },
        { status: backendResponse.status }
      );
      if (backendResponse.status === 401) {
        response.cookies.delete('xeco_session');
      }
      return response;
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}