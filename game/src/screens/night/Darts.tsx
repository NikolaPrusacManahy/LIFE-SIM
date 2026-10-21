import { useEffect, useRef, useState } from 'react';

/** Update 0.8 — darts: a marker sweeps across; click to throw. Three throws, centre = best. */
export function Darts({ onDone }: { onDone: (throws: number[]) => void }) {
  const [pos, setPos] = useState(0);
  const [throws, setThrows] = useState<number[]>([]);
  const t0 = useRef(performance.now());
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const t = ((now - t0.current) / 900) % 2;
      setPos(t < 1 ? t : 2 - t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (throws.length === 3) {
      const id = setTimeout(() => doneRef.current(throws), 600);
      return () => clearTimeout(id);
    }
  }, [throws]);
  return (
    <div className="drt-wrap" onPointerDown={() => throws.length < 3 && setThrows((t) => [...t, pos])}>
      <b>🎯 Click when the marker hits the bullseye ({throws.length}/3)</b>
      <div className="drt-track">
        <span className="drt-bull" />
        <span className="drt-marker" style={{ left: `${pos * 100}%` }} />
        {throws.map((t, i) => <span key={i} className="drt-hit" style={{ left: `${t * 100}%` }} />)}
      </div>
    </div>
  );
}
