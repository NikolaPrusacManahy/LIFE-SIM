import type { Game } from '../Game';
import type { CrewRole, ProductId } from './types';
import { owns } from './properties';
import { openCase } from './investigation';
import { fmt } from '../systems/finance';
import { hasTrait } from '../npc/traits';
import { isValidCrimeTarget } from './consent';
import type { Person } from '../types';

// Update 0.5 — the business (fictional products, game economy only) and the crew.

export interface ProductDef {
  id: ProductId;
  name: string;
  rep: number;
  margin: number;
  heat: number;
  needsChemist?: boolean;
}

export const PRODUCTS: ProductDef[] = [
  { id: 'green', name: '“Green”', rep: 10, margin: 1800, heat: 2 },
  { id: 'pills', name: '“Pills”', rep: 25, margin: 4500, heat: 4 },
  { id: 'dust', name: '“Dust”', rep: 45, margin: 9000, heat: 7 },
  { id: 'static', name: '“Blue Static”', rep: 70, margin: 20000, heat: 11, needsChemist: true },
];
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<ProductId, ProductDef>;

export const DISTRICTS: Record<'city' | 'country', string[]> = {
  city: ['Southside', 'The Docks', 'Old Town', 'Uptown', 'Campus'],
  country: ['The Backroads', 'Main Street', 'Lakeside'],
};

export const CREW_ROLES: { id: CrewRole; name: string; icon: string; desc: string }[] = [
  { id: 'chemist', name: 'Chemist', icon: '⚗️', desc: 'Quality up; needed for the signature product' },
  { id: 'muscle', name: 'Muscle', icon: '💪', desc: 'Holds territory' },
  { id: 'driver', name: 'Driver', icon: '🚐', desc: 'Moves product, escape routes' },
  { id: 'accountant', name: 'Accountant', icon: '🧮', desc: 'Launders more, leaks less' },
  { id: 'lookout', name: 'Lookout', icon: '👀', desc: 'Warns of raids' },
  { id: 'lawyer', name: 'Lawyer', icon: '⚖️', desc: 'Better odds in court' },
];

export const crew = (g: Game) => g.s.people.filter((p) => p.crewRole && p.alive && p.status === 'alive');
export const hasRole = (g: Game, r: CrewRole) => crew(g).some((p) => p.crewRole === r);

export function productLock(g: Game, id: ProductId): string | null {
  const d = PRODUCT_BY_ID[id];
  if (g.s.stats.street < d.rep) return `Needs Street ${d.rep}`;
  if (d.needsChemist && !hasRole(g, 'chemist')) return 'Needs a chemist on the crew';
  if (id === 'green' ? !(owns(g, 'cabin') || owns(g, 'warehouse')) : !owns(g, 'warehouse')) return id === 'green' ? 'Needs a cabin or warehouse' : 'Needs a warehouse';
  return null;
}

export function startBusiness(g: Game, id: ProductId): string {
  const lock = productLock(g, id);
  if (lock) return lock;
  const u = g.s.underworld;
  u.business = { product: id, stock: 0, quality: 40 + (hasRole(g, 'chemist') ? 30 : 0), territories: [DISTRICTS[g.s.region][0]], lastProfit: 0, months: 0 };
  g.milestone(`Started a ${PRODUCT_BY_ID[id].name} operation`);
  return `The operation is running: ${PRODUCT_BY_ID[id].name}.`;
}

export function expandTerritory(g: Game): string {
  const b = g.s.underworld.business;
  if (!b) return '';
  const next = DISTRICTS[g.s.region].find((d) => !b.territories.includes(d));
  if (!next) return 'You run every district.';
  if (!hasRole(g, 'muscle') && b.territories.length >= 2) return 'You need muscle to hold more ground.';
  b.territories.push(next);
  g.heat(6);
  return `You moved into ${next}.`;
}

/** Turn dirty cash into clean money through a front business. */
export function launder(g: Game): string {
  const u = g.s.underworld;
  if (!owns(g, 'front')) return 'You need a front business.';
  if (u.dirty <= 0) return 'Nothing to launder.';
  const cap = 25000 * (hasRole(g, 'accountant') ? 2 : 1);
  const amt = Math.min(cap, u.dirty);
  u.dirty -= amt;
  const clean = Math.round(amt * (hasRole(g, 'accountant') ? 0.9 : 0.82));
  g.money(clean);
  return `Laundered ${fmt(amt)} → ${fmt(clean)} clean.`;
}

export function drugsMonth(g: Game) {
  const u = g.s.underworld;
  const b = u.business;
  if (!b) return;
  const d = PRODUCT_BY_ID[b.product];
  b.months++;
  const supply = Math.round(d.margin * 0.3);
  if (g.s.money + u.dirty < supply) {
    b.lastProfit = 0;
    return;
  }
  if (u.dirty >= supply) u.dirty -= supply;
  else g.money(-supply);
  const profit = Math.round(d.margin * b.territories.length * (0.5 + b.quality / 100) * (0.8 + Math.random() * 0.4));
  u.dirty += profit;
  b.lastProfit = profit - supply;
  g.heat(d.heat + b.territories.length);
  g.stat('street', 0.5);
  if (b.months % 3 === 0 && !g.s.underworld.cases.some((c) => c.crimeId === 'smuggle' && c.status === 'open') && g.chance(0.3)) openCase(g, 'smuggle', null, undefined, ['money', 'witness']);
  if (!g.queued('drug_event') && g.chance(0.25)) g.queue('drug_event', { kind: g.pick(['rival', 'dealer', 'overdose', 'quality', 'supplier', 'raid', 'cop', 'family', 'cartel']) });
}

/** Recruit an adult NPC into a crew role. */
export function recruit(g: Game, p: Person, role: CrewRole): string {
  if (!isValidCrimeTarget(g, p, true)) return 'Not possible.';
  const o = 0.2 + p.rel / 150 + g.s.stats.street / 200 + (['hustler', 'rebel', 'party'].includes(p.archetype) ? 0.2 : 0);
  if (Math.random() < o) {
    p.crewRole = role;
    p.loyalty = 50 + (hasTrait(p, 'loyal') ? 30 : 0);
    if (!p.labels.includes('coworker')) p.labels.push('coworker');
    return `${p.name} is in. Your new ${role}.`;
  }
  p.rel = Math.max(0, p.rel - 10);
  return `${p.name} wants nothing to do with it.`;
}

export function crewMonth(g: Game) {
  for (const p of crew(g)) {
    g.money(-500);
    p.loyalty = Math.max(0, Math.min(100, (p.loyalty ?? 50) + (hasTrait(p, 'loyal') ? 1 : -1) - (hasTrait(p, 'liar') ? 2 : 0)));
    if ((p.loyalty ?? 50) < 25 && !g.queued('crew_betrayal') && g.chance(0.2)) g.queue('crew_betrayal', { pid: p.id });
  }
}
