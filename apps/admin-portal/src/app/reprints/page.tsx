'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Bell,
  RefreshCw,
  Clock,
  CheckCircle,
  XOctagon,
  AlertCircle,
  Mail,
  Phone,
  Hash,
  User,
  Play,
  Pause,
  Send,
  XCircle,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  adminReprintApi,
  AdminApiError,
  type ReprintRequest,
  type PaymentStatus,
  type ReprintStatusFilter,
} from '@/lib/admin-reprint-api';

const AUTO_REFRESH_MS = 30_000;

// ─── Payment status visuals ───────────────────────────────────────
const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; icon: any }
> = {
  pending: {
    label: 'Pending',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: Clock,
  },
  stk_sent: {
    label: 'Awaiting PIN',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: Clock,
  },
  paid: {
    label: 'Paid',
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: CheckCircle,
  },
  failed: {
    label: 'Payment Failed',
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: XOctagon,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────
function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ─── Main page ────────────────────────────────────────────────────
export default function ReprintsPage() {
  const [items, setItems] = useState<ReprintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReprintStatusFilter>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Server-side counts (from /counts endpoint)
  const [counts, setCounts] = useState({
    pending: 0,
    sent: 0,
    rejected: 0,
    failed: 0,
    total: 0,
  });

  // ─── Fetch list ───────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminReprintApi.list({
        status: statusFilter,
        search: searchTerm.trim() || undefined,
        limit: 100,
      });
      setItems(res.items);
      setLastUpdated(Date.now());
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to load reprint requests.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  // ─── Fetch counts (for tab labels) ────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const c = await adminReprintApi.getCounts();
      setCounts(c);
    } catch {
      // silent — counts are non-critical
    }
  }, []);

  // Initial + whenever filters change
  useEffect(() => {
    fetchItems();
    fetchCounts();
  }, [fetchItems, fetchCounts]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchItems();
      fetchCounts();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, fetchItems, fetchCounts]);

  // ─── Actions ──────────────────────────────────────────────────
  const handleMarkSent = async (item: ReprintRequest) => {
    const sentBy = window.prompt(
      `Mark as SENT?\n\nConfirm that you have emailed the certificate to:\n${item.email}\n\nEnter your name/email (for the audit trail):`
    );
    if (!sentBy || !sentBy.trim()) return;

    const notes = window.prompt(
      'Optional note (e.g. "Sent via Gmail at 10:15 AM"). Leave blank to skip:'
    );

    setBusyId(item.id);
    try {
      const updated = await adminReprintApi.markSent(item.id, {
        sentBy: sentBy.trim(),
        notes: notes?.trim() || undefined,
      });
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      fetchCounts();
    } catch (err) {
      if (err instanceof AdminApiError) {
        alert(`Failed: ${err.message}`);
      } else {
        alert('Failed to update. Try again.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item: ReprintRequest) => {
    const reason = window.prompt(
      `Reject this request?\n\nCustomer: ${item.taxpayer_name}\nEmail: ${item.email}\n\nReason for rejection:`
    );
    if (!reason || !reason.trim()) return;

    const rejectedBy = window.prompt('Enter your name/email (for the audit trail):');
    if (!rejectedBy || !rejectedBy.trim()) return;

    setBusyId(item.id);
    try {
      const updated = await adminReprintApi.reject(item.id, {
        rejectedBy: rejectedBy.trim(),
        reason: reason.trim(),
      });
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      fetchCounts();
    } catch (err) {
      if (err instanceof AdminApiError) {
        alert(`Failed: ${err.message}`);
      } else {
        alert('Failed to update. Try again.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const lastUpdatedLabel = lastUpdated
    ? `Last updated ${Math.floor((Date.now() - lastUpdated) / 1000)}s ago`
    : 'Loading…';

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 gap-4">
          <h1 className="text-xl font-semibold text-gray-800 whitespace-nowrap">
            Reprint Requests
          </h1>

          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, ID, email, M-Pesa receipt…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Auto-refresh on (30s)' : 'Auto-refresh paused'}
            >
              {autoRefresh ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {autoRefresh ? 'Live' : 'Paused'}
            </button>

            <button
              onClick={() => {
                fetchItems();
                fetchCounts();
              }}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-40"
              title="Refresh now"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {(
                [
                  { key: 'pending', label: `Pending (${counts.pending})` },
                  { key: 'sent', label: `Sent (${counts.sent})` },
                  { key: 'failed', label: `Failed (${counts.failed})` },
                  { key: 'rejected', label: `Rejected (${counts.rejected})` },
                  { key: 'all', label: 'All' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as ReprintStatusFilter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-gray-400">{lastUpdatedLabel}</span>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Failed to load</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Empty / loading states */}
          {loading && items.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <RefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-500">Loading requests…</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? 'No requests match your search.'
                  : statusFilter === 'pending'
                  ? 'No pending requests. All caught up.'
                  : statusFilter === 'failed'
                  ? 'No failed payments.'
                  : statusFilter === 'all'
                  ? 'No reprint requests yet.'
                  : `No ${statusFilter} requests.`}
              </p>
            </div>
          )}

          {/* Cards */}
          <div className="space-y-3">
            {items.map((item) => {
              const config = PAYMENT_STATUS_CONFIG[item.payment_status];
              const StatusIcon = config.icon;
              const isBusy = busyId === item.id;

              const isPaid = item.payment_status === 'paid';
              const isFailed = item.payment_status === 'failed';
              const isAwaiting = item.payment_status === 'stk_sent';
              const canFulfill = isPaid && item.fulfillment_status === 'pending';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left: customer info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.text}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>

                        {isPaid && item.fulfillment_status === 'sent' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3" />
                            Certificate Sent
                          </span>
                        )}

                        {isPaid && item.fulfillment_status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-700">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </span>
                        )}

                        {item.mpesa_receipt && (
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                            {item.mpesa_receipt}
                          </span>
                        )}

                        <span className="text-[10px] text-gray-400">
                          {formatRelativeTime(item.paid_at || item.created_at)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-800 truncate">
                            {item.taxpayer_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-mono text-gray-600">
                            {item.taxpayer_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 truncate">{item.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-mono text-gray-600">
                            {item.payment_phone}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                        <span className="font-semibold text-gray-700">
                          {formatKes(item.payment_amount)}
                        </span>

                        {isPaid && item.paid_at && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>Paid {formatDateTime(item.paid_at)}</span>
                          </>
                        )}

                        {isFailed && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-red-600">
                              Attempted {formatDateTime(item.created_at)}
                            </span>
                          </>
                        )}

                        {isAwaiting && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-blue-600">
                              STK sent {formatDateTime(item.updated_at)}
                            </span>
                          </>
                        )}

                        {item.sent_at && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-green-600">
                              Sent {formatDateTime(item.sent_at)} by {item.sent_by}
                            </span>
                          </>
                        )}
                      </div>

                      {isFailed && item.error_message && (
                        <p className="mt-2 text-[11px] text-red-600 italic">
                          {item.error_message}
                        </p>
                      )}

                      {item.notes && (
                        <p className="mt-2 text-[11px] text-gray-500 italic">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {canFulfill && (
                        <>
                          <button
                            onClick={() => handleMarkSent(item)}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {isBusy ? 'Working…' : 'Mark as Sent'}
                          </button>
                          <button
                            onClick={() => handleReject(item)}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </>
                      )}

                      {isPaid && item.fulfillment_status === 'sent' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] text-green-700 bg-green-50 rounded-lg">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Completed
                        </span>
                      )}

                      {isPaid && item.fulfillment_status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] text-gray-600 bg-gray-100 rounded-lg">
                          <XCircle className="h-3.5 w-3.5" />
                          Rejected
                        </span>
                      )}

                      {isFailed && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] text-red-700 bg-red-50 rounded-lg">
                          <XOctagon className="h-3.5 w-3.5" />
                          Payment Failed
                        </span>
                      )}

                      {isAwaiting && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] text-blue-700 bg-blue-50 rounded-lg">
                          <Clock className="h-3.5 w-3.5" />
                          Awaiting PIN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center text-[11px] text-gray-400 pt-6 pb-2">
            {autoRefresh ? 'Auto-refreshing every 30s' : 'Auto-refresh paused'}
            {lastUpdated && ` · ${lastUpdatedLabel}`}
          </div>
        </div>
      </main>
    </div>
  );
}