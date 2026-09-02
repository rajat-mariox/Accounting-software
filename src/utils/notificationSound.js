// Short two-tone "ping" for new notifications, synthesised with the Web Audio API so
// no audio asset is needed. Browsers only allow sound after a user gesture, so the
// AudioContext is created lazily and resumed on the first click/keypress.

const SOUND_KEY = 'notification_sound';

let audioContext = null;
let unlocked = false;

export function isSoundEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
  } catch {
    // ignore storage failures
  }
}

function getContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

// Call once on app start: resumes the context the first time the user interacts,
// which is what lets later (non-gesture) polls play sound.
export function unlockNotificationSound() {
  if (unlocked || typeof window === 'undefined') return;
  const resume = () => {
    const ctx = getContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    unlocked = true;
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

function tone(ctx, frequency, start, duration, peak = 0.18) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playNotificationChime() {
  if (!isSoundEnabled()) return false;
  const ctx = getContext();
  if (!ctx || ctx.state !== 'running') return false;
  const now = ctx.currentTime;
  // Rising two-note ping, similar in feel to a chat app alert.
  tone(ctx, 880, now, 0.16);
  tone(ctx, 1320, now + 0.12, 0.22);
  return true;
}
