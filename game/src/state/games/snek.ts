// Update 0.8 — Snek: pure step rule (tested).

export type Pt = [number, number];
export interface SnekState {
  body: Pt[];
  dir: Pt;
  food: Pt;
  alive: boolean;
  eaten: number;
}
export const SNEK_SIZE = 16;

export const newSnek = (rnd = Math.random): SnekState => ({ body: [[8, 8], [7, 8], [6, 8]], dir: [1, 0], food: placeFood([[8, 8], [7, 8], [6, 8]], rnd), alive: true, eaten: 0 });

export function placeFood(body: Pt[], rnd = Math.random): Pt {
  for (;;) {
    const p: Pt = [Math.floor(rnd() * SNEK_SIZE), Math.floor(rnd() * SNEK_SIZE)];
    if (!body.some(([x, y]) => x === p[0] && y === p[1])) return p;
  }
}

/** Turning straight back into yourself is ignored. */
export function turn(s: SnekState, dir: Pt): SnekState {
  if (dir[0] === -s.dir[0] && dir[1] === -s.dir[1]) return s;
  return { ...s, dir };
}

export function step(s: SnekState, rnd = Math.random): SnekState {
  if (!s.alive) return s;
  const [hx, hy] = s.body[0];
  const head: Pt = [hx + s.dir[0], hy + s.dir[1]];
  const eats = head[0] === s.food[0] && head[1] === s.food[1];
  const body = [head, ...s.body.slice(0, eats ? undefined : -1)];
  const out = head[0] < 0 || head[1] < 0 || head[0] >= SNEK_SIZE || head[1] >= SNEK_SIZE;
  const bite = body.slice(1).some(([x, y]) => x === head[0] && y === head[1]);
  if (out || bite) return { ...s, alive: false };
  return { ...s, body, food: eats ? placeFood(body, rnd) : s.food, eaten: s.eaten + (eats ? 1 : 0) };
}
