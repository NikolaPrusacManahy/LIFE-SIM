// Update 0.12 — the gym minigame: 20 seconds, the key to spam changes every 2 seconds. No combo cap:
// more correct presses, more gains — up to +12 fitness and +6 looks.

export const GYM_KEYS = ['W', 'A', 'S', 'D', 'SPACE'] as const;
export type GymKey = (typeof GYM_KEYS)[number];
export const GYM_SECONDS = 20;
export const GYM_SWAP = 2;
export const GYM_MAX = { fitness: 12, looks: 6 };
/** Correct presses for the full gains (~7 a second, the whole time). */
export const GYM_FULL = 140;

/** The key for the n-th 2-second window (never the same twice in a row). */
export function keyFor(window: number, seed: number): GymKey {
  let i = Math.abs(Math.floor(Math.sin(seed * 9301 + window * 49297) * 233280)) % GYM_KEYS.length;
  if (window > 0 && GYM_KEYS[i] === keyFor(window - 1, seed)) i = (i + 1) % GYM_KEYS.length;
  return GYM_KEYS[i];
}

/** Which keyboard key a press was (KeyboardEvent.key / code → our key). */
export function pressedKey(e: { key: string; code?: string }): GymKey | null {
  if (e.code === 'Space' || e.key === ' ') return 'SPACE';
  const k = e.key.toUpperCase();
  return (GYM_KEYS as readonly string[]).includes(k) ? (k as GymKey) : null;
}

export const gymScore = (presses: number) => Math.max(0, Math.min(1, presses / GYM_FULL));

/** Gains from a set: the more presses, the more gains. */
export function gymGains(presses: number): { fitness: number; looks: number } {
  const s = gymScore(presses);
  return { fitness: Math.round(GYM_MAX.fitness * s * 10) / 10, looks: Math.round(GYM_MAX.looks * s * 10) / 10 };
}
