// Update 0.13 — sweet-spot timing: a needle sweeps back and forth; press SPACE while it's in the green. 5 rounds,
// the green gets smaller and the needle faster each round.

export const TIMING_ROUNDS = 5;

/** needle position 0–1 (a triangle wave) */
export const needle = (t: number, speed: number) => {
  const x = (t * speed) % 2;
  return x < 1 ? x : 2 - x;
};

export interface Zone { centre: number; width: number; speed: number }

export function zoneFor(round: number, seed: number): Zone {
  const r = ((seed * 9301 + round * 49297) % 233280) / 233280;
  return { centre: 0.25 + r * 0.5, width: Math.max(0.08, 0.24 - round * 0.035), speed: 0.7 + round * 0.18 };
}

/** 1 in the middle of the zone, 0.5 at its edge, 0 outside */
export function hitQuality(pos: number, z: Zone) {
  const off = Math.abs(pos - z.centre);
  return off > z.width / 2 ? 0 : 1 - (off / (z.width / 2)) * 0.5;
}

export const timingScore = (qualities: number[]) => (qualities.length ? qualities.reduce((a, b) => a + b, 0) / TIMING_ROUNDS : 0);
