// src/app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('xeco_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `xeco_session=${sessionCookie}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const sessionCookie = request.cookies.get('xeco_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const res = await fetch(`${BACKEND_URL}/v1/auth/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `xeco_session=${sessionCookie}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}