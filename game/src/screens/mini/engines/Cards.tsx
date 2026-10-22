import { useMemo, useRef, useState } from 'react';
import { HANDS, SYMBOLS, blackjackResult, cardLabel, dealerPlay, deck, handValue, isRed, pokerRank, pokerScore, slotScore, type Card } from '../../../state/minigames/engines/cards';
import { useLoop, type EngineProps } from './common';

const CardView = ({ c, hidden, held, onClick }: { c: Card; hidden?: boolean; held?: boolean; onClick?: () => void }) => (
  <button className={`cds ${hidden ? 'back' : ''} ${!hidden && isRed(c) ? 'red' : ''} ${held ? 'held' : ''}`} onClick={onClick} disabled={!onClick}>
    {hidden ? '🂠' : cardLabel(c)}
  </button>
);

/** Update 0.13 — the casino, for real: blackjack, five-card draw, slots. */
export function Cards(props: EngineProps) {
  if (props.theme.skin === 'poker') return <Poker {...props} />;
  if (props.theme.skin === 'slots') return <Slots {...props} />;
  return <Blackjack {...props} />;
}

function Blackjack({ seed, onDone }: EngineProps) {
  const d = useMemo(() => deck(seed), [seed]);
  const [hand, setHand] = useState<Card[]>(() => [d.pop()!, d.pop()!]);
  const [dealer, setDealer] = useState<Card[]>(() => [d.pop()!, d.pop()!]);
  const [over, setOver] = useState<'win' | 'push' | 'lose' | null>(null);
  const stand = (h = hand) => {
    const fin = dealerPlay(dealer, d);
    setDealer(fin);
    setOver(blackjackResult(h, fin));
  };
  const hit = () => {
    const h = [...hand, d.pop()!];
    setHand(h);
    if (handValue(h) > 21) setOver('lose');
    else if (handValue(h) === 21) stand(h);
  };
  return (
    <div className="eng-wrap cards-wrap">
      <div className="cds-row"><small>Dealer {over ? handValue(dealer) : ''}</small>{dealer.map((c, i) => <CardView key={i} c={c} hidden={!over && i === 1} />)}</div>
      <div className="cds-row"><small>You {handValue(hand)}</small>{hand.map((c, i) => <CardView key={i} c={c} />)}</div>
      {over ? (
        <div className="eng-result">
          <b>{over === 'win' ? 'You win!' : over === 'push' ? 'Push.' : 'Dealer wins.'}</b>
          <button className="btn btn-primary" onClick={() => onDone(over === 'win' ? 1 : over === 'push' ? 0.5 : 0, over === 'win' ? `Blackjack win with ${handValue(hand)}.` : over === 'push' ? 'A push.' : `Busted at ${handValue(hand)}.`)}>Collect</button>
        </div>
      ) : (
        <div className="cds-actions"><button className="btn btn-primary" onClick={hit}>Hit</button><button className="btn" onClick={() => stand()}>Stand</button></div>
      )}
    </div>
  );
}

function Poker({ seed, onDone }: EngineProps) {
  const d = useMemo(() => deck(seed), [seed]);
  const [hand, setHand] = useState<Card[]>(() => d.splice(0, 5));
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [drawn, setDrawn] = useState(false);
  const draw = () => {
    setHand(hand.map((c, i) => (held[i] ? c : d.pop()!)));
    setDrawn(true);
  };
  const rank = pokerRank(hand);
  return (
    <div className="eng-wrap cards-wrap">
      <div className="cds-row">{hand.map((c, i) => <CardView key={i} c={c} held={held[i]} onClick={drawn ? undefined : () => setHeld((h) => h.map((x, j) => (j === i ? !x : x)))} />)}</div>
      <p className="app-note">{drawn ? HANDS[rank] : `Click cards to hold (${HANDS[rank]} now). Two pair or better wins.`}</p>
      {drawn ? (
        <div className="eng-result"><b>{rank >= 2 ? 'You win!' : rank === 1 ? 'A pair — your money back.' : 'No luck.'}</b><button className="btn btn-primary" onClick={() => onDone(pokerScore(rank), `${HANDS[rank]}.`)}>Collect</button></div>
      ) : <button className="btn btn-primary" onClick={draw}>Draw</button>}
    </div>
  );
}

function Slots({ seed, onDone }: EngineProps) {
  const [stopped, setStopped] = useState<number[]>([]);
  const [spin, setSpin] = useState([0, 0, 0]);
  const t = useRef(0);
  useLoop(stopped.length < 3, (dt) => {
    t.current += dt;
    setSpin([0, 1, 2].map((i) => Math.floor(t.current * (9 + i * 2) + seed * (i + 1)) % SYMBOLS.length));
  });
  const stop = () => setStopped((s) => (s.length < 3 ? [...s, spin[s.length]] : s));
  const reels = [0, 1, 2].map((i) => stopped[i] ?? spin[i]);
  const score = stopped.length === 3 ? slotScore(stopped) : 0;
  return (
    <div className="eng-wrap cards-wrap">
      <div className="slot-reels">{reels.map((r, i) => <span key={i} className={i < stopped.length ? 'on' : ''}>{SYMBOLS[r]}</span>)}</div>
      {stopped.length < 3 ? <button className="btn btn-primary" onClick={stop}>Stop reel {stopped.length + 1}</button> : (
        <div className="eng-result"><b>{score === 1 ? 'JACKPOT!' : score ? 'A pair!' : 'Nothing.'}</b><button className="btn btn-primary" onClick={() => onDone(score, score === 1 ? 'Three of a kind!' : score ? 'A pair on the reels.' : 'The reels said no.')}>Collect</button></div>
      )}
    </div>
  );
}
