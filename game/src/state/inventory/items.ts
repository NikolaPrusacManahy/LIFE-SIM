import type { Game } from '../Game';
import { ageGate, legalAge, type GateKey } from '../rules/us';
import { settings } from '../settings';
import { fmt } from '../systems/finance';
import { punish, type OffenseKind } from '../systems/trouble';

// Update 0.4 — inventory ("Bag"). Big things (car, laptop, phone) stay as assets.

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  price: number;
  /** sold in the Shop app */
  shop: boolean;
  gate?: GateKey;
  legality: 'legal' | 'underage' | 'illegal';
  consumable: boolean;
  /** units per purchase */
  pack?: number;
  /** gift value (relationship gain) */
  gift?: number;
  romantic?: boolean;
  matureOnly?: boolean;
  /** offence if found in a search */
  offense?: { kind: OffenseKind; sev: number };
  /** Update 0.5 — where it's sold: the Back Room sells `black` items (and pricier unregistered copies) */
  market?: 'shop' | 'hardware' | 'gun' | 'black';
  /** extra legal-purchase check (license, record) */
  check?: (g: Game) => string | null;
}

export const ITEMS: ItemDef[] = [
  { id: 'textbooks', name: 'Textbooks', icon: '📗', desc: 'Studying works better.', price: 40, shop: true, legality: 'legal', consumable: false },
  { id: 'gympass', name: 'Gym Membership', icon: '🎫', desc: 'Gym visits are free.', price: 60, shop: true, legality: 'legal', consumable: false },
  { id: 'flowers', name: 'Flowers', icon: '💐', desc: 'Romantic gift.', price: 25, shop: true, legality: 'legal', consumable: true, gift: 10, romantic: true },
  { id: 'chocolates', name: 'Chocolates', icon: '🍫', desc: 'Sweet gift.', price: 15, shop: true, legality: 'legal', consumable: true, gift: 7 },
  { id: 'teddy', name: 'Teddy Bear', icon: '🧸', desc: 'Cute gift.', price: 30, shop: true, legality: 'legal', consumable: true, gift: 9, romantic: true },
  { id: 'perfume', name: 'Perfume / Cologne', icon: '🌸', desc: 'Attraction up for a month.', price: 70, shop: true, legality: 'legal', consumable: true },
  { id: 'movie_tix', name: 'Movie Tickets', icon: '🎟️', desc: 'Unlocks a movie date.', price: 25, shop: true, legality: 'legal', consumable: true },
  { id: 'concert_tix', name: 'Concert Tickets', icon: '🎫', desc: 'Unlocks a concert date.', price: 90, shop: true, legality: 'legal', consumable: true, gift: 14 },
  { id: 'necklace', name: 'Necklace', icon: '📿', desc: 'Nice jewellery gift.', price: 300, shop: true, legality: 'legal', consumable: true, gift: 16, romantic: true },
  { id: 'watch', name: 'Luxury Watch', icon: '⌚', desc: 'A gift that says a lot.', price: 2500, shop: true, legality: 'legal', consumable: true, gift: 26 },
  { id: 'promise_ring', name: 'Promise Ring', icon: '💍', desc: 'Teen romance gift.', price: 60, shop: true, legality: 'legal', consumable: true, gift: 18, romantic: true },
  { id: 'ring_basic', name: 'Engagement Ring', icon: '💍', desc: 'Required to propose.', price: 1500, shop: true, gate: 'marriage', legality: 'legal', consumable: true },
  { id: 'ring_nice', name: 'Diamond Ring', icon: '💎', desc: 'Better odds, more envy.', price: 6000, shop: true, gate: 'marriage', legality: 'legal', consumable: true },
  { id: 'ring_lux', name: 'Luxury Ring', icon: '👑', desc: 'People will talk.', price: 25000, shop: true, gate: 'marriage', legality: 'legal', consumable: true },
  { id: 'wedding_rings', name: 'Wedding Bands', icon: '💒', desc: 'Needed for the wedding.', price: 800, shop: true, gate: 'marriage', legality: 'legal', consumable: true },
  { id: 'condoms', name: 'Condoms', icon: '🛡️', desc: 'Lowers pregnancy & STI risk.', price: 12, pack: 5, shop: true, gate: 'intimacy', legality: 'legal', consumable: true, matureOnly: true },
  { id: 'preg_test', name: 'Pregnancy Test', icon: '🧪', desc: 'Peace of mind.', price: 15, shop: true, gate: 'intimacy', legality: 'legal', consumable: true, matureOnly: true },
  { id: 'first_aid', name: 'First Aid Kit', icon: '🩹', desc: 'Fixes minor injuries.', price: 25, shop: true, legality: 'legal', consumable: true },
  { id: 'painkillers', name: 'Painkillers', icon: '💊', desc: 'Hangovers, aches.', price: 8, shop: true, legality: 'legal', consumable: true },
  { id: 'vape', name: 'Vape', icon: '💨', desc: 'Nicotine. Age-restricted.', price: 20, shop: true, gate: 'tobacco', legality: 'underage', consumable: true, pack: 3, offense: { kind: 'tobacco', sev: 1 } },
  { id: 'alcohol', name: 'Bottle of Liquor', icon: '🍾', desc: 'Party supplies. Age-restricted.', price: 25, shop: true, gate: 'alcohol', legality: 'underage', consumable: true, offense: { kind: 'alcohol', sev: 1 } },
  { id: 'fakeid', name: 'Fake ID', icon: '🪪', desc: 'Gets under-21s into venues.', price: 0, shop: false, legality: 'illegal', consumable: false, offense: { kind: 'id', sev: 1 } },
  // ---- Update 0.5 — tools & weapons (legal routes) and the Back Room
  { id: 'knife', name: 'Pocket Knife', icon: '🔪', desc: 'Intimidation. Robbery option.', price: 40, shop: true, market: 'hardware', gate: 'lease', legality: 'legal', consumable: false },
  { id: 'combat_knife', name: 'Combat Knife', icon: '🗡️', desc: 'Higher odds. More evidence.', price: 120, shop: true, market: 'hardware', gate: 'lease', legality: 'legal', consumable: false },
  { id: 'crowbar', name: 'Crowbar', icon: '🪛', desc: 'Burglary. Also a weapon.', price: 30, shop: true, market: 'hardware', legality: 'legal', consumable: false },
  { id: 'restraints', name: 'Rope & Zip Ties', icon: '🪢', desc: 'Required for some plans.', price: 25, shop: true, market: 'hardware', gate: 'lease', legality: 'legal', consumable: true },
  { id: 'gloves', name: 'Gloves', icon: '🧤', desc: 'Leaves less trace.', price: 15, shop: true, market: 'shop', legality: 'legal', consumable: false },
  { id: 'mask', name: 'Balaclava', icon: '🥷', desc: 'Witnesses can’t ID you. Suspicious if found.', price: 20, shop: true, market: 'shop', legality: 'legal', consumable: false },
  { id: 'burner', name: 'Burner Phone', icon: '📵', desc: 'Messages leave no digital trail.', price: 60, shop: true, market: 'shop', gate: 'lease', legality: 'legal', consumable: false },
  { id: 'duffel', name: 'Duffel Bag', icon: '👝', desc: 'Carry loot or product.', price: 35, shop: true, market: 'shop', legality: 'legal', consumable: false },
  { id: 'rifle', name: 'Hunting Rifle', icon: '🎯', desc: 'Hunting, home defence.', price: 700, shop: true, market: 'gun', gate: 'gunRifle', legality: 'legal', consumable: false, check: (g) => (!g.flag('gunLicense') ? 'Needs a gun license (police station)' : g.s.crime.record.length ? 'Background check failed' : null) },
  { id: 'pistol', name: 'Pistol', icon: '🔫', desc: 'Huge sentence multiplier if used.', price: 650, shop: true, market: 'gun', gate: 'gunHandgun', legality: 'legal', consumable: false, offense: { kind: 'other', sev: 3 }, check: (g) => (!g.flag('gunLicense') ? 'Needs a gun license (police station)' : g.s.crime.record.length ? 'Background check failed' : null) },
  { id: 'lockpick', name: 'Lockpick Set', icon: '🗝️', desc: 'Burglary odds up.', price: 200, shop: false, market: 'black', legality: 'illegal', consumable: false, offense: { kind: 'theft', sev: 1 } },
  { id: 'sedative', name: '“Dreamline” Sedative', icon: '💉', desc: 'Fictional. Risky. Can go wrong.', price: 900, shop: false, market: 'black', legality: 'illegal', consumable: true, offense: { kind: 'drugs', sev: 2 } },
  { id: 'poison', name: '“Nightshade-7” Vial', icon: '🧪', desc: 'Fictional. Toxicology risk.', price: 2500, shop: false, market: 'black', legality: 'illegal', consumable: true, offense: { kind: 'other', sev: 3 } },
  { id: 'scanner', name: 'Police Scanner', icon: '📻', desc: 'Warns you of raids.', price: 400, shop: false, market: 'black', legality: 'illegal', consumable: false, offense: { kind: 'other', sev: 1 } },
  { id: 'vest', name: 'Bulletproof Vest', icon: '🦺', desc: 'Survive a bad ending.', price: 1500, shop: false, market: 'black', legality: 'legal', consumable: false },
  { id: 'passport', name: 'Fake Passport', icon: '🛂', desc: 'Needed to flee the country.', price: 15000, shop: false, market: 'black', legality: 'illegal', consumable: true, offense: { kind: 'id', sev: 2 } },
  { id: 'stolen', name: 'Stolen Goods', icon: '📦', desc: 'Hot merchandise.', price: 0, shop: false, legality: 'illegal', consumable: true, offense: { kind: 'theft', sev: 2 } },
  { id: 'contraband', name: 'Contraband', icon: '🎒', desc: 'You know what this is.', price: 0, shop: false, legality: 'illegal', consumable: true, offense: { kind: 'drugs', sev: 2 } },
  { id: 'weapon', name: 'Weapon', icon: '🔪', desc: 'A very bad idea.', price: 0, shop: false, legality: 'illegal', consumable: false, offense: { kind: 'other', sev: 3 } },
];
export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const itemCount = (g: Game, id: string) => g.s.inventory[id] ?? 0;
export function addItem(g: Game, id: string, n = 1) {
  g.s.inventory[id] = itemCount(g, id) + n;
}
export function spendItem(g: Game, id: string, n = 1): boolean {
  if (itemCount(g, id) < n) return false;
  g.s.inventory[id] -= n;
  if (g.s.inventory[id] <= 0) delete g.s.inventory[id];
  return true;
}

export function itemLock(g: Game, it: ItemDef): string | null {
  if (it.matureOnly && !settings.mature) return 'Mature Content off';
  if (it.gate) {
    const gate = ageGate(it.gate, g);
    if (!gate.allowed) return gate.reason ?? 'Not allowed';
  }
  return null;
}

/** Update 0.5 — black-market copies skip the paperwork, cost more, and aren't registered. */
export const blackPrice = (it: ItemDef) => Math.round(it.price * (it.market === 'black' ? 1 : 1.6));

export function buyItem(g: Game, id: string, black = false): string {
  const it = ITEM_BY_ID[id];
  if (!it || (!it.shop && !black)) return 'Not for sale.';
  if (black) {
    if (g.age < 18) return 'Must be 18';
    const price = blackPrice(it);
    if (!g.canAfford(price)) return 'Not enough money.';
    g.money(-price);
    addItem(g, id, it.pack ?? 1);
    if (id === 'pistol') g.setFlag('gunDirty');
    return `The guy in the Back Room handed it over. ${fmt(price)}, no questions.`;
  }
  const lock = itemLock(g, it) ?? it.check?.(g) ?? null;
  if (lock) return lock;
  if (id === 'pistol' || id === 'rifle') g.setFlag('gunRegistered');
  if (!g.canAfford(it.price)) return 'Not enough money.';
  g.money(-it.price);
  addItem(g, id, it.pack ?? 1);
  if (id === 'gympass') g.setFlag('gympass');
  return `Bought ${it.name}${it.pack ? ` ×${it.pack}` : ''} for ${fmt(it.price)}.`;
}

/** Items that are illegal for the player to hold right now. */
export function contrabandHeld(g: Game): ItemDef[] {
  return ITEMS.filter((it) => itemCount(g, it.id) > 0 && (it.legality === 'illegal' || (it.legality === 'underage' && g.age < legalAge(g, it.gate ?? 'alcohol')) || (it.id === 'pistol' && (g.flag('gunDirty') || !g.flag('gunRegistered')))));
}

/** A search finds illegal items: confiscate them and apply the age-appropriate consequence. */
export function searchBag(g: Game, by: 'parents' | 'school' | 'police' | 'roommate'): string {
  const found = contrabandHeld(g);
  if (!found.length) return 'Nothing to find. You’re clean.';
  for (const it of found) delete g.s.inventory[it.id];
  const worst = found.reduce((a, b) => ((b.offense?.sev ?? 1) > (a.offense?.sev ?? 1) ? b : a));
  const names = found.map((f) => f.name.toLowerCase()).join(', ');
  if (by === 'roommate') {
    g.karma(-1);
    return `Your roommate found your ${names} and threw it all out. Awkward.`;
  }
  const outcome = punish(g, { name: `Possession: ${worst.name}`, sev: worst.offense?.sev ?? 1, kind: worst.offense?.kind ?? 'other', by: by === 'school' ? 'school' : by });
  return `They found your ${names}. Confiscated. ${outcome}`;
}
