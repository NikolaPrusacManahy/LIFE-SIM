// Update 0.8 — Mines: pure board logic (tested).

export interface MineCell {
  mine: boolean;
  open: boolean;
  flag: boolean;
  /** neighbouring mines */
  n: number;
}
export type MineBoard = MineCell[][];

export function newMines(w: number, h: number, mines: number, safeX: number, safeY: number, rnd = Math.random): MineBoard {
  const b: MineBoard = Array.from({ length: h }, () => Array.from({ length: w }, () => ({ mine: false, open: false, flag: false, n: 0 })));
  let placed = 0;
  while (placed < mines) {
    const x = Math.floor(rnd() * w);
    const y = Math.floor(rnd() * h);
    if (b[y][x].mine || (Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1)) continue;
    b[y][x].mine = true;
    placed++;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b[y][x].n = around(b, x, y).filter(([ax, ay]) => b[ay][ax].mine).length;
  return b;
}

export function around(b: MineBoard, x: number, y: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const nx = x + dx;
    const ny = y + dy;
    if (ny >= 0 && ny < b.length && nx >= 0 && nx < b[0].length) out.push([nx, ny]);
  }
  return out;
}

/** Open a cell (flood-fills zeros). Returns 'boom' if it was a mine. */
export function reveal(b: MineBoard, x: number, y: number): 'boom' | 'ok' {
  const c = b[y][x];
  if (c.open || c.flag) return 'ok';
  c.open = true;
  if (c.mine) return 'boom';
  if (c.n === 0) for (const [ax, ay] of around(b, x, y)) reveal(b, ax, ay);
  return 'ok';
}

export const cleared = (b: MineBoard) => b.every((row) => row.every((c) => c.mine || c.open));
