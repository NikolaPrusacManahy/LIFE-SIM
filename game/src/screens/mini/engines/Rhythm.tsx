import { useMemo, useRef, useState } from 'react';
import { FALL, LANES, RHYTHM_SECONDS, chart, judge, rhythmScore } from '../../../state/minigames/engines/rhythm';
import { useKeys, useLoop, verdict, type EngineProps } from './common';

const W = 420;
const H = 320;
const LINE = H - 50;
const COLORS = ['#ff5d8f', '#ffb84d', '#5dd39e', '#5aa9ff'];
const SKIN: Record<string, string> = { guitar: '🎸', choir: '🎤', dance: '🕺' };

/** Update 0.13 — rhythm lanes (guitar, choir, prom). */
export function Rhythm({ theme, seed, onDone }: EngineProps) {
  const notes = useMemo(() => chart(seed), [seed]);
  const [go, setGo] = useState(false);
  const [over, setOver] = useState<number | null>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const t = useRef(0);
  const hit = useRef(new Set<number>());
  const stats = useRef({ perfect: 0, good: 0, flash: [0, 0, 0, 0], last: '' });
  useKeys(go && over === null, (e) => {
    const lane = LANES.indexOf(e.key.toLowerCase() as (typeof LANES)[number]);
    if (lane < 0 || e.repeat) return;
    let best = -1;
    let bestOff = 1e9;
    notes.forEach((n, i) => {
      if (n.lane !== lane || hit.current.has(i)) return;
      const off = (t.current - n.t) * 1000;
      if (Math.abs(off) < Math.abs(bestOff)) [best, bestOff] = [i, off];
    });
    const j = best >= 0 ? judge(bestOff) : 'miss';
    if (j !== 'miss') {
      hit.current.add(best);
      if (j === 'perfect') stats.current.perfect++;
      else stats.current.good++;
    }
    stats.current.flash[lane] = 0.25;
    stats.current.last = j === 'perfect' ? 'PERFECT' : j === 'good' ? 'GOOD' : 'MISS';
  });
  useLoop(go && over === null, (dt, el) => {
    t.current = el;
    const s = stats.current;
    s.flash = s.flash.map((f) => Math.max(0, f - dt));
    const ctx = cv.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, W, H);
      const lw = W / LANES.length;
      LANES.forEach((k, i) => {
        ctx.fillStyle = s.flash[i] ? `${COLORS[i]}55` : i % 2 ? '#1d1840' : '#231d4d';
        ctx.fillRect(i * lw, 0, lw, H);
        ctx.fillStyle = '#ffffffaa';
        ctx.font = '700 14px sans-serif';
        ctx.fillText(k.toUpperCase(), i * lw + lw / 2 - 5, H - 16);
      });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, LINE, W, 3);
      notes.forEach((n, i) => {
        if (hit.current.has(i)) return;
        const y = LINE - ((n.t - el) / FALL) * LINE;
        if (y < -20 || y > H) return;
        ctx.fillStyle = COLORS[n.lane];
        ctx.beginPath();
        ctx.roundRect(n.lane * lw + 10, y - 9, lw - 20, 18, 9);
        ctx.fill();
      });
      ctx.fillStyle = '#fff';
      ctx.font = '800 18px sans-serif';
      ctx.fillText(s.last, W / 2 - 34, 40);
    }
    if (el >= RHYTHM_SECONDS) setOver(rhythmScore(s.perfect, s.good, notes.length));
  });
  return (
    <div className="eng-wrap eng-rhythm">
      <div className="eng-icon">{SKIN[theme.skin] ?? '🎵'}</div>
      <canvas ref={cv} width={W} height={H} className="eng-canvas" />
      {!go && <button className="btn btn-primary" onClick={() => setGo(true)}>Start</button>}
      {over !== null && (
        <div className="eng-result">
          <b>{verdict(over)}</b> <span>{stats.current.perfect} perfect · {stats.current.good} good · {notes.length - stats.current.perfect - stats.current.good} missed</span>
          <button className="btn btn-primary" onClick={() => onDone(over, `${stats.current.perfect} perfect notes.`)}>Finish</button>
        </div>
      )}
    </div>
  );
}
