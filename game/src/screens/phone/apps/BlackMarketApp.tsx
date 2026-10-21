import { ITEMS, blackPrice, buyItem, itemCount } from '../../../state/inventory/items';
import { darkCrimeOn } from '../../../state/crime/consent';
import { fmt } from '../../../state/systems/finance';
import type { AppProps } from './types';

/** Update 0.5 — the Back Room: unregistered copies of gun-store items plus black-market-only gear. */
export function BlackMarketApp({ game, done }: AppProps) {
  const dark = new Set(['sedative', 'poison', 'pistol']);
  const items = ITEMS.filter((it) => (it.market === 'black' || it.market === 'gun' || it.id === 'combat_knife') && (!dark.has(it.id) || darkCrimeOn()));
  return (
    <div className="ph-cards">
      <p className="app-note">No receipts. No paperwork. Everything here is a problem if it’s found on you.</p>
      {items.map((it) => {
        const price = blackPrice(it);
        return (
          <div key={it.id} className={`ph-row ${game.canAfford(price) ? '' : 'dim'}`}>
            <span className="ph-row-icon">{it.icon}</span>
            <span className="ph-row-main"><b>{it.name}{itemCount(game, it.id) ? ` (${itemCount(game, it.id)})` : ''}</b><small>{it.desc}</small></span>
            <button className="btn btn-sm" disabled={!game.canAfford(price)} onClick={() => done(buyItem(game, it.id, true), 'The Back Room', '🕶️')}>{fmt(price)}</button>
          </div>
        );
      })}
    </div>
  );
}
