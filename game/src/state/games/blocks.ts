// Update 0.8 — Block Drop: a falling-block puzzle (original rules, pure, tested).

export const W = 10;
export const H = 18;
export type Grid = number[][];

/** Seven shapes as cell offsets (rotation 0). */
export const SHAPES: [number, number][][] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[1, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[2, 0], [0, 1], [1, 1], [2, 1]],
  [[1, 0], [2, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
];

export interface Piece {
  shape: number;
  cells: [number, number][];
  x: number;
  y: number;
}

export const emptyGrid = (): Grid => Array.from({ length: H }, () => Array(W).fill(0));
export const spawn = (shape: number): Piece => ({ shape, cells: SHAPES[shape].map(([x, y]) => [x, y] as [number, number]), x: 3, y: 0 });

/** Rotate clockwise around the piece's box. */
export function rotate(p: Piece): Piece {
  const max = Math.max(...p.cells.map(([x, y]) => Math.max(x, y)));
  return { ...p, cells: p.cells.map(([x, y]) => [max - y, x] as [number, number]) };
}

export function fits(g: Grid, p: Piece): boolean {
  return p.cells.every(([cx, cy]) => {
    const x = p.x + cx;
    const y = p.y + cy;
    return x >= 0 && x < W && y < H && (y < 0 || !g[y][x]);
  });
}

export const moved = (p: Piece, dx: number, dy: number): Piece => ({ ...p, x: p.x + dx, y: p.y + dy });

/** Lock the piece in and clear full lines. Returns the new grid and how many lines cleared. */
export function lock(g: Grid, p: Piece): { grid: Grid; lines: number } {
  const grid = g.map((r) => [...r]);
  for (const [cx, cy] of p.cells) if (p.y + cy >= 0) grid[p.y + cy][p.x + cx] = p.shape + 1;
  const kept = grid.filter((r) => r.some((c) => !c));
  const lines = H - kept.length;
  while (kept.length < H) kept.unshift(Array(W).fill(0));
  return { grid: kept, lines };
}
