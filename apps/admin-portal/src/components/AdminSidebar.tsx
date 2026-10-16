'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Settings,
  FileText,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
} from 'lucide-react';
import { playNewRequestSound, prewarmAudio, isAudioUnlocked } from '@/lib/sound';
import {
  requestNotificationPermission,
  showDesktopNotification,
  getNotificationPermission,
  type NotificationPermissionState,
} from '@/lib/notifications';

const API_BASE =
  process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL ||
  'https://xecoflow-pay.onrender.com';

const SOUND_MUTED_KEY = 'citizenlink_admin_sound_muted';
const LAST_PENDING_KEY = 'citizenlink_admin_last_pending';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [soundMuted, setSoundMuted] = useState<boolean>(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>('default');

  // Load preferences
  useEffect(() => {
    try {
      const muted = localStorage.getItem(SOUND_MUTED_KEY);
      setSoundMuted(muted === null ? true : muted === 'true');
    } catch {
      setSoundMuted(true);
    }
    setNotifPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_MUTED_KEY, String(soundMuted));
    } catch {}
  }, [soundMuted]);

  // Pre-warm audio + request notification permission on mount
  useEffect(() => {
    prewarmAudio();

    // Wait a beat so the page is interactive, then ask for permission
    const t = setTimeout(() => {
      requestNotificationPermission().then((p) => setNotifPermission(p));
    }, 2000);

    return () => clearTimeout(t);
  }, []);

  // Poll pending count + trigger alerts on increase
  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/v1/kratax/admin/reprints/counts`
        );
        const json = await res.json();

        if (!cancelled && res.ok && json.success) {
          const nextPending = Number(json.data?.pending || 0);
          setPendingCount(nextPending);

          let lastPending: number | null = null;
          try {
            const raw = localStorage.getItem(LAST_PENDING_KEY);
            lastPending = raw === null ? null : Number(raw);
          } catch {}

          const grew = lastPending !== null && nextPending > lastPending;

          if (!soundMuted && grew) {
            // 1. Play sound (works if audio is unlocked)
            playNewRequestSound();

            // 2. Show desktop notification (works when tab is in background)
            showDesktopNotification(
              `${nextPending - (lastPending ?? 0)} new reprint request${
                nextPending - (lastPending ?? 0) > 1 ? 's' : ''
              }`,
              `You have ${nextPending} pending reprint request${
                nextPending > 1 ? 's' : ''
              }.`,
              {
                tag: 'citizenlink-reprints',
                url: '/reprints',
                requireInteraction: true,
              }
            );
          }

          try {
            localStorage.setItem(LAST_PENDING_KEY, String(nextPending));
          } catch {}
        }
      } catch {}
    };

    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [soundMuted]);

  // Toggle sound. When unmuting, request notification permission.
  const toggleSound = async () => {
    const newMuted = !soundMuted;
    setSoundMuted(newMuted);

    if (!newMuted) {
      // User just unmuted — request notification permission
      const p = await requestNotificationPermission();
      setNotifPermission(p);
      // Try to unlock audio right now (this click is a user gesture)
      prewarmAudio();
    }
  };

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
      <div className="h-16 flex items-center px-6 border-b border-slate-800 justify-between">
        <span className="text-xl font-bold tracking-tight">
          CitizenLink <span className="text-blue-400">Admin</span>
        </span>

        <button
          onClick={toggleSound}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title={soundMuted ? 'Enable alerts' : 'Mute alerts'}
        >
          {soundMuted ? (
            <VolumeX className="h-4 w-4 text-slate-400" />
          ) : (
            <Volume2 className="h-4 w-4 text-emerald-400" />
          )}
        </button>
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

      {/* Notification status footer */}
      {!soundMuted && notifPermission === 'granted' && (
        <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-emerald-400" />
          Desktop alerts enabled
        </div>
      )}
      {!soundMuted && notifPermission === 'denied' && (
        <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-amber-500 flex items-center gap-2">
          <BellOff className="h-3.5 w-3.5" />
          Notifications blocked in browser
        </div>
      )}
    </aside>
  );
}