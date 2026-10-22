import { useMemo, useRef, useState } from 'react';
import { SORT_SECONDS, sortScore, sortSet } from '../../../state/minigames/engines/sort';
import { useKeys, useLoop, verdict, type EngineProps } from './common';

/** Update 0.13 — sort & tidy (chores, kitchen duty, the docks, the farm, your work queue). */
export function Sort({ theme, seed, onDone }: EngineProps) {
  const set = useMemo(() => sortSet(theme.skin), [theme.skin]);
  const [n, setN] = useState(0);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [left, setLeft] = useState(SORT_SECONDS);
  const [go, setGo] = useState(false);
  const clock = useRef(SORT_SECONDS);
  const done = go && left <= 0;
  const item = set.items[(seed + n * 5) % set.items.length];
  useLoop(go && !done, (dt) => {
    clock.current = Math.max(0, clock.current - dt);
    setLeft(clock.current);
  });
  const drop = (bin: string) => {
    if (!go || done) return;
    if (bin === item.bin) setRight((r) => r + 1);
    else setWrong((w) => w + 1);
    setFlash(bin === item.bin ? 'ok' : 'bad');
    setTimeout(() => setFlash(null), 180);
    setN((x) => x + 1);
  };
  // number keys pick a bin too
  useKeys(go && !done, (e) => {
    const b = set.bins[Number(e.key) - 1];
    if (b && !e.repeat) drop(b.id);
  });
  if (done) {
    const s = sortScore(right, wrong);
    return (
      <div className="eng-wrap">
        <div className="eng-result">
          <b>{verdict(s)}</b> <span>{right} sorted · {wrong} wrong</span>
          <button className="btn btn-primary" onClick={() => onDone(s, `${right} sorted.`)}>Finish</button>
        </div>
      </div>
    );
  }
  return (
    <div className="eng-wrap sort-wrap">
      <div className="qz-top"><span>⏱ {Math.ceil(left)}s</span><span>✔ {right}</span><span>✖ {wrong}</span></div>
      {go ? (
        <div className={`sort-item ${flash ?? ''}`}><span>{item.icon}</span><b>{item.label}</b></div>
      ) : <button className="btn btn-primary" onClick={() => setGo(true)}>Start</button>}
      <div className="sort-bins">
        {set.bins.map((b, k) => <button key={b.id} className="sort-bin" onClick={() => drop(b.id)}><span>{b.icon}</span><b>{b.label}</b><small>{k + 1}</small></button>)}
      </div>
    </div>
  );
}
