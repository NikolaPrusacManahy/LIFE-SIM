import { ItemIcon } from '../../components/ItemIcon';
import { useState } from 'react';
import type { DeskProps } from './types';
import { ITEM_BY_ID, itemCount, itemLock } from '../../state/inventory/items';
import { EXPRESS_FEE, checkout, inTransit, nileItems, onionItems, onionPrice, returnOrder, returnable } from '../../state/web/nile';
import { sessionDo } from '../../state/web/sites';
import { PART_BY_ID, PARTS, REQUIRED, SLOT_ICON, SLOT_LABEL, partsFor, type PartDef, type PartSlot } from '../../state/pc/parts';
import { compatibility } from '../../state/pc/build';
import { fmt } from '../../state/systems/finance';

/** Update 0.8 — Nile (and Onionmarket): add to cart, check out once (one session action). */
export function NileView({ game, notify, dark }: DeskProps & { dark: boolean }) {
  const [tab, setTab] = useState<'items' | 'parts'>('items');
  const [cart, setCart] = useState<string[]>([]);
  const [express, setExpress] = useState(false);
  const list = dark ? onionItems() : nileItems().filter((it) => (tab === 'parts' ? it.market === 'nile' : it.market !== 'nile'));
  const price = (id: string) => (dark ? onionPrice(ITEM_BY_ID[id]) : ITEM_BY_ID[id].price);
  const total = cart.reduce((a, id) => a + price(id), 0) + (express ? EXPRESS_FEE * cart.length : 0);
  const buy = () => {
    const ids = cart;
    setCart([]);
    notify(sessionDo(game, () => checkout(game, ids, express, dark)));
  };
  return (
    <div className="shp-wrap">
      {!dark && (
        <div className="shp-tabs">
          <button className={tab === 'items' ? 'on' : ''} onClick={() => setTab('items')}>Everything</button>
          <button className={tab === 'parts' ? 'on' : ''} onClick={() => setTab('parts')}>🖥️ PC parts</button>
        </div>
      )}
      {dark && <p className="app-note">Crypto only (+5%). Vendors vanish. Packages get intercepted.</p>}
      <div className="shp-grid">
        {list.map((it) => {
          const lock = dark ? null : itemLock(game, it);
          return (
            <button key={it.id} className="shp-item" disabled={!!lock} title={lock ?? it.desc} onClick={() => setCart((c) => [...c, it.id])}>
              <ItemIcon id={it.id} emoji={it.icon} />
              <b>{it.name}</b>
              <small>{lock ?? `${fmt(price(it.id))}${itemCount(game, it.id) ? ` · own ${itemCount(game, it.id)}` : ''}`}</small>
            </button>
          );
        })}
      </div>
      <div className="shp-cart">
        <span>🛒 {cart.length ? cart.map((id) => ITEM_BY_ID[id].icon).join(' ') : 'Cart empty'}</span>
        {cart.length > 0 && <button className="btn btn-sm btn-ghost" onClick={() => setCart([])}>Clear</button>}
        <label><input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} /> Express (+{fmt(EXPRESS_FEE)} each)</label>
        <button className="btn btn-sm btn-primary" disabled={!cart.length || !game.canAfford(total)} onClick={buy}>Checkout {fmt(total)}</button>
      </div>
      {!dark && (inTransit(game).length > 0 || returnable(game).length > 0) && (
        <div className="shp-orders">
          {inTransit(game).map((o) => <small key={o.id}>🚚 {ITEM_BY_ID[o.item]?.name} — arriving {o.arrive - game.s.turn <= 1 ? 'next slot' : `in ${o.arrive - game.s.turn} slots`}</small>)}
          {returnable(game).map((o) => (
            <span key={o.id}>
              <small>{o.status === 'wrong' ? '🦆 Wrong item' : '💔 Damaged'}: {ITEM_BY_ID[o.item]?.name}</small>
              <button className="btn btn-sm" onClick={() => notify(returnOrder(game, o.id))}>Return</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Update 0.8 — PartPicker: plan a build and see compatibility before you buy. */
export function PartPickerView({ game }: DeskProps) {
  const [pick, setPick] = useState<Partial<Record<PartSlot, string>>>(() => ({ ...game.s.pc.parts }));
  const slots: PartSlot[] = [...REQUIRED, 'fans', 'headset', 'webcam', 'mic', 'chair', 'desk', 'rgb'];
  const asParts = Object.fromEntries(Object.entries(pick).filter(([, v]) => v).map(([k, v]) => [k, PART_BY_ID[v!]])) as Partial<Record<PartSlot, PartDef>>;
  const issues = compatibility(asParts);
  const total = Object.values(asParts).reduce((a, p) => a + (p?.price ?? 0), 0);
  const draw = (asParts.cpu?.draw ?? 0) + (asParts.gpu?.draw ?? 0) + 80;
  return (
    <div className="ppk-wrap">
      {slots.map((s) => (
        <label key={s} className="ppk-row">
          <span>{SLOT_ICON[s]} {SLOT_LABEL[s]}{REQUIRED.includes(s) ? '' : ' (optional)'}</span>
          <select value={pick[s] ?? ''} onChange={(e) => setPick((p) => ({ ...p, [s]: e.target.value || undefined }))}>
            <option value="">—</option>
            {partsFor(s).map((p) => <option key={p.id} value={p.id}>{p.name} · {fmt(p.price)}</option>)}
          </select>
        </label>
      ))}
      <div className={`ppk-verdict ${issues.length ? 'bad' : 'ok'}`}>
        {issues.length ? issues.map((i) => <div key={i}>⚠ {i}</div>) : <div>✔ Everything is compatible.</div>}
        <small>Total {fmt(total)} · about {draw}W · {PARTS.length} parts in the catalog. Buy them on Nile.</small>
      </div>
    </div>
  );
}
