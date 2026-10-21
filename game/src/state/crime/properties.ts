import type { Game } from '../Game';
import type { OwnedProperty, PropertyKind } from './types';
import { fmt } from '../systems/finance';
import { newId } from '../Game';

// Update 0.5 — criminal-capable properties (separate from your home). Suspicion invites raids.

export interface PropertyDef {
  kind: PropertyKind;
  name: string;
  icon: string;
  price: number;
  upkeep: number;
  uses: string;
}

export const PROPERTIES: PropertyDef[] = [
  { kind: 'garage', name: 'Garage / Lock-up', icon: '🔧', price: 18000, upkeep: 150, uses: 'Chop shop, hide a car' },
  { kind: 'storage', name: 'Storage Unit', icon: '📦', price: 4000, upkeep: 60, uses: 'Hide stash or evidence' },
  { kind: 'basement', name: 'Basement Conversion', icon: '🚪', price: 25000, upkeep: 100, uses: 'Stash room, panic room, holding' },
  { kind: 'cabin', name: 'Countryside Cabin', icon: '🛖', price: 60000, upkeep: 250, uses: 'Safe house, grow operation' },
  { kind: 'warehouse', name: 'Warehouse', icon: '🏭', price: 150000, upkeep: 900, uses: 'Product, storage, fencing' },
  { kind: 'front', name: 'Front Business (Laundromat)', icon: '🧺', price: 90000, upkeep: 600, uses: 'Launders dirty money' },
  { kind: 'boat', name: 'Boat (Docks)', icon: '🚤', price: 120000, upkeep: 800, uses: 'Smuggling, escape route' },
];
export const PROPERTY_BY_KIND: Record<PropertyKind, PropertyDef> = Object.fromEntries(PROPERTIES.map((p) => [p.kind, p])) as Record<PropertyKind, PropertyDef>;

export const UPGRADES: { id: string; name: string; price: number; desc: string }[] = [
  { id: 'soundproof', name: 'Soundproofing', price: 6000, desc: 'Fewer complaints' },
  { id: 'cameras', name: 'Cameras', price: 4000, desc: 'See raids coming' },
  { id: 'door', name: 'Reinforced Door', price: 5000, desc: 'Slower raids' },
  { id: 'compartment', name: 'Hidden Compartment', price: 7000, desc: 'Searches miss things' },
  { id: 'dog', name: 'Guard Dog', price: 1500, desc: 'Nobody sneaks in' },
  { id: 'lookout', name: 'Lookout Crew', price: 3000, desc: 'Suspicion grows slower' },
];

export const owns = (g: Game, kind: PropertyKind) => g.s.underworld.properties.some((p) => p.kind === kind);

export function buyProperty(g: Game, kind: PropertyKind): string {
  const d = PROPERTY_BY_KIND[kind];
  if (g.age < 18) return 'Must be 18';
  if (owns(g, kind)) return 'You already own one';
  if (!g.canAfford(d.price)) return `Need ${fmt(d.price)}`;
  g.money(-d.price);
  g.s.underworld.properties.push({ id: newId(), kind, suspicion: 0, upgrades: [] });
  g.log(`${d.icon} Bought: ${d.name}`, 'money');
  return `${d.name} is yours.`;
}

export function upgradeProperty(g: Game, p: OwnedProperty, id: string): string {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u || p.upgrades.includes(id)) return '';
  if (!g.canAfford(u.price)) return `Need ${fmt(u.price)}`;
  g.money(-u.price);
  p.upgrades.push(id);
  return `${u.name} installed.`;
}

export function propertiesMonth(g: Game) {
  const u = g.s.underworld;
  for (const p of u.properties) {
    g.money(-PROPERTY_BY_KIND[p.kind].upkeep);
    const busy = (p.kind === 'warehouse' && u.business) || g.s.people.some((x) => x.status === 'captive');
    const grow = busy ? 6 : 1;
    p.suspicion = Math.max(0, Math.min(100, p.suspicion + grow * (p.upgrades.includes('lookout') ? 0.5 : 1) - 2));
    if (p.suspicion >= 70 && !g.queued('raid') && g.chance(0.25 * (p.upgrades.includes('door') ? 0.6 : 1))) g.queue('raid', { propId: p.id });
  }
}
