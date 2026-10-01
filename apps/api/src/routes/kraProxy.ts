import { Router, Request, Response } from 'express';

const router = Router();

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';
const KRATAX_API_KEY = process.env.KRATAX_INTERNAL_API_KEY;
const REQUEST_TIMEOUT = 30000;

// Simple in-memory rate limit (20 requests/hour per IP)
const IP_BUCKETS = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_HOUR = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = IP_BUCKETS.get(ip);

  if (!bucket || bucket.resetAt < now) {
    IP_BUCKETS.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= MAX_PER_HOUR;
}

/**
 * POST /api/kratax/pin/fetch
 * Proxies KRA PIN requests to the XecoFlow backend.
 */
router.post('/pin/fetch', async (req: Request, res: Response) => {
  try {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again in an hour.',
        code: 'RATE_LIMITED',
      });
    }

    const { taxpayerType, taxpayerId } = req.body;

    if (!taxpayerType || !taxpayerId) {
      return res.status(400).json({
        success: false,
        error: 'taxpayerType and taxpayerId are required',
        code: 'INVALID_REQUEST',
      });
    }

    if (!KRATAX_API_KEY) {
      console.error('[kratax proxy] KRATAX_INTERNAL_API_KEY is not set');
      return res.status(500).json({
        success: false,
        error: 'KRA service not configured',
        code: 'INTERNAL_ERROR',
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${BACKEND_URL}/v1/kratax/pin/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': KRATAX_API_KEY,
        },
        body: JSON.stringify({
          taxpayerType: String(taxpayerType).trim().toUpperCase(),
          taxpayerId: String(taxpayerId).trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));
      return res.status(response.status).json(data);
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Request timed out',
          code: 'KRA_TIMEOUT',
        });
      }

      console.error('[kratax proxy] fetch error:', error.message);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      });
    }
  } catch (error: any) {
    console.error('[kratax proxy] outer error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;