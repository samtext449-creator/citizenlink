// apps/admin-portal/src/lib/notifications.ts
//
// Desktop notification helper. Requests permission on first use and
// shows native browser notifications (works even when the tab is
// in the background).

const PERMISSION_KEY = 'citizenlink_admin_notif_asked';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests notification permission once. Subsequent calls are no-ops.
 * Returns the resulting permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  // Already asked? Don't nag again — return current state.
  try {
    if (localStorage.getItem(PERMISSION_KEY) === '1') {
      return Notification.permission as NotificationPermissionState;
    }
    localStorage.setItem(PERMISSION_KEY, '1');
  } catch {}

  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return 'default';
  }
}

/**
 * Shows a desktop notification. Silently no-ops if permission is not granted.
 */
export function showDesktopNotification(
  title: string,
  body: string,
  options: { tag?: string; url?: string; requireInteraction?: boolean } = {}
): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: options.tag,                        // dedupes by tag
      requireInteraction: options.requireInteraction ?? false,
      silent: false,
    });

    if (options.url) {
      n.onclick = () => {
        window.focus();
        window.location.href = options.url!;
        n.close();
      };
    }
  } catch {
    // Some browsers throw if notification can't be shown
  }
}