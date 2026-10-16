// apps/admin-portal/src/lib/admin-reprint-api.ts
//
// Admin API helpers for KRA PIN Reprint Requests.
//
// NOTE: apiKeyGuard is currently disabled on the backend, so no
// x-api-key header is sent. Re-add ADMIN_API_KEY once the guard
// is restored.

const API_BASE =
  process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL ||
  'https://xecoflow-pay.onrender.com';

// TODO: re-enable once apiKeyGuard is restored on the backend
// const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

// What the ADMIN does with a paid request
export type FulfillmentStatus = 'pending' | 'sent' | 'rejected';

// What the PAYMENT ENGINE reports about the STK push
export type PaymentStatus = 'pending' | 'stk_sent' | 'paid' | 'failed';

// Which tab the admin page is filtering by
export type ReprintStatusFilter = 'pending' | 'sent' | 'rejected' | 'failed' | 'all';

export interface ReprintRequest {
  id: string;
  correlation_id: string | null;
  transaction_id: string | null;
  checkout_request_id: string | null;

  // Customer
  taxpayer_name: string;
  taxpayer_id: string;
  email: string;
  payment_phone: string;

  // Payment
  payment_status: PaymentStatus;         // maps to db `status`
  payment_amount: number;                 // maps to db `amount`
  mpesa_receipt: string | null;
  paid_at: string | null;
  error_message: string | null;

  // Fulfillment
  fulfillment_status: FulfillmentStatus;
  sent_at: string | null;
  sent_by: string | null;
  notes: string | null;

  // Meta
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface ReprintCounts {
  pending: number;
  sent: number;
  rejected: number;
  failed: number;
  total: number;
}

export interface ListReprintsParams {
  status?: ReprintStatusFilter;
  search?: string;
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
      // 'x-api-key': ADMIN_API_KEY,  // disabled while guard is off
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
   * Get counts of reprint requests by tab. Used for the sidebar
   * badge (uses `pending`) and the tab labels.
   */
  async getCounts(): Promise<ReprintCounts> {
    return adminFetch<ReprintCounts>('/v1/kratax/admin/reprints/counts');
  },

  /**
   * List reprint requests with optional filters.
   */
  async list(params: ListReprintsParams = {}): Promise<ListReprintsResponse> {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
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