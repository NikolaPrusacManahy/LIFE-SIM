import { useMemo, useRef, useState } from 'react';
import { AIM_WINDOW, BREATHS, PLANTS, SAFE, SHOTS, aimScore, breathAt, breathQuality, calmScore, constellation, drawScore, fishOf, plantScore, reelStep, shotQuality, targetPower, tensionStep, waterTarget } from '../../../state/minigames/engines/skill';
import { useKeys, useLoop, verdict, type EngineProps } from './common';

// Update 0.13 — the small skill games: aim (hoops, bowling), fishing, gardening, drawing, calm.

export function Aim({ theme, seed, onDone }: EngineProps) {
  const [shot, setShot] = useState(0);
  const [q, setQ] = useState<number[]>([]);
  const [power, setPower] = useState(0);
  const [holding, setHolding] = useState(false);
  const p = useRef(0);
  const done = shot >= SHOTS;
  const target = targetPower(Math.min(shot, SHOTS - 1), seed);
  useLoop(holding, (dt) => {
    p.current = Math.min(1, p.current + dt * 0.75);
    setPower(p.current);
  });
  const release = () => {
    if (!holding) return;
    setHolding(false);
    setQ((x) => [...x, shotQuality(p.current, target)]);
    setShot((s) => s + 1);
    p.current = 0;
  };
  const icon = theme.skin === 'bowling' ? '🎳' : '🏀';
  const s = aimScore(q);
  return (
    <div className="eng-wrap aim-wrap">
      <div className="eng-icon">{icon}</div>
      <div className="aim-bar"><div className="aim-zone" style={{ left: `${(target - AIM_WINDOW) * 100}%`, width: `${AIM_WINDOW * 200}%` }} /><i style={{ width: `${power * 100}%` }} /></div>
      <div className="tim-dots">{Array.from({ length: SHOTS }, (_, i) => <i key={i} className={i < q.length ? (q[i] === 1 ? 'great' : q[i] ? 'ok' : 'miss') : ''} />)}</div>
      {done ? (
        <div className="eng-result"><b>{verdict(s)}</b><button className="btn btn-primary" onClick={() => onDone(s, `${q.filter((x) => x === 1).length}/${SHOTS} ${theme.skin === 'bowling' ? 'strikes' : 'swishes'}.`)}>Finish</button></div>
      ) : (
        <button className="btn btn-primary btn-lg" onPointerDown={() => setHolding(true)} onPointerUp={release} onPointerLeave={release}>{holding ? 'Release!' : `Hold to ${theme.skin === 'bowling' ? 'bowl' : 'shoot'} (${shot + 1}/${SHOTS})`}</button>
      )}
    </div>
  );
}

export function Fish({ seed, onDone }: EngineProps) {
  const [phase, setPhase] = useState<'cast' | 'wait' | 'bite' | 'reel' | 'over'>('cast');
  const [tension, setTension] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const st = useRef({ wait: 0, biteLeft: 0, tension: 0.5, progress: 0, reeling: false, result: 0 });
  useKeys(phase === 'reel', (e) => { if (e.code === 'Space') { e.preventDefault(); st.current.reeling = true; } }, (e) => { if (e.code === 'Space') st.current.reeling = false; });
  useLoop(phase === 'wait' || phase === 'bite' || phase === 'reel', (dt) => {
    const s = st.current;
    if (phase === 'wait') {
      s.wait -= dt;
      if (s.wait <= 0) {
        s.biteLeft = 0.9;
        setPhase('bite');
      }
    } else if (phase === 'bite') {
      s.biteLeft -= dt;
      if (s.biteLeft <= 0) end(0.1);
    } else {
      const tug = Math.random() < dt * 1.5 ? 0.12 : 0;
      s.tension = tensionStep(s.tension, s.reeling, tug, dt);
      s.progress = reelStep(s.progress, s.tension, s.reeling, dt);
      setTension(s.tension);
      setProgress(s.progress);
      if (s.tension >= 1) end(Math.min(0.3, s.progress * 0.4));
      else if (s.progress >= 1) end(Math.min(1, 0.6 + (1 - Math.abs(s.tension - 0.55)) * 0.4));
    }
  });
  function end(score: number) {
    st.current.result = score;
    setPhase('over');
  }
  const cast = () => {
    st.current.wait = 1.2 + ((seed % 30) / 10);
    setPhase('wait');
  };
  const f = fishOf(st.current.result);
  return (
    <div className="eng-wrap fish-wrap">
      <div className="fish-lake">{phase === 'bite' ? '❗🎣' : phase === 'wait' ? '🎣 …' : phase === 'reel' ? '🎣🐟' : '🎣'}</div>
      {phase === 'cast' && <button className="btn btn-primary" onClick={cast}>Cast</button>}
      {phase === 'wait' && <p className="app-note">Wait for the bite…</p>}
      {phase === 'bite' && <button className="btn btn-primary btn-lg" onClick={() => setPhase('reel')}>Strike!</button>}
      {phase === 'reel' && (
        <>
          <div className="aim-bar"><div className="aim-zone" style={{ left: `${SAFE[0] * 100}%`, width: `${(SAFE[1] - SAFE[0]) * 100}%` }} /><i className="fish-t" style={{ width: `${tension * 100}%` }} /></div>
          <div className="aim-bar prog"><i style={{ width: `${progress * 100}%` }} /></div>
          <button className="btn btn-primary" onPointerDown={() => (st.current.reeling = true)} onPointerUp={() => (st.current.reeling = false)} onPointerLeave={() => (st.current.reeling = false)}>Hold to reel (or SPACE)</button>
        </>
      )}
      {phase === 'over' && (
        <div className="eng-result">
          <b>{st.current.result >= 0.6 ? `${f.icon} ${f.name}!` : st.current.result > 0.15 ? 'The line snapped.' : 'It got away.'}</b>
          <button className="btn btn-primary" onClick={() => onDone(st.current.result, st.current.result >= 0.6 ? `Caught a ${f.name.toLowerCase()}.` : 'No catch this time.')}>Finish</button>
        </div>
      )}
    </div>
  );
}

export function Plant({ seed, onDone }: EngineProps) {
  const [levels, setLevels] = useState<number[]>(() => Array(PLANTS).fill(0.1));
  const [pouring, setPouring] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  useLoop(pouring !== null, (dt) => setLevels((l) => l.map((v, i) => (i === pouring ? Math.min(1, v + dt * 0.45) : v))));
  const s = plantScore(levels, seed);
  return (
    <div className="eng-wrap plant-wrap">
      <div className="plant-row">
        {levels.map((v, i) => (
          <div key={i} className="plant">
            <span className="plant-ico" style={{ transform: `scale(${0.7 + v * 0.6})` }}>{v > waterTarget(i, seed) + 0.15 ? '🥀' : '🌱'}</span>
            <div className="plant-tank"><i style={{ height: `${v * 100}%` }} /><b style={{ bottom: `${waterTarget(i, seed) * 100}%` }} /></div>
            <button className="btn btn-sm" disabled={done} onPointerDown={() => setPouring(i)} onPointerUp={() => setPouring(null)} onPointerLeave={() => setPouring(null)}>💧 Hold</button>
          </div>
        ))}
      </div>
      {done ? (
        <div className="eng-result"><b>{verdict(s)}</b><button className="btn btn-primary" onClick={() => onDone(s, s >= 0.7 ? 'Everything is thriving.' : 'Some plants could use better care.')}>Finish</button></div>
      ) : <button className="btn btn-primary" onClick={() => setDone(true)}>Done watering</button>}
    </div>
  );
}

const PALETTE = ['#2d3436', '#e17055', '#00b894', '#0984e3', '#fdcb6e', '#6c5ce7'];
export function Draw({ onDone }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [col, setCol] = useState(PALETTE[0]);
  const used = useRef(new Set<string>());
  const down = useRef(false);
  const paint = (e: React.PointerEvent) => {
    if (!down.current) return;
    const c = cv.current!;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height, 9, 0, Math.PI * 2);
    ctx.fill();
    used.current.add(col);
  };
  const finish = () => {
    const c = cv.current!;
    const px = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let on = 0;
    for (let i = 3; i < px.length; i += 16) if (px[i] > 0) on++;
    const s = drawScore(on / (px.length / 16), used.current.size);
    onDone(s, s >= 0.7 ? 'A sketch worth keeping.' : 'A quick sketch.');
  };
  return (
    <div className="eng-wrap draw-wrap">
      <canvas ref={cv} width={420} height={260} className="draw-canvas" onPointerDown={(e) => { down.current = true; paint(e); }} onPointerMove={paint} onPointerUp={() => (down.current = false)} onPointerLeave={() => (down.current = false)} />
      <div className="draw-pal">{PALETTE.map((p) => <button key={p} className={p === col ? 'on' : ''} style={{ background: p }} onClick={() => setCol(p)} />)}</div>
      <button className="btn btn-primary" onClick={finish}>Done</button>
    </div>
  );
}

export function Calm({ theme, seed, onDone }: EngineProps) {
  return theme.skin === 'stars' ? <Stars seed={seed} onDone={onDone} /> : <Breath onDone={onDone} />;
}

function Breath({ onDone }: { onDone: EngineProps['onDone'] }) {
  const [size, setSize] = useState(0);
  const [q, setQ] = useState<number[]>([]);
  const last = useRef(-1);
  const t = useRef(0);
  const done = q.length >= BREATHS;
  useLoop(!done, (_dt, el) => {
    t.current = el;
    setSize(breathAt(el));
  });
  const click = () => {
    const cycle = Math.floor(t.current / 4);
    if (done || cycle === last.current) return;
    last.current = cycle;
    setQ((x) => [...x, breathQuality(size)]);
  };
  const s = calmScore(q, BREATHS);
  return (
    <div className="eng-wrap calm-wrap" onClick={click}>
      <div className="calm-circle" style={{ transform: `scale(${0.35 + size * 0.65})` }} />
      <p className="app-note">{done ? '' : size > 0.5 ? 'Breathe in…' : 'Breathe out…'} {q.length}/{BREATHS}</p>
      {done && <div className="eng-result" onClick={(e) => e.stopPropagation()}><b>{verdict(s)}</b><button className="btn btn-primary" onClick={() => onDone(s, 'You feel lighter.')}>Finish</button></div>}
    </div>
  );
}

function Stars({ seed, onDone }: { seed: number; onDone: EngineProps['onDone'] }) {
  const pts = useMemo(() => constellation(seed), [seed]);
  const [next, setNext] = useState(0);
  const [miss, setMiss] = useState(0);
  const done = next >= pts.length;
  const s = Math.max(0, 1 - miss * 0.15);
  return (
    <div className="eng-wrap">
      <svg className="stars-sky" viewBox="0 0 420 260">
        {pts.slice(0, next).map((p, i) => i > 0 && <line key={i} x1={pts[i - 1].x * 420} y1={pts[i - 1].y * 260} x2={p.x * 420} y2={p.y * 260} stroke="#ffe9a8" strokeWidth={2} />)}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x * 420} cy={p.y * 260} r={i === next ? 9 : 6} fill={i < next ? '#ffe9a8' : '#ffffff'} style={{ cursor: 'pointer' }} onClick={() => (i === next ? setNext(next + 1) : setMiss(miss + 1))} />
        ))}
      </svg>
      {done ? <div className="eng-result"><b>{verdict(s)}</b><button className="btn btn-primary" onClick={() => onDone(s, 'The sky feels close tonight.')}>Finish</button></div> : <p className="app-note">Star {next + 1} of {pts.length} — the brightest one is next</p>}
    </div>
  );
}
