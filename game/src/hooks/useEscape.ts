import { useEffect, useRef } from 'react';

/**
 * Esc closes the innermost layer first. Each layer registers while mounted;
 * the most recently mounted layer handles the key.
 */
const stack: { current: () => void }[] = [];

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !stack.length) return;
  e.preventDefault();
  stack[stack.length - 1].current();
});

export function useEscape(onEscape: () => void, active = true) {
  const ref = useRef(onEscape);
  ref.current = onEscape;
  useEffect(() => {
    if (!active) return;
    stack.push(ref);
    return () => {
      const i = stack.lastIndexOf(ref);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [active]);
}
