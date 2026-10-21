import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';

// Update 0.8 — Furious Fowl: drag back from the slingshot and let go. 3 hens; score = towers toppled. Original art.

const W = 520;
const H = 300;
const SLING = { x: 80, y: 220 };

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  down: boolean;
}

export function Fowl({ onEnd }: GameProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [shots, setShots] = useState(3);
  const state = useRef({ blocks: [] as Block[], hen: null as null | { x: number; y: number; vx: number; vy: number }, aim: null as null | { x: number; y: number }, toppled: 0 });
  const endRef = useRef(onEnd);
  useEffect(() => {
    endRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    const st = state.current;
    st.blocks = [0, 1, 2].map((i) => ({ x: 300 + i * 70, y: 300 - 60 - (i % 2) * 30, w: 22, h: 60 + (i % 2) * 30, down: false }));
    const ctx = cv.current!.getContext('2d')!;
    let raf = 0;
    const tick = () => {
      ctx.fillStyle = '#bfe3ff';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#7ac46a';
      ctx.fillRect(0, H - 20, W, 20);
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(SLING.x - 4, SLING.y, 8, 60);
      for (const b of st.blocks) {
        ctx.fillStyle = b.down ? '#c9b48a' : '#a0702e';
        if (b.down) ctx.fillRect(b.x - b.h / 2, H - 20 - b.w, b.h, b.w);
        else ctx.fillRect(b.x, b.y, b.w, b.h);
      }
      const h = st.hen;
      if (h) {
        h.vy += 0.25;
        h.x += h.vx;
        h.y += h.vy;
        for (const b of st.blocks) {
          if (!b.down && h.x > b.x - 10 && h.x < b.x + b.w + 10 && h.y > b.y - 10 && h.y < b.y + b.h) {
            b.down = true;
            st.toppled++;
          }
        }
        if (h.y > H - 30 || h.x > W + 20) st.hen = null;
      }
      const drawHen = (x: number, y: number) => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e0363c';
        ctx.fillRect(x - 2, y - 14, 5, 5);
        ctx.fillStyle = '#ffb648';
        ctx.fillRect(x + 8, y - 2, 6, 3);
      };
      if (st.hen) drawHen(st.hen.x, st.hen.y);
      else if (st.aim) {
        ctx.strokeStyle = '#5a3a1a';
        ctx.beginPath();
        ctx.moveTo(SLING.x, SLING.y);
        ctx.lineTo(st.aim.x, st.aim.y);
        ctx.stroke();
        drawHen(st.aim.x, st.aim.y);
      } else drawHen(SLING.x, SLING.y);
      ctx.fillStyle = '#1f1a33';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`Toppled ${st.toppled}/3`, 10, 20);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // when the last hen lands (or every tower is down), the run ends
  useEffect(() => {
    if (shots > 0 && state.current.toppled < 3) return;
    const t = setInterval(() => {
      if (!state.current.hen) {
        clearInterval(t);
        endRef.current(state.current.toppled);
      }
    }, 200);
    return () => clearInterval(t);
  }, [shots]);

  const pos = (e: React.PointerEvent) => {
    const r = cv.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  return (
    <div className="gm-canvas">
      <canvas
        ref={cv}
        width={W}
        height={H}
        onPointerDown={(e) => { if (!state.current.hen && shots > 0) state.current.aim = pos(e); }}
        onPointerMove={(e) => { if (state.current.aim) { const p = pos(e); const dx = Math.max(-90, Math.min(0, p.x - SLING.x)); const dy = Math.max(-20, Math.min(70, p.y - SLING.y)); state.current.aim = { x: SLING.x + dx, y: SLING.y + dy }; } }}
        onPointerUp={() => {
          const a = state.current.aim;
          if (!a) return;
          state.current.aim = null;
          state.current.hen = { x: a.x, y: a.y, vx: (SLING.x - a.x) * 0.16, vy: (SLING.y - a.y) * 0.16 - 3 };
          setShots((n) => n - 1);
        }}
      />
      <small className="gm-note">Drag back from the slingshot and let go · 🐔 × {shots}</small>
    </div>
  );
}
