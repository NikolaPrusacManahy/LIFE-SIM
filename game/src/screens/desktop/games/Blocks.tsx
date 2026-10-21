import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';
import { H, W, emptyGrid, fits, lock, moved, rotate, spawn, type Grid, type Piece } from '../../../state/games/blocks';

// Update 0.8 — Block Drop: ← → move, ↑ rotate, ↓ soft drop, Space hard drop. Score = lines cleared.

const CELL = 20;
const COLORS = ['#2a2a3a', '#7fd0f5', '#ffd36b', '#b9a6ff', '#5199e4', '#ff9d3c', '#3fbf74', '#ff5d6c'];

export function Blocks({ onEnd }: GameProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const endRef = useRef(onEnd);
  useEffect(() => {
    endRef.current = onEnd;
  }, [onEnd]);
  useEffect(() => {
    if (!started) return;
    const ctx = cv.current!.getContext('2d')!;
    let grid: Grid = emptyGrid();
    let piece: Piece = spawn(Math.floor(Math.random() * 7));
    let lines = 0;
    let over = false;
    const draw = () => {
      ctx.fillStyle = '#16161e';
      ctx.fillRect(0, 0, W * CELL, H * CELL);
      grid.forEach((row, y) => row.forEach((v, x) => { if (v) { ctx.fillStyle = COLORS[v]; ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2); } }));
      ctx.fillStyle = COLORS[piece.shape + 1];
      for (const [cx, cy] of piece.cells) ctx.fillRect((piece.x + cx) * CELL + 1, (piece.y + cy) * CELL + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`Lines ${lines}`, 6, 16);
    };
    const settle = () => {
      const r = lock(grid, piece);
      grid = r.grid;
      lines += r.lines;
      piece = spawn(Math.floor(Math.random() * 7));
      if (!fits(grid, piece)) {
        over = true;
        endRef.current(lines);
      }
    };
    const fall = () => {
      const next = moved(piece, 0, 1);
      if (fits(grid, next)) piece = next;
      else settle();
    };
    const key = (e: KeyboardEvent) => {
      if (over) return;
      let next: Piece | null = null;
      if (e.code === 'ArrowLeft') next = moved(piece, -1, 0);
      else if (e.code === 'ArrowRight') next = moved(piece, 1, 0);
      else if (e.code === 'ArrowUp') next = rotate(piece);
      else if (e.code === 'ArrowDown') fall();
      else if (e.code === 'Space') {
        while (fits(grid, moved(piece, 0, 1))) piece = moved(piece, 0, 1);
        settle();
      } else return;
      e.preventDefault();
      if (next && fits(grid, next)) piece = next;
      draw();
    };
    window.addEventListener('keydown', key);
    const id = setInterval(() => {
      if (over) return clearInterval(id);
      fall();
      draw();
    }, 480);
    draw();
    return () => {
      clearInterval(id);
      window.removeEventListener('keydown', key);
    };
  }, [started]);
  return (
    <div className="gm-canvas" onPointerDown={() => setStarted(true)}>
      <canvas ref={cv} width={W * CELL} height={H * CELL} />
      {!started && <div className="gm-start">Click to start · ← → ↑ ↓ Space</div>}
    </div>
  );
}
