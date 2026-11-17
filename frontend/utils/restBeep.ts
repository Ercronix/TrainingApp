/**
 * The end-of-rest sound on web, where there are no local notifications: three short beeps,
 * scheduled on the Web Audio clock when the rest starts. The audio thread keeps time even while
 * the tab is in the background and its timers are throttled.
 *
 * Browsers only let audio start after a user gesture, so `scheduleRestBeep` must be called from
 * one (pressing start, or logging a set). Without one the context stays suspended and the rest
 * simply ends without a sound.
 */

// Beeps of 0.12 s, 0.22 s apart, at a pitch that cuts through gym noise without being shrill
const BEEP_HZ = 1046.5;
const BEEP_S = 0.12;
const BEEP_GAP_S = 0.22;
const BEEPS = 3;
const VOLUME = 0.25;

let context: AudioContext | null = null;
let scheduled: OscillatorNode | null = null;
// Bumped by every schedule/cancel, so a schedule waiting for the context to resume can tell it was superseded
let generation = 0;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor = typeof window !== 'undefined'
    ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    : undefined;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/** Schedules the beeps for `endTime` (epoch ms), replacing any pending ones. */
export function scheduleRestBeep(endTime: number): void {
  cancelRestBeep();
  const ctx = audioContext();
  if (!ctx) return;
  const current = generation;
  // Resuming within the user's gesture unlocks the audio; until it has, the context's clock stands still
  ctx.resume().then(() => {
    if (current !== generation) return;
    const startAt = ctx.currentTime + (endTime - Date.now()) / 1000;
    if (startAt < ctx.currentTime) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = BEEP_HZ;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    for (let i = 0; i < BEEPS; i++) {
      const t = startAt + i * BEEP_GAP_S;
      // Short ramps instead of hard edges, which click
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(VOLUME, t + 0.01);
      gain.gain.setValueAtTime(VOLUME, t + BEEP_S - 0.02);
      gain.gain.linearRampToValueAtTime(0, t + BEEP_S);
    }
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + (BEEPS - 1) * BEEP_GAP_S + BEEP_S);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      if (scheduled === osc) scheduled = null;
    };
    scheduled = osc;
  }).catch(() => {});
}

/** Cancels the pending beeps, if any (pause, reset, or a new rest). */
export function cancelRestBeep(): void {
  generation++;
  if (!scheduled) return;
  const osc = scheduled;
  scheduled = null;
  try {
    osc.stop();
  } catch {
    // Not started yet in some browsers; disconnecting silences it either way
  }
  osc.disconnect();
}
