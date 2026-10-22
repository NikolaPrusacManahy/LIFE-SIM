import { useMemo, useRef, useState } from 'react';
import { DRIVE_SECONDS, LANES_N, SH, SW, canStep, driveScore, guardAt, road, seen, stealthLevel, stealthScore } from '../../../state/minigames/engines/grid';
import { useKeys, useLoop, verdict, type EngineProps } from './common';

// Update 0.13 — stealth (sneak out, hide, escape plans) and driving (lessons, the road test, getaways).

const SKIN: Record<string, string> = { house: '🚪', alley: '🔦', prison: '🚨' };

export function Stealth({ theme, onDone }: EngineProps) {
  const lvl = useMemo(() => stealthLevel(theme.skin), [theme.skin]);
  const [me, setMe] = useState<[number, number]>(lvl.start);
  const [t, setT] = useState(0);
  const [spotted, setSpotted] = useState(0);
  const [over, setOver] = useState<number | null>(null);
  const grace = useRef(0);
  const caught = useRef(0);
  useLoop(over === null, (dt, el) => {
    setT(el);
    grace.current = Math.max(0, grace.current - dt);
    if (grace.current > 0) return;
    if (lvl.guards.some((g) => { const [gx, gy] = guardAt(g, el); return seen(lvl, me[0], me[1], gx, gy); })) {
      grace.current = 1.2;
      caught.current++;
      setSpotted(caught.current);
      if (caught.current >= 3) setOver(stealthScore(false, el, caught.current));
      setMe(lvl.start);
    }
  });
  useKeys(over === null, (e) => {
    const d: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const v = d[e.key];
    if (!v) return;
    e.preventDefault();
    const n: [number, number] = [me[0] + v[0], me[1] + v[1]];
    if (!canStep(lvl, n[0], n[1])) return;
    setMe(n);
    if (n[0] === lvl.exit[0] && n[1] === lvl.exit[1]) setOver(stealthScore(true, t, spotted));
  });
  const guards = lvl.guards.map((g) => guardAt(g, t));
  return (
    <div className="eng-wrap">
      <div className="stl-grid" style={{ gridTemplateColumns: `repeat(${SW}, 34px)` }}>
        {Array.from({ length: SW * SH }, (_, i) => {
          const x = i % SW, y = Math.floor(i / SW);
          const wall = lvl.walls.has(`${x},${y}`);
          const guard = guards.some(([gx, gy]) => gx === x && gy === y);
          const watched = !wall && guards.some(([gx, gy]) => seen(lvl, x, y, gx, gy) && !(gx === x && gy === y));
          const exit = x === lvl.exit[0] && y === lvl.exit[1];
          return <span key={i} className={`stl-cell ${wall ? 'wall' : ''} ${watched ? 'seen' : ''}`}>{me[0] === x && me[1] === y ? '🧍' : guard ? '👮' : exit ? (SKIN[theme.skin] ?? '🚪') : ''}</span>;
        })}
      </div>
      {over === null ? <p className="app-note">Spotted {spotted}/3 — the yellow cells are watched</p> : (
        <div className="eng-result"><b>{over >= 0.6 ? 'You made it out.' : 'Caught!'}</b><button className="btn btn-primary" onClick={() => onDone(over, over >= 0.6 ? 'Nobody saw a thing.' : 'You got spotted.')}>Finish</button></div>
      )}
    </div>
  );
}

const DW = 300;
const DH = 340;
export function Drive({ theme, seed, onDone }: EngineProps) {
  const things = useMemo(() => road(seed, theme.skin), [seed, theme.skin]);
  const [go, setGo] = useState(false);
  const [over, setOver] = useState<number | null>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ lane: 1, dist: 0, braking: false, hits: 0, reds: 0, done: new Set<number>() });
  useKeys(go && over === null, (e) => {
    const s = st.current;
    if (e.key === 'ArrowLeft') s.lane = Math.max(0, s.lane - 1);
    if (e.key === 'ArrowRight') s.lane = Math.min(LANES_N - 1, s.lane + 1);
    if (e.code === 'Space') { e.preventDefault(); s.braking = true; }
  }, (e) => { if (e.code === 'Space') st.current.braking = false; });
  useLoop(go && over === null, (dt, el) => {
    const s = st.current;
    const speed = s.braking ? 60 : 340;
    s.dist += speed * dt;
    const lw = DW / LANES_N;
    const carY = DH - 70;
    things.forEach((th, i) => {
      const y = carY - (th.y - s.dist);
      if (s.done.has(i) || y < carY - 10 || y > carY + 30) return;
      s.done.add(i);
      if (th.kind === 'light') {
        // red until you've stopped for it (braking as you reach it counts)
        if (!s.braking) s.reds++;
      } else if (th.lane === s.lane) s.hits++;
    });
    const ctx = cv.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#4a4f5a';
      ctx.fillRect(0, 0, DW, DH);
      ctx.fillStyle = '#ffffff99';
      for (let l = 1; l < LANES_N; l++) for (let y = -40 + (s.dist % 40); y < DH; y += 40) ctx.fillRect(l * lw - 2, y, 4, 20);
      ctx.font = '26px sans-serif';
      things.forEach((th) => {
        const y = carY - (th.y - s.dist);
        if (y < -30 || y > DH) return;
        if (th.kind === 'light') {
          ctx.fillStyle = '#d63031';
          ctx.fillRect(0, y, DW, 6);
          ctx.fillText('🚦', DW - 32, y - 4);
        } else ctx.fillText(th.kind === 'cone' ? '🚧' : '🚙', th.lane * lw + lw / 2 - 14, y);
      });
      ctx.fillText(theme.skin === 'getaway' ? '🚓' : '🚗', s.lane * lw + lw / 2 - 14, carY + 24);
      ctx.fillStyle = '#fff';
      ctx.font = '700 13px sans-serif';
      ctx.fillText(`⏱ ${Math.max(0, Math.ceil(DRIVE_SECONDS - el))}s  hits ${s.hits}  reds ${s.reds}`, 8, 18);
    }
    if (el >= DRIVE_SECONDS) setOver(driveScore(s.hits, s.reds, true));
  });
  return (
    <div className="eng-wrap">
      <canvas ref={cv} width={DW} height={DH} className="eng-canvas" />
      {!go && <button className="btn btn-primary" onClick={() => setGo(true)}>Start</button>}
      {over !== null && (
        <div className="eng-result"><b>{verdict(over)}</b> <span>{st.current.hits} hits · {st.current.reds} red lights</span><button className="btn btn-primary" onClick={() => onDone(over, st.current.hits + st.current.reds === 0 ? 'A clean drive.' : `${st.current.hits} bumps, ${st.current.reds} red lights.`)}>Finish</button></div>
      )}
    </div>
  );
}
