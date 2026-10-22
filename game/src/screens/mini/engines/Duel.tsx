import { useMemo, useState } from 'react';
import { duelRounds, duelScore } from '../../../state/minigames/engines/duel';
import { verdict, type EngineProps } from './common';

const REACT = ['😬', '😐', '🙂', '😃'];

/** Update 0.13 — conversation duel (debate, networking, therapy, the yard…): pick the line that fits. */
export function Duel({ theme, seed, onDone }: EngineProps) {
  const rounds = useMemo(() => duelRounds(theme.skin), [theme.skin]);
  // shuffle each round's lines so the best one isn't always first
  const order = useMemo(() => rounds.map((r, i) => r.lines.map((_, k) => k).sort((a, b) => ((seed + i * 7 + a * 13) % 5) - ((seed + i * 7 + b * 13) % 5))), [rounds, seed]);
  const [i, setI] = useState(0);
  const [points, setPoints] = useState<number[]>([]);
  const [face, setFace] = useState(1);
  const mood = points.reduce((a, b) => a + b, 0);
  if (i >= rounds.length) {
    const s = duelScore(points, rounds);
    return (
      <div className="eng-wrap">
        <div className="eng-result">
          <b>{verdict(s)}</b> <span>{REACT[Math.max(0, Math.min(3, Math.round(s * 3)))]}</span>
          <button className="btn btn-primary" onClick={() => onDone(s, s >= 0.75 ? 'You won them over.' : s >= 0.4 ? 'It went okay.' : 'That could have gone better.')}>Finish</button>
        </div>
      </div>
    );
  }
  const r = rounds[i];
  const pick = (k: number) => {
    const v = r.lines[k][1];
    setPoints((p) => [...p, v]);
    setFace(v >= 2 ? 3 : v >= 1 ? 2 : v >= 0 ? 1 : 0);
    setI((x) => x + 1);
  };
  return (
    <div className="eng-wrap duel-wrap">
      <div className="duel-head"><span className="duel-face">{REACT[face]}</span><span className="duel-bar"><i style={{ width: `${Math.max(0, Math.min(100, 30 + mood * 12))}%` }} /></span><small>{i + 1}/{rounds.length}</small></div>
      <div className="duel-prompt">{r.prompt}</div>
      <div className="duel-lines">
        {order[i].map((k) => <button key={k} className="duel-line" onClick={() => pick(k)}>“{r.lines[k][0]}”</button>)}
      </div>
    </div>
  );
}
