// Update 0.13 — the small skill games: aim & arc (hoops, bowling), cast & reel (fishing), plant & tend (gardening),
// draw (sketching), and calm (breathing, constellations). Pure rules; the screens play them.

// ---------------------------------------------------------------- aim & arc
export const SHOTS = 5;
/** the power that scores, per shot (it moves a little each shot) */
export const targetPower = (shot: number, seed: number) => 0.45 + (((seed * 31 + shot * 17) % 100) / 100) * 0.4;
export const AIM_WINDOW = 0.07;
/** 1 = swish/strike, 0.5 = rim/most pins, 0 = miss */
export function shotQuality(power: number, target: number) {
  const off = Math.abs(power - target);
  return off <= AIM_WINDOW ? 1 : off <= AIM_WINDOW * 2 ? 0.5 : 0;
}
export const aimScore = (q: number[]) => q.reduce((a, b) => a + b, 0) / SHOTS;

// ---------------------------------------------------------------- cast & reel
export const FISH = [
  { name: 'Sunfish', icon: '🐟', min: 0 },
  { name: 'Bass', icon: '🐟', min: 0.45 },
  { name: 'Catfish', icon: '🐡', min: 0.7 },
  { name: 'Trophy pike', icon: '🦈', min: 0.9 },
];
/** Line tension rises while you reel and drops while you don't; the fish tugs at random. */
export function tensionStep(tension: number, reeling: boolean, tug: number, dt: number) {
  return Math.max(0, Math.min(1, tension + (reeling ? 0.55 : -0.45) * dt + tug));
}
export const SAFE: [number, number] = [0.35, 0.75];
/** Reeling inside the safe band brings the fish in; outside it slips (or snaps above 1). */
export const reelStep = (progress: number, tension: number, reeling: boolean, dt: number) =>
  Math.max(0, Math.min(1, progress + (reeling && tension >= SAFE[0] && tension <= SAFE[1] ? 0.22 : -0.05) * dt));
export const fishOf = (score: number) => [...FISH].reverse().find((f) => score >= f.min)!;

// ---------------------------------------------------------------- plant & tend
export const PLANTS = 4;
export const waterTarget = (i: number, seed: number) => 0.4 + (((seed + i * 37) % 50) / 100);
/** closeness to each plant's line */
export function plantScore(levels: number[], seed: number) {
  const q = levels.map((w, i) => Math.max(0, 1 - Math.abs(w - waterTarget(i, seed)) * 4));
  return q.reduce((a, b) => a + b, 0) / PLANTS;
}

// ---------------------------------------------------------------- draw
/** coverage 0–1 of the canvas, distinct colours used */
export const drawScore = (coverage: number, colours: number) => Math.min(1, coverage * 1.6) * 0.7 + Math.min(1, colours / 4) * 0.3;

// ---------------------------------------------------------------- calm
export const BREATHS = 5;
export const BREATH_SECONDS = 4;
/** circle size 0–1 over one breath (in, then out) */
export const breathAt = (t: number) => 0.5 - 0.5 * Math.cos((t / BREATH_SECONDS) * Math.PI * 2);
/** clicking near the top of the breath */
export const breathQuality = (size: number) => (size >= 0.9 ? 1 : size >= 0.75 ? 0.5 : 0);
export const calmScore = (q: number[], n: number) => (n ? q.reduce((a, b) => a + b, 0) / n : 0);
/** a constellation: points (0–1) to connect in order */
export function constellation(seed: number, n = 6): { x: number; y: number }[] {
  let s = seed >>> 0;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: n }, (_, i) => ({ x: 0.12 + (i / (n - 1)) * 0.76, y: 0.2 + r() * 0.6 }));
}
