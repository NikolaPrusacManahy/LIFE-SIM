import { useEffect, useRef, useState } from 'react';
import { GymGauge } from '../../fx/minigame/gymGauge';
import { GYM_SECONDS, GYM_SWAP, gymGains, gymScore, keyFor, pressedKey } from '../../state/minigames/gym';
import type { MiniResult } from '../../state/minigames/types';

/** Update 0.12 — 20 seconds: spam the key shown; it changes every 2 seconds. */
export function GymGame({ title, onDone }: { title: string; onDone: (r: MiniResult) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const gauge = useRef<GymGauge | null>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const [phase, setPhase] = useState<'ready' | 'go' | 'over'>('ready');
  const [presses, setPresses] = useState(0);
  const [left, setLeft] = useState(GYM_SECONDS);
  const seed = useRef(Math.floor(Math.random() * 1000));
  const start = useRef(0);
  const count = useRef(0);
  const misses = useRef(0);

  // the Pixi gauge lives as long as the minigame
  useEffect(() => {
    const g = new GymGauge();
    gauge.current = g;
    g.init(host.current!).then(() => g.set(0, keyFor(0, seed.current)));
    return () => {
      g.destroy();
      gauge.current = null;
    };
  }, []);

  // the clock only starts when you press Start (kept in refs so re-renders never restart it)
  useEffect(() => {
    if (phase !== 'go') return;
    start.current = performance.now();
    const t = window.setInterval(() => {
      const el = (performance.now() - start.current) / 1000;
      setLeft(Math.max(0, Math.ceil(GYM_SECONDS - el)));
      gauge.current?.set(count.current, keyFor(Math.floor(el / GYM_SWAP), seed.current));
      if (el >= GYM_SECONDS) {
        window.clearInterval(t);
        setPhase('over');
      }
    }, 50);
    const onKey = (e: KeyboardEvent) => {
      const k = pressedKey(e);
      if (!k || e.repeat) return;
      e.preventDefault();
      const el = (performance.now() - start.current) / 1000;
      if (el >= GYM_SECONDS) return;
      if (k === keyFor(Math.floor(el / GYM_SWAP), seed.current)) {
        count.current++;
        setPresses(count.current);
        gauge.current?.hit();
      } else {
        misses.current++;
        gauge.current?.miss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [phase]);

  const gains = gymGains(presses);
  return (
    <div className="mng-gym">
      <h3>{title}</h3>
      <div className="mng-gym-stage" ref={host} />
      {phase === 'ready' && (
        <div className="mng-gym-info">
          <p>Spam the key in the ring. It changes every {GYM_SWAP} seconds — <b>W A S D</b> or <b>SPACE</b>.</p>
          <p className="app-note">{GYM_SECONDS} seconds. No combo cap: more reps, more gains (up to +12 fitness, +6 looks).</p>
          <button className="btn btn-primary" onClick={() => setPhase('go')}>Start</button>
        </div>
      )}
      {phase === 'go' && <div className="mng-gym-bar"><b>⏱ {left}s</b><span>💪 +{gains.fitness} · ✨ +{gains.looks}</span></div>}
      {phase === 'over' && (
        <div className="mng-gym-info">
          <p><b>{presses} reps</b>{misses.current ? ` · ${misses.current} wrong keys` : ''}</p>
          <p>💪 Fitness +{gains.fitness} · ✨ Looks +{gains.looks}</p>
          <button className="btn btn-primary" onClick={() => done.current({ kind: 'gym', score: gymScore(presses), presses, note: presses >= 120 ? 'Beast mode.' : presses >= 60 ? 'Solid set.' : 'You’ll get there.' })}>Finish</button>
        </div>
      )}
    </div>
  );
}
