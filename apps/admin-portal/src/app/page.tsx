'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  XCircle,
  CreditCard,
  BadgeCheck,
  TrendingUp,
  Activity,
  CheckCircle,
  XOctagon,
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL ||
  'https://xecoflow-pay.onrender.com';

// Admin read key — same value as backend KRATAX_ADMIN_READ_KEY
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

// ─── Types ───────────────────────────────────────────────────────
interface AuditRow {
  id: string;
  timestamp: string;
  event_type: string;
  status: string;
  duration_ms: number | null;
  endpoint: string | null;
  method: string | null;
  taxpayer_type: string | null;
  error_code: string | null;
  correlation_id: string | null;
}

interface StatsData {
  today: number;
  week: number;
  month: number;
  total: number;
  successRate: number;
  avgDurationMs: number;
  byStatus: Record<string, number>;
  recent: AuditRow[];
}

// ─── Mock data — kept for the "Demo" table below ─────────────────
const initialRequests = [
  {
    id: 'CLA-2026-001', customer: 'John Doe', phone: '0712345678', service: 'KRA PIN',
    status: 'Processing', date: '2026-09-30',
    paymentStatus: 'Paid', mpesaReceipt: 'TGH5KD9L1M', amount: 25,
  },
  {
    id: 'CLA-2026-002', customer: 'Jane Smith', phone: '0723456789', service: 'KRA Returns',
    status: 'Completed', date: '2026-09-29',
    paymentStatus: 'Paid', mpesaReceipt: 'TGH7AB2C3D', amount: 25,
  },
  {
    id: 'CLA-2026-003', customer: 'Alice Wanjiku', phone: '0734567890', service: 'KRA PIN',
    status: 'Pending Payment', date: '2026-09-30',
    paymentStatus: 'Unpaid', mpesaReceipt: null, amount: 25,
  },
  {
    id: 'CLA-2026-004', customer: 'Brian Otieno', phone: '0745678901', service: 'TCC Application',
    status: 'Pending Payment', date: '2026-09-30',
    paymentStatus: 'Failed', mpesaReceipt: null, amount: 25,
  },
  {
    id: 'CLA-2026-005', customer: 'Mary Mwangi', phone: '0756789012', service: 'KRA PIN',
    status: 'Completed', date: '2026-09-28',
    paymentStatus: 'Paid', mpesaReceipt: 'TGH9XY8Z7W', amount: 25,
  },
];

export default function AdminDashboard() {
  // ─── Real stats state ─────────────────────────────────────────
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // ─── Mock table state (unchanged) ─────────────────────────────
  const [requests, setRequests] = useState(initialRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // ─── Fetch real stats from backend ────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const res = await fetch(`${API_BASE}/v1/kratax/stats`, {
          headers: { 'x-api-key': ADMIN_API_KEY },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setStatsError(json.error || `HTTP ${res.status}`);
          return;
        }
        setStats(json.data);
      } catch (err: any) {
        if (cancelled) return;
        setStatsError(err.message || 'Network error');
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    fetchStats();
    // Refresh every 60s
    const interval = setInterval(fetchStats, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── Mock table derived state ─────────────────────────────────
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'All' || req.paymentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const unpaidCount = requests.filter((r) => r.paymentStatus === 'Unpaid').length;
  const paidCount = requests.filter((r) => r.paymentStatus === 'Paid').length;
  const failedCount = requests.filter((r) => r.paymentStatus === 'Failed').length;
  const totalRevenue = requests
    .filter((r) => r.paymentStatus === 'Paid')
    .reduce((sum, r) => sum + r.amount, 0);

  // ─── Handlers (unchanged) ─────────────────────────────────────
  const handleFileUpload = (id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingId(id);
      setTimeout(() => {
        setRequests((prev) =>
          prev.map((req) => (req.id === id ? { ...req, status: 'Completed' } : req))
        );
        setUploadingId(null);
      }, 1500);
    };
    input.click();
  };

  const updateStatus = (id: string, newStatus: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );
  };

  // ─── Formatting helpers ───────────────────────────────────────
  const formatDuration = (ms: number | null) => {
    if (ms === null || ms === undefined) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ════════ SIDEBAR (unchanged) ════════ */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold tracking-tight">
            CitizenLink <span className="text-blue-400">Admin</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg text-sm font-medium transition-colors">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
            <FileText className="h-5 w-5" /> All Requests
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
            <CreditCard className="h-5 w-5" /> Payments
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
            <Users className="h-5 w-5" /> Customers
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
            <Settings className="h-5 w-5" /> Settings
          </a>
        </nav>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard Overview</h1>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
              <span className="text-xs font-medium text-green-700">Revenue:</span>
              <span className="text-sm font-bold text-green-700">KES {totalRevenue.toLocaleString()}</span>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">

          {/* ════════ REAL STATS — from /v1/kratax/stats ════════ */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Live Activity
                </h2>
                <span className="text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                  {statsLoading ? 'updating…' : 'live'}
                </span>
              </div>
              {statsError && (
                <span className="text-xs text-red-600">⚠ {statsError}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading && !stats ? '—' : stats?.today ?? 0}
                  </p>
                </div>
              </div>

              {/* This Week */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Activity className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading && !stats ? '—' : stats?.week ?? 0}
                  </p>
                </div>
              </div>

              {/* This Month */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading && !stats ? '—' : stats?.month ?? 0}
                  </p>
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <BadgeCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading && !stats
                      ? '—'
                      : stats
                      ? `${(stats.successRate * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
              </div>
            </div>

            {/* Avg duration + total as a subtle line */}
            {stats && (
              <p className="text-xs text-gray-500 mt-3 pl-1">
                {stats.total.toLocaleString()} total calls · avg response {formatDuration(stats.avgDurationMs)}
              </p>
            )}
          </section>

          {/* ════════ RECENT ACTIVITY — real rows ════════ */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Last 20 API calls (source: <span className="font-mono">kratax_audit_logs</span>)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statsLoading && !stats && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {stats && stats.recent.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                        No activity yet
                      </td>
                    </tr>
                  )}
                  {stats?.recent.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                        {formatTimestamp(row.timestamp)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-700">
                        {row.event_type}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-gray-500">
                        {row.endpoint || '—'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                        {row.taxpayer_type || '—'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            row.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {row.status === 'success' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XOctagon className="h-3 w-3" />
                          )}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500 text-right font-mono">
                        {formatDuration(row.duration_ms)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ════════ DEMO — Payments (mock, unchanged) ════════ */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Requests</h2>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Demo · Payments coming soon
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Placeholder data — will be replaced when payments integration ships.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {['All', 'Paid', 'Unpaid', 'Failed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        filterStatus === status
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-56"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-900">{req.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{req.customer}</div>
                        <div className="text-xs text-gray-500">{req.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {req.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                              req.paymentStatus === 'Paid'
                                ? 'bg-green-100 text-green-800'
                                : req.paymentStatus === 'Unpaid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {req.paymentStatus === 'Paid' && <CheckCircle2 className="h-3 w-3" />}
                            {req.paymentStatus === 'Unpaid' && <Clock className="h-3 w-3" />}
                            {req.paymentStatus === 'Failed' && <XCircle className="h-3 w-3" />}
                            {req.paymentStatus}
                          </span>
                          {req.mpesaReceipt && (
                            <span className="text-[10px] text-gray-400 font-mono">{req.mpesaReceipt}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            req.status === 'Pending Payment'
                              ? 'bg-amber-100 text-amber-800'
                              : req.status === 'Processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {req.paymentStatus !== 'Paid' ? (
                          <span className="text-xs text-gray-400 italic">
                            {req.paymentStatus === 'Failed' ? 'Awaiting retry' : 'Waiting for payment'}
                          </span>
                        ) : req.status === 'Pending Payment' ? (
                          <button
                            onClick={() => updateStatus(req.id, 'Processing')}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                          >
                            Start Processing
                          </button>
                        ) : req.status === 'Processing' ? (
                          <button
                            onClick={() => handleFileUpload(req.id)}
                            disabled={uploadingId === req.id}
                            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {uploadingId === req.id ? (
                              'Uploading...'
                            ) : (
                              <>
                                <UploadCloud className="h-3.5 w-3.5" /> Upload PIN
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">✓ Delivered</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRequests.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">No requests found</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>
                Showing {filteredRequests.length} of {requests.length} requests
              </span>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>
                  Previous
                </button>
                <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}