'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
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
import {
  prewarmAudio,
  startAlarm,
  stopAlarm,
} from '@/lib/sound';
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

// Poll every 2 seconds — gives near-instant feedback
const POLL_INTERVAL_MS = 2_000;

export default function AdminSidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [soundMuted, setSoundMuted] = useState<boolean>(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>('default');

  // ─── Load preferences ─────────────────────────────────────────
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

  // ─── Pre-warm audio + ask notification permission ─────────────
  useEffect(() => {
    prewarmAudio();
    const t = setTimeout(() => {
      requestNotificationPermission().then((p) => setNotifPermission(p));
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  // ─── Stop the alarm when the user mutes ───────────────────────
  useEffect(() => {
    if (soundMuted) {
      stopAlarm();
    }
  }, [soundMuted]);

  // ─── Fetch counts (called on interval + on demand) ────────────
  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/v1/kratax/admin/reprints/counts`
      );
      const json = await res.json();

      if (res.ok && json.success) {
        const nextPending = Number(json.data?.pending || 0);
        setPendingCount(nextPending);

        let lastPending: number | null = null;
        try {
          const raw = localStorage.getItem(LAST_PENDING_KEY);
          lastPending = raw === null ? null : Number(raw);
        } catch {}

        const grew = lastPending !== null && nextPending > lastPending;

        // ─── New request arrived ────────────────────────────
        if (!soundMuted && grew) {
          startAlarm();
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

        // ─── All pending resolved → stop alarm ──────────────
        if (nextPending === 0) {
          stopAlarm();
        }

        try {
          localStorage.setItem(LAST_PENDING_KEY, String(nextPending));
        } catch {}
      }
    } catch {
      // silent
    }
  }, [soundMuted]);

  // ─── Poll every 2s ────────────────────────────────────────────
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchCount]);

  // ─── Listen for manual "refresh now" events ───────────────────
  useEffect(() => {
    const handler = () => fetchCount();
    window.addEventListener('citizenlink:refresh-counts', handler);
    return () => window.removeEventListener('citizenlink:refresh-counts', handler);
  }, [fetchCount]);

  // ─── Toggle sound ─────────────────────────────────────────────
  const toggleSound = async () => {
    const newMuted = !soundMuted;
    setSoundMuted(newMuted);

    if (!newMuted) {
      // Force-unlock audio in this user gesture
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctx.resume().then(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }).catch(() => {});

      const p = await requestNotificationPermission();
      setNotifPermission(p);
      prewarmAudio();

      // Ring immediately if there's already pending work
      if (pendingCount > 0) {
        startAlarm();
      }
    } else {
      stopAlarm();
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
            <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
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
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-bold animate-pulse">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </Link>

        <Link href="/settings" className={itemClass(isActive('/settings'))}>
          <Settings className="h-5 w-5" /> Settings
        </Link>
      </nav>

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