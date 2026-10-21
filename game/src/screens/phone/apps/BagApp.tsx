import { ITEM_BY_ID, contrabandHeld } from '../../../state/inventory/items';
import type { AppProps } from './types';

/** Update 0.4 — inventory. */
export function BagApp({ game }: AppProps) {
  const entries = Object.entries(game.s.inventory).filter(([, n]) => n > 0);
  const hot = new Set(contrabandHeld(game).map((i) => i.id));
  return (
    <div className="app-stack">
      {entries.length === 0 && <p className="app-empty">Your bag is empty. Buy things in the Shop.</p>}
      <div className="bag-grid">
        {entries.map(([id, n]) => {
          const it = ITEM_BY_ID[id];
          if (!it) return null;
          return (
            <div key={id} className={`bag-item ${hot.has(id) ? 'hot' : ''}`} title={it.desc}>
              <span>{it.icon}</span>
              <b>{it.name}</b>
              <small>{n > 1 ? `×${n}` : ''}{hot.has(id) ? ' · illegal for you' : ''}</small>
            </div>
          );
        })}
      </div>
      {hot.size > 0 && <p className="app-note">⚠ Parents, school, police or roommates may search your stuff.</p>}
    </div>
  );
}
