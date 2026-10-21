import type { DeskProps } from './types';
import { GAMES } from '../../state/games/catalog';
import { canPlay, download, downloadLock } from '../../state/web/sites';
import { fmt } from '../../state/systems/finance';
import { VPN_PRICE, buyVpn } from '../../state/web/hack';

/** Update 0.8 — Bitstore: buy, download, play. Library PCs only run browser games. */
export function Bitstore({ game, notify, open }: DeskProps) {
  const lock = downloadLock(game);
  const vpn = game.s.web.installed.includes('vpn');
  return (
    <div className="bit-grid">
      {/* Update 0.12 — the VPN that Hackr needs */}
      <div className="bit-card">
        <span className="bit-icon">🛡️</span>
        <b>GhostTunnel VPN</b>
        <small>Masks your address. Hackr needs it.</small>
        {vpn ? <button className="btn btn-sm" disabled>✔ Installed</button> : (
          <button className="btn btn-sm" disabled={!!lock || !game.canAfford(VPN_PRICE)} title={lock ?? ''} onClick={() => notify(buyVpn(game))}>{lock ? '🔒 No downloads' : `Buy ${fmt(VPN_PRICE)}`}</button>
        )}
      </div>
      {GAMES.map((d) => {
        const playable = canPlay(game, d.id);
        return (
          <div key={d.id} className="bit-card">
            <span className="bit-icon">{d.icon}</span>
            <b>{d.name}</b>
            <small>{d.desc}</small>
            {playable ? (
              <button className="btn btn-sm btn-primary" onClick={() => open('game', d.id)}>▶ Play</button>
            ) : (
              <button className="btn btn-sm" disabled={!!lock || !game.canAfford(d.price)} title={lock ?? ''} onClick={() => notify(download(game, d.id))}>
                {lock ? '🔒 No downloads' : d.price ? `Buy ${fmt(d.price)}` : 'Download (free)'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
