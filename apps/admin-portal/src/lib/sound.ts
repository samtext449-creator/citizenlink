// apps/admin-portal/src/lib/sound.ts

let audioCtx: AudioContext | null = null;
let unlockInstalled = false;

function createCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
}

export function unlockAudio(): void {
  const ctx = createCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function installUnlockListeners(): void {
  if (typeof window === 'undefined') return;
  if (unlockInstalled) return;
  unlockInstalled = true;

  const onGesture = () => {
    unlockAudio();
    window.removeEventListener('click', onGesture);
    window.removeEventListener('keydown', onGesture);
    window.removeEventListener('touchstart', onGesture);
  };

  window.addEventListener('click', onGesture, { once: true, passive: true });
  window.addEventListener('keydown', onGesture, { once: true, passive: true });
  window.addEventListener('touchstart', onGesture, { once: true, passive: true });
}

if (typeof window !== 'undefined') {
  installUnlockListeners();
}

// ─────────────────────────────────────────────────────────────────
// Single-shot chime
// ─────────────────────────────────────────────────────────────────
export function playNewRequestSound(): void {
  const ctx = createCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const tones = [
    { freq: 880, start: 0,    dur: 0.15 },
    { freq: 660, start: 0.13, dur: 0.22 },
    { freq: 880, start: 0.28, dur: 0.15 },
  ];

  tones.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.25, now + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  });
}

export function prewarmAudio(): void {
  installUnlockListeners();
}

// ─────────────────────────────────────────────────────────────────
// Repeating alarm — keeps ringing until stopped
// ─────────────────────────────────────────────────────────────────

const ALARM_INTERVAL_MS = 3000; // ring every 3 seconds
let alarmTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Starts a repeating alarm. Idempotent — calling while already
 * running has no effect. The alarm keeps ringing until stopAlarm()
 * is called.
 */
export function startAlarm(): void {
  if (typeof window === 'undefined') return;
  if (alarmTimer) return; // already ringing

  // Play immediately
  playNewRequestSound();

  // Then repeat
  alarmTimer = setInterval(() => {
    playNewRequestSound();
  }, ALARM_INTERVAL_MS);
}

/**
 * Stops the repeating alarm.
 */
export function stopAlarm(): void {
  if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
}

/**
 * Returns true if the alarm is currently ringing.
 */
export function isAlarmRinging(): boolean {
  return alarmTimer !== null;
}