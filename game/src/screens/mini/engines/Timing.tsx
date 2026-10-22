import { useRef, useState } from 'react';
import { TIMING_ROUNDS, hitQuality, needle, timingScore, zoneFor } from '../../../state/minigames/engines/timing';
import { useKeys, useLoop, verdict, type EngineProps } from './common';

const SKIN: Record<string, string> = { yoga: '🧘', lift: '🏋️', aim: '🎯' };

/** Update 0.13 — sweet-spot timing (yoga, competition, trainer, academy aim). */
export function Timing({ theme, seed, onDone }: EngineProps) {
  const [round, setRound] = useState(0);
  const [qs, setQs] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const t0 = useRef(0);
  const done = round >= TIMING_ROUNDS;
  const z = zoneFor(Math.min(round, TIMING_ROUNDS - 1), seed);
  useLoop(!done, (_dt, el) => {
    t0.current = el;
    setPos(needle(el, z.speed));
  });
  const press = () => {
    if (done) return;
    setQs((q) => [...q, hitQuality(pos, z)]);
    setRound((r) => r + 1);
  };
  useKeys(!done, (e) => {
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      press();
    }
  });
  const score = timingScore(qs);
  return (
    <div className="eng-wrap eng-timing" onClick={press}>
      <div className="eng-icon">{SKIN[theme.skin] ?? '🎯'}</div>
      <div className="tim-bar">
        <div className="tim-zone" style={{ left: `${(z.centre - z.width / 2) * 100}%`, width: `${z.width * 100}%` }} />
        <div className="tim-needle" style={{ left: `${pos * 100}%` }} />
      </div>
      <div className="tim-dots">{Array.from({ length: TIMING_ROUNDS }, (_, i) => <i key={i} className={i < qs.length ? (qs[i] >= 0.75 ? 'great' : qs[i] > 0 ? 'ok' : 'miss') : ''} />)}</div>
      {done ? (
        <div className="eng-result" onClick={(e) => e.stopPropagation()}>
          <b>{verdict(score)}</b>
          <button className="btn btn-primary" onClick={() => onDone(score, `${qs.filter((q) => q > 0).length}/${TIMING_ROUNDS} in the green.`)}>Finish</button>
        </div>
      ) : <p className="app-note">SPACE or click — round {round + 1}/{TIMING_ROUNDS}</p>}
    </div>
  );
}
