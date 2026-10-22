// Update 0.13 — rhythm lanes: notes fall in 4 lanes (A S D F); hit them as they cross the line.

export const LANES = ['a', 's', 'd', 'f'] as const;
export const RHYTHM_SECONDS = 20;
/** how long a note takes to fall to the line */
export const FALL = 1.6;
export const PERFECT_MS = 90;
export const GOOD_MS = 170;

export interface Note { t: number; lane: number }

/** A song: notes on the beat, a little syncopation, never two in one lane at once. */
export function chart(seed: number, bpm = 110): Note[] {
  let s = seed >>> 0;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const beat = 60 / bpm;
  const out: Note[] = [];
  for (let t = 1.2; t < RHYTHM_SECONDS - 0.5; t += beat * (r() < 0.25 ? 0.5 : 1)) out.push({ t, lane: Math.floor(r() * LANES.length) });
  return out;
}

export type Judge = 'perfect' | 'good' | 'miss';
export const judge = (offsetMs: number): Judge => (Math.abs(offsetMs) <= PERFECT_MS ? 'perfect' : Math.abs(offsetMs) <= GOOD_MS ? 'good' : 'miss');

/** perfect = 1, good = 0.6, miss = 0 */
export function rhythmScore(perfect: number, good: number, total: number) {
  return total ? Math.min(1, (perfect + good * 0.6) / total) : 0;
}
