import { useMemo, useRef, useState } from 'react';
import { GRAVITY, JUMP_V, PLAYER_X, RUN_SECONDS, course, hits, runnerScore, speedAt } from '../../../state/minigames/engines/runner';
import { useKeys, useLoop, verdict, type EngineProps } from './common';

const W = 560;
const H = 220;
const FLOOR = H - 40;
const SKY: Record<string, [string, string, string]> = {
  park: ['#9fd3ff', '#5fae4f', '🏃'], trail: ['#c9e4ff', '#7a8a4a', '🥾'], bmx: ['#ffd6a8', '#8a8f99', '🛹'], escape: ['#1b1d3a', '#3a3a48', '🏃'],
};

/** Update 0.13 — runner (jog, hike, BMX, running from the police). */
export function Runner({ theme, seed, onDone }: EngineProps) {
  const obs = useMemo(() => course(seed), [seed]);
  const [go, setGo] = useState(false);
  const [over, setOver] = useState<number | null>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ dist: 0, y: 0, vy: 0, cleared: 0, crashed: 0, hit: -1 });
  const [a, b, icon] = SKY[theme.skin] ?? SKY.park;
  useKeys(go && over === null, (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && st.current.y <= 0.5) {
      e.preventDefault();
      st.current.vy = JUMP_V;
    }
  });
  useLoop(go && over === null, (dt, el) => {
    const s = st.current;
    s.dist += speedAt(el) * dt;
    s.vy -= GRAVITY * dt;
    s.y = Math.max(0, s.y + s.vy * dt);
    if (s.y === 0) s.vy = 0;
    obs.forEach((o, i) => {
      const x = o.x - s.dist + PLAYER_X;
      if (i > s.hit && hits(o, x, s.y)) {
        s.crashed++;
        s.hit = i;
      } else if (i > s.hit && x + o.w < PLAYER_X && i >= s.cleared + s.crashed) s.cleared++;
    });
    const ctx = cv.current?.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, a);
      g.addColorStop(1, '#ffffff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = b;
      ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.fillStyle = '#3b3f4c';
      obs.forEach((o) => {
        const x = o.x - s.dist + PLAYER_X;
        if (x > -60 && x < W) ctx.fillRect(x, FLOOR - o.h, o.w, o.h);
      });
      ctx.font = '30px sans-serif';
      ctx.fillText(icon, PLAYER_X - 4, FLOOR - s.y);
      ctx.fillStyle = '#fff';
      ctx.font = '700 14px sans-serif';
      ctx.fillText(`⏱ ${Math.max(0, Math.ceil(RUN_SECONDS - el))}s   ✔ ${s.cleared}   ✖ ${s.crashed}`, 12, 22);
    }
    if (el >= RUN_SECONDS) setOver(runnerScore(s.cleared, s.crashed));
  });
  return (
    <div className="eng-wrap">
      <canvas ref={cv} width={W} height={H} className="eng-canvas" />
      {!go && <button className="btn btn-primary" onClick={() => setGo(true)}>Start</button>}
      {over !== null && (
        <div className="eng-result">
          <b>{verdict(over)}</b> <span>{st.current.cleared} cleared · {st.current.crashed} stumbles</span>
          <button className="btn btn-primary" onClick={() => onDone(over, `${st.current.cleared} jumps cleared.`)}>Finish</button>
        </div>
      )}
    </div>
  );
}
