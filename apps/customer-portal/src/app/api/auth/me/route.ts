// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

// Reads the `exp` claim from a JWT WITHOUT verifying it.
// Only used to tell the UI when to show the warning; the backend still
// verifies the real token on every request.
function decodeJwtExp(token: string | undefined | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = Buffer.from(
      payload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8');
    const exp = JSON.parse(json)?.exp;
    return typeof exp === 'number' ? exp * 1000 : null; // ms since epoch
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('xeco_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // We call the Taxflow-specific endpoint we just created
    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/taxflow/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `xeco_session=${sessionCookie}`,
      },
    });

    if (!backendResponse.ok) {
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

    // Tell the frontend when this session ends so it can warn the user
    const expMs = decodeJwtExp(sessionCookie);
    if (expMs && data?.data) {
      data.data.session_expires_at = new Date(expMs).toISOString();
    }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}