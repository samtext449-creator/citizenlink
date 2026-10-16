// apps/admin-portal/src/lib/admin-reprint-api.ts
//
// Admin API helpers for KRA PIN Reprint Requests.
// All requests go through /v1/kratax/admin/reprints/* with x-api-key header.

const API_BASE =
  process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL ||
  'https://xecoflow-pay.onrender.com';

const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ReprintStatus = 'pending' | 'sent' | 'failed' | 'rejected';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface ReprintRequest {
  id: string;
  correlation_id: string | null;
  intent_id: string;
  checkout_request_id: string | null;

  // Payment
  payment_status: PaymentStatus;
  payment_amount: number;
  mpesa_receipt: string | null;
  paid_at: string | null;

  // Customer (decrypted server-side)
  taxpayer_name: string;
  taxpayer_id: string;
  taxpayer_id_hash: string;
  email: string;
  payment_phone: string;

  // Fulfillment
  fulfillment_status: ReprintStatus;
  sent_at: string | null;
  sent_by: string | null;
  notes: string | null;

  // Meta
  created_at: string;
  expires_at: string | null;
}

export interface ReprintCounts {
  pending: number;
  sent: number;
  failed: number;
  rejected: number;
  total: number;
}

export interface ListReprintsParams {
  status?: ReprintStatus | 'all';
  search?: string;   // matches name, ID, email, receipt
  limit?: number;
  offset?: number;
}

export interface ListReprintsResponse {
  items: ReprintRequest[];
  total: number;
  limit: number;
  offset: number;
}

// ─────────────────────────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────────────────────────

export class AdminApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
  }
}

// ─────────────────────────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────────────────────────

async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ADMIN_API_KEY,
      ...(options.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    const message =
      json?.error?.message ||
      json?.error ||
      `Request failed with status ${res.status}`;
    throw new AdminApiError(message, res.status, json?.error?.code);
  }

  return json.data as T;
}

// ─────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────

export const adminReprintApi = {
  /**
   * Get counts of reprint requests by status.
   * Used for the sidebar badge.
   */
  async getCounts(): Promise<ReprintCounts> {
    return adminFetch<ReprintCounts>('/v1/kratax/admin/reprints/counts');
  },

  /**
   * List reprint requests with optional filters.
   */
  async list(params: ListReprintsParams = {}): Promise<ListReprintsResponse> {
    const qs = new URLSearchParams();
    if (params.status && params.status !== 'all') qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));

    const query = qs.toString();
    return adminFetch<ListReprintsResponse>(
      `/v1/kratax/admin/reprints${query ? `?${query}` : ''}`
    );
  },

  /**
   * Fetch a single reprint request by ID.
   */
  async get(id: string): Promise<ReprintRequest> {
    return adminFetch<ReprintRequest>(`/v1/kratax/admin/reprints/${id}`);
  },

  /**
   * Mark a reprint request as sent.
   * Called after the admin has manually emailed the certificate.
   */
  async markSent(
    id: string,
    payload: { sentBy: string; notes?: string }
  ): Promise<ReprintRequest> {
    return adminFetch<ReprintRequest>(
      `/v1/kratax/admin/reprints/${id}/mark-sent`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Mark a reprint request as rejected.
   * Used when the admin decides the request cannot be fulfilled.
   */
  async reject(
    id: string,
    payload: { rejectedBy: string; reason: string }
  ): Promise<ReprintRequest> {
    return adminFetch<ReprintRequest>(
      `/v1/kratax/admin/reprints/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },
};