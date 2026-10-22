import { useEffect, useRef } from 'react';
import type { Theme } from '../../../state/minigames/themes';

// Update 0.13 — shared bits for the minigame screens. Loops and key handlers live in refs so a parent re-render
// never restarts a game (CLAUDE.md lesson).

export interface EngineProps {
  theme: Theme;
  seed: number;
  onDone: (score: number, note: string) => void;
}

/** requestAnimationFrame loop while `on`; the callback gets dt (s) and elapsed (s). */
export function useLoop(on: boolean, cb: (dt: number, t: number) => void) {
  const fn = useRef(cb);
  fn.current = cb;
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let last = performance.now();
    const start = last;
    const step = (now: number) => {
      fn.current(Math.min(0.05, (now - last) / 1000), (now - start) / 1000);
      last = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on]);
}

/** Key handlers while `on` (down and optional up). */
export function useKeys(on: boolean, down: (e: KeyboardEvent) => void, up?: (e: KeyboardEvent) => void) {
  const d = useRef(down);
  const u = useRef(up);
  d.current = down;
  u.current = up;
  useEffect(() => {
    if (!on) return;
    const kd = (e: KeyboardEvent) => d.current(e);
    const ku = (e: KeyboardEvent) => u.current?.(e);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [on]);
}

export const verdict = (score: number) => (score >= 0.85 ? 'Brilliant!' : score >= 0.6 ? 'Nicely done.' : score >= 0.35 ? 'Not bad.' : 'Rough one.');
