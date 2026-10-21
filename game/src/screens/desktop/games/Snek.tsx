import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';
import { SNEK_SIZE, newSnek, step, turn, type Pt } from '../../../state/games/snek';

// Update 0.8 — Snek: arrow keys / WASD. Score = food eaten.

const CELL = 22;
const KEYS: Record<string, Pt> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] };

export function Snek({ onEnd }: GameProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const endRef = useRef(onEnd);
  useEffect(() => {
    endRef.current = onEnd;
  }, [onEnd]);
  useEffect(() => {
    if (!started) return;
    const ctx = cv.current!.getContext('2d')!;
    let s = newSnek();
    const key = (e: KeyboardEvent) => {
      const d = KEYS[e.code];
      if (d) { e.preventDefault(); s = turn(s, d); }
    };
    window.addEventListener('keydown', key);
    const draw = () => {
      ctx.fillStyle = '#1d2b22';
      ctx.fillRect(0, 0, SNEK_SIZE * CELL, SNEK_SIZE * CELL);
      ctx.fillStyle = '#ff5d6c';
      ctx.beginPath();
      ctx.arc(s.food[0] * CELL + CELL / 2, s.food[1] * CELL + CELL / 2, CELL / 2.6, 0, Math.PI * 2);
      ctx.fill();
      s.body.forEach(([x, y], i) => {
        ctx.fillStyle = i === 0 ? '#a7ffc4' : '#3fbf74';
        ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
      });
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`🍎 ${s.eaten}`, 8, 20);
    };
    const id = setInterval(() => {
      s = step(s);
      draw();
      if (!s.alive) {
        clearInterval(id);
        endRef.current(s.eaten);
      }
    }, Math.max(70, 130 - s.eaten * 2));
    draw();
    return () => {
      clearInterval(id);
      window.removeEventListener('keydown', key);
    };
  }, [started]);
  return (
    <div className="gm-canvas" onPointerDown={() => setStarted(true)}>
      <canvas ref={cv} width={SNEK_SIZE * CELL} height={SNEK_SIZE * CELL} />
      {!started && <div className="gm-start">Click to start · arrows / WASD</div>}
    </div>
  );
}
