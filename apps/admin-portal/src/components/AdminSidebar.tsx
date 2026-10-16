'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Settings,
  FileText,
} from 'lucide-react';

const API_BASE =
  process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL ||
  'https://xecoflow-pay.onrender.com';

const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  // Poll pending reprint count every 60s (silent, non-critical)
  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/kratax/admin/reprints/counts`, {
          headers: { 'x-api-key': ADMIN_API_KEY },
        });
        const json = await res.json();
        if (!cancelled && res.ok && json.success) {
          setPendingCount(json.data?.pending || 0);
        }
      } catch {
        // silent — badge is cosmetic
      }
    };

    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  const itemClass = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
    }`;

  return (
    <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-xl font-bold tracking-tight">
          CitizenLink <span className="text-blue-400">Admin</span>
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/dashboard" className={itemClass(isActive('/dashboard'))}>
          <LayoutDashboard className="h-5 w-5" /> Dashboard
        </Link>

        <Link href="/calls" className={itemClass(isActive('/calls'))}>
          <Activity className="h-5 w-5" /> Calls
        </Link>

        <Link href="/errors" className={itemClass(isActive('/errors'))}>
          <AlertTriangle className="h-5 w-5" /> Errors
        </Link>

        {/* Reprint Requests (new) */}
        <Link href="/reprints" className={itemClass(isActive('/reprints'))}>
          <FileText className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1">Reprint Requests</span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-bold">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </Link>

        <Link href="/settings" className={itemClass(isActive('/settings'))}>
          <Settings className="h-5 w-5" /> Settings
        </Link>
      </nav>
    </aside>
  );
}