import type { Game } from '../Game';
import type { HousingId, Region } from '../types';
import { HOUSING } from '../data/locations';
import { PROGRAM_BY_ID } from '../data/programs';
import { phoneLock } from './phone';

export interface AssetDef {
  id: string;
  name: string;
  icon: string;
  price: number;
  upkeep: number;
  minAge: number;
  desc: string;
  region?: Region;
  mood?: number;
  looks?: number;
  hidden?: boolean;
}

export const ASSETS: AssetDef[] = [
  { id: 'phone', name: 'Smartphone', icon: '📱', price: 350, upkeep: 30, minAge: 12, desc: 'Unlocks the phone menu.' },
  { id: 'laptop', name: 'Laptop', icon: '💻', price: 900, upkeep: 0, minAge: 12, desc: 'Coding, hacking, streaming.' },
  { id: 'guitar', name: 'Electric Guitar', icon: '🎸', price: 350, upkeep: 0, minAge: 10, desc: 'Busking and music careers.' },
  { id: 'bike', name: 'Mountain Bike', icon: '🚲', price: 400, upkeep: 0, minAge: 10, desc: 'Get around. Get fit.' },
  { id: 'car', name: 'Used Sedan', icon: '🚗', price: 6500, upkeep: 180, minAge: 16, desc: 'Freedom on four wheels. Street races.' },
  { id: 'truck', name: 'Pickup Truck', icon: '🛻', price: 18000, upkeep: 220, minAge: 16, desc: 'The country essential.', mood: 1 },
  { id: 'motorbike', name: 'Motorcycle', icon: '🏍️', price: 9000, upkeep: 150, minAge: 16, desc: 'Fast, loud, dangerous.', mood: 1 },
  { id: 'sportscar', name: 'Sports Car', icon: '🏎️', price: 185000, upkeep: 1500, minAge: 18, desc: 'Look at me.', mood: 3, looks: 0.2 },
  { id: 'farm', name: 'Farmland (40 acres)', icon: '🚜', price: 65000, upkeep: 300, minAge: 18, region: 'country', desc: 'Unlocks farming career.' },
  { id: 'boat', name: 'Fishing Boat', icon: '🚤', price: 40000, upkeep: 400, minAge: 18, desc: 'Weekends on the water.', mood: 2 },
  { id: 'yacht', name: 'Superyacht', icon: '🛥️', price: 6500000, upkeep: 40000, minAge: 21, desc: 'You have made it.', mood: 5 },
  { id: 'jet', name: 'Private Jet', icon: '🛩️', price: 22000000, upkeep: 150000, minAge: 25, desc: 'Absurd. Glorious.', mood: 6 },
  { id: 'dog', name: 'Dog', icon: '🐕', price: 0, upkeep: 80, minAge: 0, desc: 'Good boy.', mood: 2, hidden: true },
];
export const ASSET_BY_ID: Record<string, AssetDef> = Object.fromEntries(ASSETS.map((a) => [a.id, a]));

export function netWorth(g: Game) {
  let w = g.s.money - g.s.debt + g.flag('invest');
  for (const a of g.s.assets) w += (ASSET_BY_ID[a]?.price ?? 0) * 0.5;
  const h = HOUSING[g.s.housing];
  if (h.owned && h.price) w += h.price[g.s.region];
  return Math.round(w);
}

export const fmt = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

/** Why an asset can't be bought right now (age, parents), or null. */
export function assetLock(g: Game, id: string): string | null {
  const a = ASSET_BY_ID[id];
  if (!a) return 'Unknown item';
  if (g.age < a.minAge) return `Age ${a.minAge}+`;
  if (id === 'phone') return phoneLock(g);
  if (['car', 'truck', 'motorbike', 'sportscar'].includes(id) && !g.flag('license')) return 'Need a driver’s license';
  return null;
}

export function buyAsset(g: Game, id: string): string {
  const a = ASSET_BY_ID[id];
  if (!a || g.has(id)) return 'You already own that.';
  const lock = assetLock(g, id);
  if (lock) return lock;
  if (!g.canAfford(a.price)) return 'Not enough money.';
  g.money(-a.price);
  g.give(id);
  g.stat('mood', 6);
  g.burst('sparkle');
  if (a.price >= 1000000) g.achieve('baller');
  g.log(`${a.icon} Bought: ${a.name} for ${fmt(a.price)}`, 'money');
  return `You bought a ${a.name}!`;
}

export function sellAsset(g: Game, id: string): string {
  const a = ASSET_BY_ID[id];
  if (!a || !g.has(id) || a.hidden) return 'Nothing to sell.';
  const v = Math.round(a.price * 0.5);
  g.take(id);
  g.money(v);
  g.log(`Sold ${a.name} for ${fmt(v)}`, 'money');
  if (id === 'farm' && g.s.job?.careerId === 'farmer') g.s.job = null;
  return `Sold for ${fmt(v)}.`;
}

export function housingStatus(g: Game, id: HousingId): { ok: boolean; reason?: string; price: number; rent: number } {
  const h = HOUSING[id];
  const price = h.price?.[g.s.region] ?? 0;
  const rent = h.rent[g.s.region];
  if (g.s.housing === id) return { ok: false, reason: 'You live here', price, rent };
  if (id === 'homeless') return { ok: false, reason: '', price, rent };
  if (id === 'parents') {
    const ok = g.parents.some((p) => p.rel >= 35);
    return { ok, reason: ok ? undefined : 'Parents won’t take you back', price, rent };
  }
  if (g.age < 18) return { ok: false, reason: 'Must be 18+', price, rent };
  if ((id === 'farmhouse' || id === 'ranch') && g.s.region !== 'country') return { ok: false, reason: 'Countryside only', price, rent };
  if (id === 'loft' && g.s.region !== 'city') return { ok: false, reason: 'City only', price, rent };
  if (h.owned) {
    if (!g.canAfford(price)) return { ok: false, reason: `Need ${fmt(price)}`, price, rent };
  } else if (!g.canAfford(rent * 2)) return { ok: false, reason: `Need ${fmt(rent * 2)} deposit`, price, rent };
  return { ok: true, price, rent };
}

export function moveInto(g: Game, id: HousingId): string {
  const st = housingStatus(g, id);
  if (!st.ok) return st.reason ?? 'Cannot move there.';
  const h = HOUSING[id];
  const old = HOUSING[g.s.housing];
  if (old.owned && old.price) {
    const sale = Math.round(old.price[g.s.region] * 0.92);
    g.money(sale);
    g.log(`Sold ${old.name} for ${fmt(sale)}`, 'money');
  }
  if (h.owned) g.money(-st.price);
  else if (id !== 'parents') g.money(-st.rent * 2);
  g.s.housing = id;
  g.s.missedRent = 0;
  if (id === 'shared') ensureRoommate(g);
  g.stat('mood', id === 'parents' ? -4 : 8);
  g.burst('confetti');
  if (id === 'mansion') g.achieve('mansion');
  if (id !== 'parents' && !g.flag('movedOut')) {
    g.setFlag('movedOut');
    g.milestone('Moved out on your own');
  }
  g.log(`${h.icon} Moved into: ${h.name}`, 'milestone');
  return `Welcome home: ${h.name}.`;
}

/** Update 0.4 — a shared flat comes with a roommate. */
export function ensureRoommate(g: Game) {
  if (g.s.people.some((p) => p.labels.includes('roommate') && p.status === 'alive')) return;
  const r = g.addPerson('acquaintance', { age: Math.max(18, g.age + g.rand(-2, 4)), rel: 30, met: g.dateLabel, where: 'Your flat' });
  r.labels.push('roommate');
  r.hasNumber = true;
  r.theyHaveNumber = true;
}

export function invest(g: Game, amount: number): string {
  if (amount > 0 && !g.canAfford(amount)) return 'Not enough cash.';
  if (amount < 0 && g.flag('invest') < -amount) amount = -g.flag('invest');
  g.money(-amount);
  g.inc('invest', amount);
  return amount > 0 ? `Invested ${fmt(amount)}.` : `Withdrew ${fmt(-amount)}.`;
}

export function payDebt(g: Game, amount: number): string {
  const a = Math.min(amount, g.s.debt, g.s.money);
  if (a <= 0) return 'Nothing to pay.';
  g.money(-a);
  g.s.debt -= a;
  if (g.s.debt <= 0 && g.flag('hadDebt')) g.achieve('debtfree');
  return `Paid ${fmt(a)} toward debt.`;
}

export function monthlyFinances(g: Game) {
  const s = g.s;
  const lines: string[] = [];
  // ---- investments
  const inv = g.flag('invest');
  if (g.flag('rebound') && s.clock >= g.flag('rebound')) {
    g.setFlag('rebound', 0);
    g.setFlag('invest', Math.round(g.flag('invest') * 1.45));
    lines.push('Markets recovered — your patience paid off');
  }
  if (inv > 0) {
    const r = 0.006 + (Math.random() - 0.5) * 0.09;
    const delta = Math.round(inv * r);
    g.inc('invest', delta);
    if (Math.abs(delta) > 500) lines.push(`Portfolio ${delta >= 0 ? '▲' : '▼'} ${fmt(Math.abs(delta))}`);
  }
  if (g.jailed) return;
  if (g.flag('pension')) g.money(g.flag('pension'));

  // ---- costs
  let cost = 0;
  const h = HOUSING[s.housing];
  const rent = h.rent[s.region];
  cost += rent;
  // Update 0.3 — cooking skill trims the food bill; prescriptions cost monthly
  if (s.housing !== 'parents' && s.housing !== 'homeless') cost += Math.round((s.region === 'city' ? 380 : 260) * (g.flag('cook') >= 10 ? 0.75 : 1));
  if (g.flag('pillUntil') > s.clock) cost += 30;
  if (g.flag('stiTreated')) cost += 120;
  for (const a of s.assets) cost += ASSET_BY_ID[a]?.upkeep ?? 0;
  const kids = g.peopleBy('child').filter((k) => g.ageOf(k) < 18).length;
  cost += kids * 450;
  const e = s.education.current;
  if (e) {
    const p = PROGRAM_BY_ID[e.program];
    const monthly = Math.round(p.tuition / 12);
    if (monthly > 0) {
      if (e.funding === 'cash') cost += monthly;
      if (e.funding === 'loan') { s.debt += monthly; g.setFlag('hadDebt'); }
    }
    if (p.stipend) g.money(p.stipend);
  }
  // ---- allowance
  if (g.livesWithParents && g.age < 22) {
    const par = g.parents;
    const love = par.length ? par.reduce((a, p) => a + p.rel, 0) / par.length : 0;
    const base = s.background === 'rich' ? 450 : s.background === 'middle' ? 80 : 0;
    if (base && love >= 40) g.money(base);
  }
  // ---- debt service
  if (s.debt > 0) {
    s.debt = Math.round(s.debt * 1.007);
    const pay = Math.min(s.debt, Math.max(120, Math.round(s.debt * 0.02)));
    cost += pay;
    s.debt -= pay;
    if (s.debt <= 0) { s.debt = 0; if (g.flag('hadDebt')) g.achieve('debtfree'); }
  }

  if (cost > 0) g.money(-cost);
  if (s.money < 0) {
    const short = -s.money;
    s.debt += short;
    g.setFlag('hadDebt');
    s.money = 0;
    g.stat('mood', -6);
    if (rent > 0 && !h.owned) s.missedRent++;
    lines.push(`Short ${fmt(short)} — it went on credit`);
    if (s.missedRent >= 3 && !h.owned) {
      g.queue('evicted');
      s.missedRent = 0;
    } else if (s.debt > 15000 && g.chance(0.25)) {
      g.queue('debt_collectors');
    }
  } else {
    s.missedRent = 0;
  }
  if (s.debt > 60000 && g.chance(0.05)) g.queue('bankruptcy');
  if (lines.length) g.log(lines.join(' · '), 'money');
}
