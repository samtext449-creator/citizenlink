// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('xeco_session')?.value;
    const refreshCookie = request.cookies.get('xeco_refresh')?.value;

    const cookieHeader = [];
    if (sessionCookie) cookieHeader.push(`xeco_session=${sessionCookie}`);
    if (refreshCookie) cookieHeader.push(`xeco_refresh=${refreshCookie}`);

    // Tell backend to revoke tokens
    if (cookieHeader.length > 0) {
      await fetch(`${BACKEND_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader.join('; '),
        },
      });
    }

    // Clear cookies locally
    const response = NextResponse.json({ success: true });
    response.cookies.delete('xeco_session');
    response.cookies.delete('xeco_refresh');
    response.cookies.delete('xeco_otp');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    // Even if backend fails, clear local cookies
    const response = NextResponse.json({ success: true });
    response.cookies.delete('xeco_session');
    response.cookies.delete('xeco_refresh');
    return response;
  }
}