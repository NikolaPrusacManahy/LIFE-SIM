import { useRef, useState, type ReactNode } from 'react';

interface Props {
  onConfirm: () => void;
  children: ReactNode;
  disabled?: boolean;
  ms?: number;
  className?: string;
}

/** Long-press button that fills up before confirming — used for big costs. */
export function HoldButton({ onConfirm, children, disabled, ms = 900, className = '' }: Props) {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  const start = () => {
    if (disabled) return;
    const t0 = performance.now();
    const tick = () => {
      const v = Math.min(1, (performance.now() - t0) / ms);
      setP(v);
      if (v >= 1) {
        setP(0);
        onConfirm();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf.current);
    setP(0);
  };
  return (
    <button className={`btn hold-btn ${className}`} disabled={disabled} onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}>
      <span className="hold-fill" style={{ width: `${p * 100}%` }} />
      <span className="hold-label">{children}</span>
    </button>
  );
}
