import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { ActionResult, Game } from '../../state/Game';
import { DeltaChips } from '../../components/DeltaChips';

/** Brief card above the scene describing what just happened. Fades out on its own. */
export function ActionToast({ game, result, onDone }: { game: Game; result: ActionResult; onDone: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tl = gsap.timeline({ onComplete: onDone });
    tl.fromTo(el.current, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }).to(el.current, { opacity: 0, duration: 0.5, delay: 3.6 });
    return () => {
      tl.kill();
    };
  }, [result, onDone]);
  return (
    <div className="tst-card glass" ref={el} onClick={onDone}>
      <div className="tst-head">
        <span>{result.icon}</span>
        <b>{result.title}</b>
        {result.monthPassed && <em>New month</em>}
      </div>
      {result.text && <div className="tst-text">{result.text}</div>}
      <DeltaChips game={game} deltas={result.deltas} />
    </div>
  );
}
