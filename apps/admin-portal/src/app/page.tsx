'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Settings,
  Bell,
  Search,
  CheckCircle,
  XOctagon,
  Clock,
  RefreshCw,
  TrendingUp,
  BadgeCheck,
  Play,
  Pause,
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL ||
  'https://xecoflow-pay.onrender.com';

const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

const AUTO_REFRESH_MS = 30_000;

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

interface TopError {
  error_code: string;
  count: number;
  last_seen: string;
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
  topErrors: TopError[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // ─── Fetch stats ──────────────────────────────────────────────
  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/kratax/stats`, {
        headers: { 'x-api-key': ADMIN_API_KEY },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatsError(json.error || `HTTP ${res.status}`);
        return;
      }
      setStats(json.data);
      setLastUpdated(Date.now());
    } catch (err: any) {
      setStatsError(err.message || 'Network error');
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchStats, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // ─── Filtering ────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    if (!stats) return [];

    const q = searchTerm.trim().toLowerCase();

    return stats.recent.filter((row) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'success' && row.status !== 'success') return false;
        if (statusFilter === 'failure' && row.status !== 'failure') return false;
      }
      // Type filter
      if (typeFilter !== 'all' && row.taxpayer_type !== typeFilter) return false;
      // Search
      if (q) {
        const hay = [
          row.correlation_id,
          row.endpoint,
          row.error_code,
          row.event_type,
          row.taxpayer_type,
          row.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [stats, searchTerm, statusFilter, typeFilter]);

  const availableTypes = useMemo(() => {
    if (!stats) return [];
    const s = new Set<string>();
    stats.recent.forEach((r) => {
      if (r.taxpayer_type) s.add(r.taxpayer_type);
    });
    return Array.from(s).sort();
  }, [stats]);

  // ─── Formatting helpers ───────────────────────────────────────
  const formatDuration = (ms: number | null) => {
    if (ms === null || ms === undefined) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
  };

  const formatClockTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const lastUpdatedLabel = lastUpdated
    ? `Last updated ${Math.floor((Date.now() - lastUpdated) / 1000)}s ago`
    : 'Loading…';

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold tracking-tight">
            CitizenLink <span className="text-blue-400">Admin</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg text-sm font-medium transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
          >
            <Activity className="h-5 w-5" /> Calls
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
          >
            <AlertTriangle className="h-5 w-5" /> Errors
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
          >
            <Settings className="h-5 w-5" /> Settings
          </a>
        </nav>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 gap-4">
          <h1 className="text-xl font-semibold text-gray-800 whitespace-nowrap">
            System Dashboard
          </h1>

          {/* Correlation ID search */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search correlation ID, endpoint, error code…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Auto-refresh is on (30s)' : 'Auto-refresh is paused'}
            >
              {autoRefresh ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {autoRefresh ? 'Live' : 'Paused'}
            </button>

            {/* Manual refresh */}
            <button
              onClick={fetchStats}
              disabled={statsLoading}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-40"
              title="Refresh now"
            >
              <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            </button>

            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">

          {/* Error banner */}
          {statsError && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
              <XOctagon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Failed to load stats</p>
                <p className="text-xs text-red-600 mt-0.5">{statsError}</p>
              </div>
            </div>
          )}

          {/* ═══ SYSTEM HEALTH ═══ */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-widest">
                System Health
              </h2>
              <span className="text-[10px] font-medium text-gray-500 ml-auto">
                {lastUpdatedLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Today */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Today</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading && !stats ? '—' : stats?.today ?? 0}
                </p>
              </div>

              {/* Week */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">This Week</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading && !stats ? '—' : stats?.week ?? 0}
                </p>
              </div>

              {/* Month */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">This Month</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading && !stats ? '—' : stats?.month ?? 0}
                </p>
              </div>

              {/* Success Rate */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Success Rate</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading && !stats
                    ? '—'
                    : stats
                    ? `${(stats.successRate * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>

            {stats && (
              <p className="text-xs text-gray-500 mt-3 pl-1">
                {stats.total.toLocaleString()} total calls · avg response{' '}
                {formatDuration(stats.avgDurationMs)}
              </p>
            )}
          </section>

          {/* ═══ RECENT CALLS ═══ */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Recent Calls</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Last 50 API calls · auto-refresh every 30s when Live
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status filter */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {(['all', 'success', 'failure'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                        statusFilter === s
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {s === 'all' ? 'All' : s}
                    </button>
                  ))}
                </div>

                {/* Type filter */}
                {availableTypes.length > 0 && (
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All types</option>
                    {availableTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Time</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Event</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Endpoint</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Type</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Error</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statsLoading && !stats && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {stats && filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                        {stats.recent.length === 0
                          ? 'No calls logged yet'
                          : 'No calls match the current filters'}
                      </td>
                    </tr>
                  )}
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">{formatTimestamp(row.timestamp)}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{formatClockTime(row.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-gray-700">
                        {row.event_type}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-mono text-gray-500">
                        {row.endpoint || '—'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-600">
                        {row.taxpayer_type || '—'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
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
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-mono text-red-600">
                        {row.error_code || '—'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-500 text-right font-mono">
                        {formatDuration(row.duration_ms)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {stats && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {filteredRows.length} of {stats.recent.length} recent
                </span>
                {searchTerm && (
                  <span className="text-gray-400">
                    Filter: <span className="font-mono">{searchTerm}</span>
                  </span>
                )}
              </div>
            )}
          </section>

          {/* ═══ TOP ERRORS ═══ */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-base font-semibold text-gray-800">Top Errors</h2>
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">
                  Last 24h
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Most common failure codes with counts and last occurrence.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Error Code</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Count</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statsLoading && !stats && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-400">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {stats && (!stats.topErrors || stats.topErrors.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center">
                        <div className="inline-flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          No errors in the last 24 hours
                        </div>
                      </td>
                    </tr>
                  )}
                  {stats?.topErrors?.map((err) => (
                    <tr key={err.error_code} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-mono font-medium text-red-700">
                        {err.error_code}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-right">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold">
                          {err.count}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-500 text-right">
                        {formatTimestamp(err.last_seen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer status line */}
          <div className="text-center text-[11px] text-gray-400 pt-4 pb-2">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {autoRefresh ? 'Auto-refreshing every 30s' : 'Auto-refresh paused'}
              {lastUpdated && <span> · {lastUpdatedLabel}</span>}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}