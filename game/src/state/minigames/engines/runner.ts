// Update 0.13 — runner: you run right; SPACE jumps the obstacles. 20 seconds; speed ramps up.

export const RUN_SECONDS = 20;
export const GRAVITY = 1900;
export const JUMP_V = 720;
export const GROUND = 0;
export const PLAYER_X = 90;
export const PLAYER_W = 22;

export interface Obstacle { x: number; w: number; h: number }

/** World speed (px/s) at time t. */
export const speedAt = (t: number) => 260 + t * 9;

/** Obstacles along the run: distances from the start, spaced so every one can be jumped. */
export function course(seed: number): Obstacle[] {
  let s = seed >>> 0;
  const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const out: Obstacle[] = [];
  let x = 600;
  const total = speedAt(RUN_SECONDS) * RUN_SECONDS;
  while (x < total) {
    const w = 18 + r() * 22;
    const h = 22 + r() * 26;
    out.push({ x, w, h });
    x += 340 + r() * 380;
  }
  return out;
}

/** Does the player (feet at height y above the ground) touch an obstacle that is now at screen x? */
export const hits = (o: Obstacle, screenX: number, y: number) => screenX < PLAYER_X + PLAYER_W && screenX + o.w > PLAYER_X && y < o.h;

export const runnerScore = (cleared: number, crashed: number) => (cleared + crashed ? Math.max(0, cleared - crashed * 0.5) / (cleared + crashed) : 0.5);
