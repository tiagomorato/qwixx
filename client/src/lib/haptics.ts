/**
 * Fire a brief haptic pulse to confirm a state-changing interaction (mark,
 * lock, penalty). A silent no-op where the Vibration API is unavailable
 * (desktop, iOS Safari) or disabled — never throws, never blocks.
 */
export function pulse(durationMs = 15): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
  } catch {
    /* vibration unsupported or blocked — ignore */
  }
}
