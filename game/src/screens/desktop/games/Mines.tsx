import { useState } from 'react';
import type { GameProps } from '../types';
import { cleared, newMines, reveal, type MineBoard } from '../../../state/games/mines';

// Update 0.8 — Mines: 9×9, 10 mines. Right-click flags. Score 1 = cleared, 0 = boom.

const N = 9;
const COLORS = ['', '#3b62b5', '#3fbf74', '#e0363c', '#25557c', '#8a1a1a', '#3cbfc4', '#262e33', '#929598'];

export function Mines({ onEnd }: GameProps) {
  const [board, setBoard] = useState<MineBoard | null>(null);
  const [over, setOver] = useState(false);
  const click = (x: number, y: number) => {
    if (over) return;
    const b = board ?? newMines(N, N, 10, x, y);
    const next = b.map((r) => r.map((c) => ({ ...c })));
    const res = reveal(next, x, y);
    setBoard(next);
    if (res === 'boom') {
      next.forEach((r) => r.forEach((c) => c.mine && (c.open = true)));
      setOver(true);
      setTimeout(() => onEnd(0), 700);
    } else if (cleared(next)) {
      setOver(true);
      setTimeout(() => onEnd(1), 500);
    }
  };
  const flag = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (!board || over) return;
    const next = board.map((r) => r.map((c) => ({ ...c })));
    if (!next[y][x].open) next[y][x].flag = !next[y][x].flag;
    setBoard(next);
  };
  return (
    <div className="mn-grid" style={{ gridTemplateColumns: `repeat(${N}, 32px)` }}>
      {Array.from({ length: N * N }, (_, i) => {
        const x = i % N;
        const y = Math.floor(i / N);
        const c = board?.[y][x];
        return (
          <button key={i} className={`mn-cell ${c?.open ? 'open' : ''} ${c?.open && c.mine ? 'boom' : ''}`} onClick={() => click(x, y)} onContextMenu={(e) => flag(e, x, y)} style={{ color: c?.open ? COLORS[c.n] : undefined }}>
            {c?.open ? (c.mine ? '💣' : c.n || '') : c?.flag ? '🚩' : ''}
          </button>
        );
      })}
    </div>
  );
}
