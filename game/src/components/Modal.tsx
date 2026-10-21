import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useEscape } from '../hooks/useEscape';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  wide?: boolean;
  className?: string;
}

/** Centered glass card over a dimmed backdrop. Esc closes it when `onClose` is given. */
export function Modal({ children, onClose, wide, className = '' }: Props) {
  const card = useRef<HTMLDivElement>(null);
  useEscape(() => onClose?.(), !!onClose);
  useEffect(() => {
    gsap.fromTo(card.current, { y: 24, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: 'power2.out' });
  }, []);
  return (
    <div className="mdl-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={card} className={`mdl-card ${wide ? 'mdl-wide' : ''} ${className}`}>
        {onClose && <button className="mdl-x" onClick={onClose} aria-label="Close">✕</button>}
        {children}
      </div>
    </div>
  );
}
