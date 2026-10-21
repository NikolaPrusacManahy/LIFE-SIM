import { useState } from 'react';
import type { DeskProps } from '../types';
import { HACK_TRIES, guess, hackLock, leaksFor, letters, takeWallet, chargeCard, type Leak } from '../../../state/web/hack';

/** Update 0.12 — Hackr (crime): leaked accounts, a riddle hint for each password, 3 tries. */
export function HackApp({ game, notify }: DeskProps) {
  const lock = hackLock(game);
  const [open, setOpen] = useState<string | null>(null);
  if (lock) {
    return (
      <div className="hkr-wrap">
        <div className="hkr-head"><b>🕶️ Hackr</b><span className="hkr-crime">CRIME</span></div>
        <p className="hkr-lock">🔒 {lock}</p>
      </div>
    );
  }
  const leaks = leaksFor(game);
  const leak = leaks.find((l) => l.id === open);
  return (
    <div className="hkr-wrap">
      <div className="hkr-head"><b>🕶️ Hackr</b><span className="hkr-crime">CRIME</span><small>🛡️ VPN on</small></div>
      {leak ? <Account leak={leak} back={() => setOpen(null)} {...{ game, notify }} /> : (
        <>
          <p className="hkr-note">Exposed accounts leaked this month. Each has a password hint. {HACK_TRIES} tries.</p>
          {leaks.map((l) => (
            <button key={l.id} className={`hkr-row ${l.status}`} onClick={() => setOpen(l.id)}>
              <b>{l.name}</b>
              <small>{l.source}</small>
              <em>{l.status === 'cracked' ? '✔ cracked' : l.status === 'locked' ? '✖ locked' : `${l.tries}/${HACK_TRIES} tries`}</em>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function Account({ game, notify, leak, back }: Pick<DeskProps, 'game' | 'notify'> & { leak: Leak; back: () => void }) {
  const [word, setWord] = useState('');
  return (
    <div className="hkr-acct">
      <button className="hkr-back" onClick={back}>‹ Leaks</button>
      {leak.status === 'cracked' ? (
        <div className="hkr-profile">
          <b>ACCESS GRANTED</b>
          <div>Name: {leak.name}</div>
          <div>Age: {leak.age}</div>
          <div>Job: {leak.job}</div>
          <div>City: {leak.city}</div>
          {leak.loot === 'card' && (
            <button className="btn btn-sm btn-primary" disabled={leak.taken} onClick={() => notify(chargeCard(game, leak.id))}>{leak.taken ? 'Card used' : `💳 Use their card (~$${leak.amount.toLocaleString()})`}</button>
          )}
          {leak.loot === 'wallet' && (
            <button className="btn btn-sm btn-primary" disabled={leak.taken} onClick={() => notify(takeWallet(game, leak.id))}>{leak.taken ? 'Wallet emptied' : `₿ Move their Bitcons (~$${leak.amount.toLocaleString()})`}</button>
          )}
          {!leak.loot && <small>Nothing worth taking.</small>}
        </div>
      ) : leak.status === 'locked' ? (
        <p className="hkr-lock">✖ Account locked.</p>
      ) : (
        <div className="hkr-crack">
          <div>{leak.name} · {leak.source}</div>
          <div className="hkr-hint">💡 Hint: “{leak.hint}” ({letters(leak)})</div>
          <form onSubmit={(e) => { e.preventDefault(); if (word.trim()) { notify(guess(game, leak.id, word)); setWord(''); } }}>
            <input className="hkr-input" value={word} spellCheck={false} autoFocus placeholder="password" onChange={(e) => setWord(e.target.value)} />
            <button className="btn btn-sm btn-primary" type="submit">Try ({leak.tries} left)</button>
          </form>
        </div>
      )}
    </div>
  );
}
