import { useState } from 'react';
import type { GameProps } from '../types';
import { dealGolf, drawStock, golfLeft, golfStuck, playCol, type GolfState } from '../../../state/games/cards';

// Update 0.8 — Golf Solitaire: play a column's top card one rank above/below the pile. Score 1 = cleared.

const RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function Golf({ onEnd }: GameProps) {
  const [s, setS] = useState<GolfState>(() => dealGolf());
  const [ended, setEnded] = useState(false);
  const after = (next: GolfState) => {
    setS({ ...next, cols: next.cols.map((c) => [...c]) });
    if (ended) return;
    if (golfLeft(next) === 0 || golfStuck(next)) {
      setEnded(true);
      setTimeout(() => onEnd(golfLeft(next) === 0 ? 1 : 0), 700);
    }
  };
  const play = (i: number) => {
    const next = { ...s, cols: s.cols.map((c) => [...c]), stock: [...s.stock] };
    if (playCol(next, i)) after(next);
  };
  const draw = () => {
    const next = { ...s, cols: s.cols.map((c) => [...c]), stock: [...s.stock] };
    if (drawStock(next)) after(next);
  };
  return (
    <div className="gf-wrap">
      <div className="gf-cols">
        {s.cols.map((c, i) => (
          <div key={i} className="gf-col">
            {c.map((v, j) => (
              <button key={j} className={`gf-card ${j === c.length - 1 ? 'top' : ''}`} disabled={j !== c.length - 1} onClick={() => play(i)}>{RANK[v]}</button>
            ))}
          </div>
        ))}
      </div>
      <div className="gf-bottom">
        <button className="gf-card stock" onClick={draw} disabled={!s.stock.length}>🂠 {s.stock.length}</button>
        <span className="gf-card pile">{RANK[s.pile]}</span>
        <small>{golfLeft(s)} cards left</small>
      </div>
    </div>
  );
}
