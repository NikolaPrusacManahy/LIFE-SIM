import type { DeskProps } from './types';
import { GAMES } from '../../state/games/catalog';
import { canPlay, download, downloadLock } from '../../state/web/sites';
import { fmt } from '../../state/systems/finance';

/** Update 0.8 — Bitstore: buy, download, play. Library PCs only run browser games. */
export function Bitstore({ game, notify, open }: DeskProps) {
  const lock = downloadLock(game);
  return (
    <div className="bit-grid">
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
