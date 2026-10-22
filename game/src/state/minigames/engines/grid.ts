// Update 0.13 — the two grid games: stealth (sneak past guards' sight lines to the exit) and driving (stay in lane,
// dodge cones, stop at red lights). Pure rules; the screens draw them.

// ---------------------------------------------------------------- stealth
export const SW = 11;
export const SH = 7;
export interface Guard { path: [number, number][]; at: number }
export interface StealthLevel { walls: Set<string>; guards: Guard[]; start: [number, number]; exit: [number, number] }

const key = (x: number, y: number) => `${x},${y}`;

export function stealthLevel(skin: string): StealthLevel {
  const walls = new Set<string>();
  const add = (x: number, y: number, w: number, h: number) => {
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) walls.add(key(x + i, y + j));
  };
  add(3, 0, 1, 3);
  add(3, 4, 1, 3);
  add(7, 2, 1, 5);
  if (skin === 'prison') add(5, 3, 1, 1);
  const guards: Guard[] = [
    { path: [[5, 1], [5, 5]], at: 0 },
    { path: [[9, 0], [9, 4]], at: 0.5 },
  ];
  return { walls, guards, start: [0, 3], exit: [10, 6] };
}

/** Guard position at time t (they walk their path back and forth, 1 cell/second). */
export function guardAt(g: Guard, t: number): [number, number] {
  const [[x0, y0], [x1, y1]] = g.path;
  const len = Math.abs(x1 - x0) + Math.abs(y1 - y0);
  const k = ((t + g.at * len * 2) % (len * 2));
  const d = k <= len ? k : len * 2 - k;
  const f = Math.floor(d);
  return [x0 + Math.sign(x1 - x0) * f, y0 + Math.sign(y1 - y0) * f];
}

/** Seen: same row or column within 3 cells, with no wall between. */
export function seen(lvl: StealthLevel, px: number, py: number, gx: number, gy: number) {
  if (px !== gx && py !== gy) return false;
  const dist = Math.abs(px - gx) + Math.abs(py - gy);
  if (dist > 3) return false;
  const sx = Math.sign(px - gx), sy = Math.sign(py - gy);
  for (let i = 1; i < dist; i++) if (lvl.walls.has(key(gx + sx * i, gy + sy * i))) return false;
  return true;
}

export const canStep = (lvl: StealthLevel, x: number, y: number) => x >= 0 && y >= 0 && x < SW && y < SH && !lvl.walls.has(key(x, y));
/** escaped fast = 1, slowly ≥ 0.6; each time you're spotted costs 0.15; caught early scores low */
export const stealthScore = (escaped: boolean, seconds: number, spotted: number) => (escaped ? Math.max(0.6, 1 - seconds / 120) - spotted * 0.15 : Math.max(0, 0.3 - spotted * 0.1));

// ---------------------------------------------------------------- driving
export const DRIVE_SECONDS = 20;
export const LANES_N = 3;
export interface Thing { lane: number; y: number; kind: 'cone' | 'car' | 'light' }
/** what's on the road ahead (y = distance in px); lights are full-width */
export function road(seed: number, skin: string): Thing[] {
  let s = seed >>> 0;
  const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const out: Thing[] = [];
  for (let y = 500; y < DRIVE_SECONDS * 340; y += 220 + r() * 160) {
    const light = skin !== 'getaway' && r() < 0.18;
    out.push({ lane: Math.floor(r() * LANES_N), y, kind: light ? 'light' : skin === 'getaway' || r() < 0.4 ? 'car' : 'cone' });
  }
  return out;
}
/** −0.15 per hit, −0.25 per red light run */
export const driveScore = (hits: number, redRuns: number, finished: boolean) => Math.max(0, Math.min(1, (finished ? 1 : 0.5) - hits * 0.15 - redRuns * 0.25));
