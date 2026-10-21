import { useMemo, useState } from 'react';
import type { GameProps } from '../types';
import { WORDS, friendGuesses, markGuess, type Mark } from '../../../state/games/cards';

// Update 0.8 — Word Duel: guess the 5-letter word; beat your friend's number of guesses. Score 1 = win.

export function Words({ game, onEnd }: GameProps) {
  const answer = useMemo(() => WORDS[Math.floor(Math.random() * WORDS.length)], []);
  const friend = useMemo(() => {
    const f = game.s.people.find((p) => p.alive && p.role === 'friend') ?? null;
    return { name: f?.name ?? 'A stranger', guesses: friendGuesses(f ? 50 : 40) };
  }, [game]);
  const [rows, setRows] = useState<{ word: string; marks: Mark[] }[]>([]);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const submit = () => {
    const w = input.toUpperCase();
    if (w.length !== 5 || done) return;
    const next = [...rows, { word: w, marks: markGuess(w, answer) }];
    setRows(next);
    setInput('');
    const won = w === answer;
    if (won || next.length >= 6) {
      setDone(true);
      setTimeout(() => onEnd(won && next.length <= friend.guesses ? 1 : 0), 900);
    }
  };
  return (
    <div className="wd-wrap">
      <small>{friend.name} solved theirs in {friend.guesses}. Beat it!</small>
      {rows.map((r, i) => (
        <div key={i} className="wd-row">
          {r.word.split('').map((ch, j) => <span key={j} className={`wd-tile ${r.marks[j]}`}>{ch}</span>)}
        </div>
      ))}
      {done && <b>The word was {answer}.</b>}
      {!done && (
        <form className="wd-input" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input value={input} maxLength={5} onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, ''))} autoFocus placeholder="5 letters" />
          <button className="btn btn-sm btn-primary" type="submit" disabled={input.length !== 5}>Guess {rows.length + 1}/6</button>
        </form>
      )}
    </div>
  );
}
