import { useState } from 'react';
import type { AppProps } from './types';
import { GOD_POWERS, GOD_POWER_BY_ID, castPower, haremMembers, powerLock, smite, smiteTargets } from '../../../state/systems/god';
import { PersonChip } from '../../../components/PersonChip';
import { HoldButton } from '../../../components/HoldButton';

/** Update 0.6 — "Become God": every power spends a time slot. */
export function GodApp({ game, spend, openPeople }: AppProps) {
  const [picking, setPicking] = useState(false);
  const cast = (id: string) => {
    const p = GOD_POWER_BY_ID[id];
    spend(game.spendTurn(p.name, p.icon, () => castPower(game, id)));
  };

  if (picking) {
    const targets = smiteTargets(game);
    return (
      <div className="app-stack">
        <button className="app-back" onClick={() => setPicking(false)}>‹ Powers</button>
        <p className="app-sub">Who do you strike down? Adults only.</p>
        {targets.map((p) => (
          <div key={p.id} className="god-target">
            <PersonChip game={game} p={p} compact />
            <HoldButton className="btn-sm" onConfirm={() => spend(game.spendTurn('Smite', '⚡', () => smite(game, p.id), p.id))}>⚡ Smite</HoldButton>
          </div>
        ))}
      </div>
    );
  }

  const harem = haremMembers(game);
  return (
    <div className="app-stack">
      <div className="app-box god-head">
        <b>⚡ You are a god</b>
        <small>Immortal. Untouchable. The world is watching.</small>
        <div className="god-stats">
          <span><i>🛐</i>{game.flag('followers').toLocaleString()} followers</span>
          <span><i>🌟</i>Fame {Math.round(game.s.fame)}</span>
          <span><i>☯️</i>Karma {Math.round(game.s.karma)}</span>
        </div>
      </div>
      <div className="god-grid">
        {GOD_POWERS.map((p) => {
          const lock = powerLock(game, p);
          const big = p.id === 'level' || p.id === 'supernova';
          const body = (
            <>
              <span>{p.icon}</span>
              <b>{p.name}</b>
              <small>{lock ?? p.desc}</small>
            </>
          );
          if (p.id === 'smite') return <button key={p.id} className="god-power dark" disabled={!!lock || !game.canAct()} title={lock ?? ''} onClick={() => setPicking(true)}>{body}</button>;
          if (big && !lock) return <HoldButton key={p.id} className="god-power big" disabled={!game.canAct()} onConfirm={() => cast(p.id)}>{body}</HoldButton>;
          return <button key={p.id} className={`god-power ${big ? 'big' : ''}`} disabled={!!lock || !game.canAct()} title={lock ?? ''} onClick={() => cast(p.id)}>{body}</button>;
        })}
      </div>
      <div className="app-box">
        <div className="ph-section">👑 Your circle</div>
        {harem.length === 0 && <p className="app-note">Invite partners from their profile in People. Each one decides for themselves.</p>}
        {harem.map((p) => <PersonChip key={p.id} game={game} p={p} compact onClick={() => openPeople?.(p.id)} />)}
      </div>
    </div>
  );
}
