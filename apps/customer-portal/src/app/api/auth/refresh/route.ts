// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;
const REQUEST_TIMEOUT_MS = 15000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const AUTH_COOKIE_NAMES = new Set(['xeco_session', 'xeco_refresh']);

const COOKIE_FLAGS = `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Strict; Path=/`;

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

// Same normalisation as the login route: keep name, value and Max-Age, force our flags
function normalizeAuthCookie(cookie: string): string {
  const eq = cookie.indexOf('=');
  const name = cookie.slice(0, eq).trim();
  const value = cookie.slice(eq + 1).split(';')[0].trim();
  const maxAge = cookie
    .split(';')
    .slice(1)
    .map((p) => p.trim())
    .find((p) => p.toLowerCase().startsWith('max-age='));
  return [`${name}=${value}`, COOKIE_FLAGS, maxAge].filter(Boolean).join('; ');
}

export async function POST(request: NextRequest) {
  const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' };

  const refreshCookie = request.cookies.get('xeco_refresh')?.value;
  const sessionCookie = request.cookies.get('xeco_session')?.value;

  if (!refreshCookie) {
    return NextResponse.json({ success: false, message: 'No refresh token' }, { status: 401, headers });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const cookieHeader = [
      sessionCookie ? `xeco_session=${sessionCookie}` : null,
      `xeco_refresh=${refreshCookie}`,
    ].filter(Boolean).join('; ');

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: '{}', // backend reads req.body.refreshToken, so it needs a body to parse
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!backendResponse.ok) {
      const res = NextResponse.json(
        { success: false, message: 'Session could not be extended' },
        { status: backendResponse.status === 401 ? 401 : 400, headers }
      );
      if (backendResponse.status === 401) {
        res.cookies.delete('xeco_session');
        res.cookies.delete('xeco_refresh');
      }
      return res;
    }

    const body = await backendResponse.json().catch(() => ({}));

    const cookiesToSet: string[] = [];
    let newSession: string | undefined;
    for (const cookie of backendResponse.headers.getSetCookie?.() || []) {
      const name = cookie.slice(0, cookie.indexOf('=')).trim();
      if (!AUTH_COOKIE_NAMES.has(name)) continue;
      if (name === 'xeco_session') newSession = cookie.slice(cookie.indexOf('=') + 1).split(';')[0];
      cookiesToSet.push(normalizeAuthCookie(cookie));
    }

    // Prefer the expiry the backend reports; fall back to reading the new JWT
    const expMs =
      (body?.sessionInfo?.expiresAt
        ? new Date(body.sessionInfo.expiresAt).getTime()
        : null) ?? decodeJwtExp(newSession);

    const res = NextResponse.json(
      { success: true, data: { session_expires_at: expMs ? new Date(expMs).toISOString() : null } },
      { headers }
    );
    for (const c of cookiesToSet) res.headers.append('Set-Cookie', c);
    return res;
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500, headers });
  }
}