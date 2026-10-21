import { ASSETS, assetLock, buyAsset, fmt, sellAsset } from '../../../state/systems/finance';
import { ITEMS, buyItem, itemCount, itemLock } from '../../../state/inventory/items';
import { settings } from '../../../state/settings';
import { HoldButton } from '../../../components/HoldButton';
import type { AppProps } from './types';

export function ShopApp({ game, done }: AppProps) {
  const assets = ASSETS.filter((a) => !a.hidden && (!a.region || a.region === game.s.region));
  const items = ITEMS.filter((it) => it.shop && (!it.matureOnly || settings.mature));
  return (
    <div className="ph-cards">
      <div className="ph-section">Items</div>
      {items.map((it) => {
        const lock = itemLock(game, it);
        return (
          <div key={it.id} className={`ph-row ${lock || !game.canAfford(it.price) ? 'dim' : ''}`}>
            <span className="ph-row-icon">{it.icon}</span>
            <span className="ph-row-main"><b>{it.name}{itemCount(game, it.id) ? ` (${itemCount(game, it.id)})` : ''}</b><small>{it.desc}</small></span>
            {lock ? <span className="ph-why">{lock}</span> : <button className="btn btn-sm" disabled={!game.canAfford(it.price)} onClick={() => done(buyItem(game, it.id), 'Purchase', it.icon)}>{fmt(it.price)}</button>}
          </div>
        );
      })}
      <div className="ph-section">Big purchases</div>
      {assets.map((a) => {
        const owned = game.has(a.id);
        const lock = assetLock(game, a.id);
        const afford = game.canAfford(a.price);
        return (
          <div key={a.id} className={`ph-row ${owned || (!lock && afford) ? '' : 'dim'}`}>
            <span className="ph-row-icon">{a.icon}</span>
            <span className="ph-row-main">
              <b>{a.name}</b>
              <small>{a.desc}{a.upkeep ? ` · ${fmt(a.upkeep)}/mo upkeep` : ''}</small>
            </span>
            {owned ? (
              <button className="btn btn-sm" onClick={() => done(sellAsset(game, a.id), 'Sold', a.icon)}>Sell {fmt(a.price * 0.5)}</button>
            ) : lock ? (
              <span className="ph-why">{lock}</span>
            ) : a.price >= 10000 ? (
              <HoldButton className="btn-sm" disabled={!afford} onConfirm={() => done(buyAsset(game, a.id), 'Purchase', a.icon)}>Hold · {fmt(a.price)}</HoldButton>
            ) : (
              <button className="btn btn-sm" disabled={!afford} onClick={() => done(buyAsset(game, a.id), 'Purchase', a.icon)}>Buy {fmt(a.price)}</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
