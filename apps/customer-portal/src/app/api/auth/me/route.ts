// src/lib/session.ts
// Reads the `exp` claim from a JWT WITHOUT verifying it.
// Safe here because it is only used to tell the UI when to show the warning;
// the backend still verifies the real token on every request.
export function decodeJwtExp(token: string | undefined | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const exp = JSON.parse(json)?.exp;
    return typeof exp === 'number' ? exp * 1000 : null; // ms since epoch
  } catch {
    return null;
  }
}