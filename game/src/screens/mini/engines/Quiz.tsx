import { useMemo, useRef, useState } from 'react';
import { CARD_SECONDS, QUIZ_CARDS, pickQuestions, quizScore } from '../../../state/minigames/engines/quiz';
import { useLoop, verdict, type EngineProps } from './common';

/** Update 0.13 — quiz cards (classes, studying, the SAT, the permit test…). */
export function Quiz({ theme, seed, onDone }: EngineProps) {
  const qs = useMemo(() => pickQuestions(theme.skin, seed), [theme.skin, seed]);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState(CARD_SECONDS);
  const clock = useRef(CARD_SECONDS);
  const done = i >= QUIZ_CARDS;
  const answer = (k: number) => {
    if (picked !== null || done) return;
    setPicked(k);
    if (k === qs[i].right) setRight((r) => r + 1);
    setTimeout(() => {
      clock.current = CARD_SECONDS;
      setLeft(CARD_SECONDS);
      setPicked(null);
      setI((x) => x + 1);
    }, 700);
  };
  useLoop(!done && picked === null, (dt) => {
    clock.current = Math.max(0, clock.current - dt);
    setLeft(clock.current);
    if (clock.current === 0) answer(-1);
  });
  if (done) {
    const s = quizScore(right);
    return (
      <div className="eng-wrap">
        <div className="eng-result">
          <b>{verdict(s)}</b> <span>{right}/{QUIZ_CARDS} right</span>
          <button className="btn btn-primary" onClick={() => onDone(s, `${right}/${QUIZ_CARDS} right.`)}>Finish</button>
        </div>
      </div>
    );
  }
  const q = qs[i];
  return (
    <div className="eng-wrap qz-wrap">
      <div className="qz-top"><span>Card {i + 1}/{QUIZ_CARDS}</span><span className="qz-time"><i style={{ width: `${(left / CARD_SECONDS) * 100}%` }} /></span><span>✔ {right}</span></div>
      <div className="qz-card">{q.q}</div>
      <div className="qz-answers">
        {q.a.map((a, k) => (
          <button key={k} className={`qz-a ${picked !== null && k === q.right ? 'right' : ''} ${picked === k && k !== q.right ? 'wrong' : ''}`} onClick={() => answer(k)}>{a}</button>
        ))}
      </div>
    </div>
  );
}
