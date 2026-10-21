import type { Game } from '../Game';
import type { ItemDef } from '../inventory/items';
import { ITEMS, ITEM_BY_ID, addItem, blackPrice, itemLock } from '../inventory/items';
import { darkCrimeOn } from '../crime/consent';
import { pushNote } from '../phone/notify';
import { newId } from '../Game';
import { riskCatch } from '../systems/trouble';

// Update 0.8 — Nile (online shop, incl. PC parts) and Onionmarket (the 0.5 Back Room, online).
// Orders arrive in 1–2 slots; porch theft, wrong items and damaged parts happen.

export const EXPRESS_FEE = 15;
const DARK = new Set(['sedative', 'poison', 'pistol']);

/** Everything Nile sells: normal shop items (age-gated as usual) + PC parts. */
export const nileItems = (): ItemDef[] => ITEMS.filter((it) => (it.shop && it.market !== 'gun' && it.legality !== 'illegal') || it.market === 'nile');
/** Onionmarket stock mirrors the Back Room. */
export const onionItems = (): ItemDef[] => ITEMS.filter((it) => (it.market === 'black' || it.market === 'gun' || it.id === 'combat_knife') && (!DARK.has(it.id) || darkCrimeOn()));
/** Crypto: +5% over Back Room prices. */
export const onionPrice = (it: ItemDef) => Math.round(blackPrice(it) * 1.05);

export function onionLock(g: Game): string | null {
  if (g.age < 18) return 'Must be 18';
  if (!g.s.web.installed.includes('tor')) return 'Needs the Tor-ish browser (Files)';
  if (g.s.stats.street < 15) return 'Needs Street 15 to find the link';
  if (g.s.session?.device === 'library') return 'Not on a library PC';
  return null;
}

export function order(g: Game, itemId: string, express = false, dark = false): string {
  const it = ITEM_BY_ID[itemId];
  if (!it) return '';
  if (dark) {
    const lock = onionLock(g);
    if (lock) return lock;
  } else {
    if (!nileItems().includes(it)) return 'Not sold on Nile.';
    const lock = itemLock(g, it);
    if (lock) return lock;
  }
  const price = (dark ? onionPrice(it) : it.price) + (express ? EXPRESS_FEE : 0);
  if (!g.canAfford(price)) return 'Not enough money.';
  g.money(-price);
  g.s.orders.push({ id: newId(), item: itemId, price, arrive: g.s.turn + (express ? 1 : 2), express, status: 'transit', dark });
  if (g.s.orders.length > 40) g.s.orders.splice(0, g.s.orders.length - 40);
  return `${dark ? '🧅' : '📦'} Ordered ${it.name} — arrives ${express ? 'next slot' : 'in 2 slots'}.`;
}

/** Check out a whole cart in one go (one session action). Stops at the first problem. */
export function checkout(g: Game, ids: string[], express = false, dark = false): string {
  const lines: string[] = [];
  for (const id of ids) {
    const r = order(g, id, express, dark);
    if (!r.startsWith('📦') && !r.startsWith('🧅')) return lines.length ? `${lines.length} ordered. Then: ${r}` : r;
    lines.push(r);
  }
  return ids.length === 1 ? lines[0] : `${dark ? '🧅' : '📦'} Ordered ${ids.length} items — arriving ${express ? 'next slot' : 'in 2 slots'}.`;
}

/** Each slot: deliveries land (or don't). */
export function deliveriesTick(g: Game) {
  for (const o of g.s.orders) {
    if (o.status !== 'transit' || o.arrive > g.s.turn) continue;
    const it = ITEM_BY_ID[o.item];
    const r = Math.random();
    if (o.dark) {
      if (r < 0.08) { o.status = 'stolen'; pushNote(g, 'news', `🧅 Your Onionmarket vendor vanished with your coins (${it.name}).`, undefined, '🧅'); continue; }
      if (r < 0.11) {
        o.status = 'seized';
        pushNote(g, 'news', `🚨 Your package was intercepted.`, undefined, '🚨');
        riskCatch(g, 1, { name: 'Darknet purchase', sev: 2, kind: 'other', by: 'police' });
        continue;
      }
    } else {
      if (r < 0.06) { o.status = 'stolen'; pushNote(g, 'news', `📦 Your ${it.name} was stolen from the porch.`, undefined, '📦'); continue; }
      if (r < 0.11) { o.status = 'wrong'; pushNote(g, 'news', `📦 Wrong item! You got a box of rubber ducks instead of ${it.name}. Return it on Nile.`, undefined, '🦆'); continue; }
      if (r < 0.15 && it.market === 'nile') { o.status = 'damaged'; pushNote(g, 'news', `📦 Your ${it.name} arrived damaged. Return it on Nile.`, undefined, '💔'); continue; }
    }
    o.status = 'delivered';
    addItem(g, o.item, it.pack ?? 1);
    pushNote(g, 'news', `${o.dark ? '🧅' : '📦'} Delivered: ${it.name}`, undefined, '📦');
  }
}

/** Returns for wrong / damaged items: a refund (or a replacement for parts). */
export function returnOrder(g: Game, id: string): string {
  const o = g.s.orders.find((x) => x.id === id);
  if (!o || (o.status !== 'wrong' && o.status !== 'damaged')) return '';
  o.status = 'returned';
  g.money(o.price);
  return `Return accepted — $${o.price} refunded.`;
}

export const returnable = (g: Game) => g.s.orders.filter((o) => o.status === 'wrong' || o.status === 'damaged');
export const inTransit = (g: Game) => g.s.orders.filter((o) => o.status === 'transit');
