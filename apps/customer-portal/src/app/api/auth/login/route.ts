// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

if (!BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}

const REQUEST_TIMEOUT_MS = 15000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 100;
const AUTH_COOKIE_NAMES = new Set(['xeco_session', 'xeco_otp', 'xeco_refresh']);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_FLAGS: Record<string, string> = {
  xeco_session: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Strict; Path=/`,
  xeco_otp: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Lax; Path=/`,
  xeco_refresh: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Strict; Path=/`,
};

function normalizeStatus(backendStatus: number): number {
  const KNOWN = [200, 400, 401, 403, 423, 429, 500, 502, 503, 504];
  return KNOWN.includes(backendStatus) ? backendStatus : 500;
}

function normalizeAuthCookie(cookie: string, name: string): string {
  const separatorIndex = cookie.indexOf('=');
  if (separatorIndex === -1) throw new Error('Malformed Set-Cookie header');
  
  const rawName = cookie.slice(0, separatorIndex).trim();
  const value = cookie.slice(separatorIndex + 1).split(';')[0].trim();

  const rawAttributes = cookie.split(';').slice(1).map((p) => p.trim()).filter(Boolean);
  const maxAge = rawAttributes.find((p) => {
    const eq = p.indexOf('=');
    if (eq === -1) return false;
    return p.slice(0, eq).trim().toLowerCase() === 'max-age';
  });

  const flags = COOKIE_FLAGS[name] || COOKIE_FLAGS.xeco_session;
  return [`${rawName}=${value}`, flags, maxAge].filter(Boolean).join('; ');
}

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  return xff.split(',')[0]?.trim() || 'unknown';
}

function getIdempotencyKey(request: NextRequest, fallback: string): string {
  const raw = request.headers.get('idempotency-key');
  if (!raw) return fallback;
  return raw.slice(0, MAX_IDEMPOTENCY_KEY_LENGTH);
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const secureHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Request-ID': requestId,
  };

  try {
    const rawBody = await request.json();
    
    // Manual validation instead of Zod
    const email = rawBody.email;
    const password = rawBody.password;
    const rememberMe = rawBody.rememberMe === true;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, code: 'INVALID_REQUEST', requestId }, { status: 400, headers: secureHeaders });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, code: 'INVALID_REQUEST', requestId }, { status: 400, headers: secureHeaders });
    }

    const validatedRequest = { email: email.trim().toLowerCase(), password, rememberMe };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const idempotencyKey = getIdempotencyKey(request, requestId);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Idempotency-Key': idempotencyKey,
        'X-Forwarded-For': getClientIp(request),
      },
      body: JSON.stringify(validatedRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = backendResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST', message: 'The service is temporarily unavailable.', requestId },
        { status: 502, headers: secureHeaders }
      );
    }

    const rawBackendData = (await backendResponse.json()) as any;

    // Normalize backend data manually
    let normalizedBackendData = rawBackendData;
    if (rawBackendData && typeof rawBackendData === 'object') {
      if (rawBackendData.code === 'ACCOUNT_NOT_VERIFIED') {
        normalizedBackendData = { ...rawBackendData, requiresVerification: true };
      } else if (rawBackendData.success === false && !rawBackendData.code) {
        const status = backendResponse.status;
        const code =
          status === 429 ? 'RATE_LIMITED' :
          status === 403 ? 'ACCOUNT_NOT_VERIFIED' :
          status === 400 ? 'INVALID_REQUEST' : 'INVALID_CREDENTIALS';
        normalizedBackendData = { ...rawBackendData, code };
      }
    }

    const finalStatus = normalizeStatus(backendResponse.status);

    const nextResponse = NextResponse.json(normalizedBackendData, {
      status: finalStatus,
      headers: secureHeaders,
    });

    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];

    for (const cookie of setCookieHeaders) {
      const eqIndex = cookie.indexOf('=');
      if (eqIndex === -1) continue;
      const name = cookie.slice(0, eqIndex).trim();
      if (!name || !AUTH_COOKIE_NAMES.has(name)) continue;
      nextResponse.headers.append('Set-Cookie', normalizeAuthCookie(cookie, name));
    }

    return nextResponse;

  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError' || error?.name === 'TimeoutError';

    if (isTimeout) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST', message: 'Request timed out. Please try again.', requestId },
        { status: 504, headers: secureHeaders }
      );
    }

    console.error(JSON.stringify({ event: 'auth.login.proxy_error', requestId, errorName: error?.name || 'unknown' }));

    return NextResponse.json(
      { success: false, code: 'INVALID_REQUEST', message: 'An unexpected error occurred. Please try again.', requestId },
      { status: 500, headers: secureHeaders }
    );
  }
}