import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';

// Update 0.8 — Flappy Pigeon: click (or Space) to flap through the pipes. Original art (a grey pigeon).

const W = 360;
const H = 420;

export function Flappy({ onEnd }: GameProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const flap = useRef<() => void>(() => undefined);
  const endRef = useRef(onEnd);
  useEffect(() => {
    endRef.current = onEnd;
  }, [onEnd]);
  useEffect(() => {
    if (!started) return;
    const ctx = cv.current!.getContext('2d')!;
    let y = H / 2;
    let vy = 0;
    let score = 0;
    let pipes: { x: number; gap: number; passed: boolean }[] = [{ x: W + 40, gap: 160, passed: false }];
    let done = false;
    let raf = 0;
    flap.current = () => (vy = -6.2);
    const tick = () => {
      vy += 0.34;
      y += vy;
      for (const p of pipes) p.x -= 2.4;
      if (pipes[pipes.length - 1].x < W - 170) pipes.push({ x: W + 20, gap: 90 + Math.random() * (H - 220), passed: false });
      pipes = pipes.filter((p) => p.x > -60);
      for (const p of pipes) {
        if (!p.passed && p.x + 50 < 80) { p.passed = true; score++; }
        const hitX = 80 + 14 > p.x && 80 - 14 < p.x + 50;
        if (hitX && (y - 12 < p.gap || y + 12 > p.gap + 120)) done = true;
      }
      if (y > H - 20 || y < 0) done = true;
      // draw
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#7fd0f5');
      sky.addColorStop(1, '#e2f2ff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#5bbf6a';
      for (const p of pipes) {
        ctx.fillRect(p.x, 0, 50, p.gap);
        ctx.fillRect(p.x, p.gap + 120, 50, H - p.gap - 120);
      }
      ctx.fillStyle = '#c8a46a';
      ctx.fillRect(0, H - 20, W, 20);
      // pigeon
      ctx.fillStyle = '#8a8f9e';
      ctx.beginPath();
      ctx.ellipse(80, y, 15, 12, vy / 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5f9e8f';
      ctx.fillRect(86, y - 9, 6, 4);
      ctx.fillStyle = '#ffb648';
      ctx.fillRect(93, y - 3, 7, 3);
      ctx.fillStyle = '#1f1a33';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(String(score), W / 2 - 8, 40);
      if (done) { endRef.current(score); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const key = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); flap.current(); } };
    window.addEventListener('keydown', key);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', key);
    };
  }, [started]);
  return (
    <div className="gm-canvas" onPointerDown={() => (started ? flap.current() : setStarted(true))}>
      <canvas ref={cv} width={W} height={H} />
      {!started && <div className="gm-start">Click to start · click / Space to flap</div>}
    </div>
  );
}
