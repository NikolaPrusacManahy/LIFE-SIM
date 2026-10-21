import type { Game } from '../Game';
import { itemCount, spendItem } from '../inventory/items';
import { recomputeWanted } from './investigation';
import { untouchable } from '../systems/immunity';

// Update 0.5 — pursuit mode (fugitive). Wanted ★★★★+ or escaping custody. Surrender is always available.

export const inPursuit = (g: Game) => !!g.s.underworld.pursuit && !g.s.underworld.pursuit.settled;

export function startPursuit(g: Game) {
  const u = g.s.underworld;
  if (untouchable(g) || (u.pursuit && !u.pursuit.settled)) return;
  u.pursuit = { since: g.s.clock, zone: 25 + u.wanted * 8, disguise: 0, settled: false };
  g.s.crime.fugitive = true;
  g.s.location = 'onrun';
  g.banner('🚨 WANTED', 0xff4d6d);
  g.fx({ type: 'police' });
  g.milestone('Went on the run');
}

export function endPursuit(g: Game, settled = false) {
  const u = g.s.underworld;
  if (!u.pursuit) return;
  if (settled) u.pursuit.settled = true;
  else u.pursuit = null;
  g.s.crime.fugitive = false;
  g.s.location = 'home';
}

/** Each slot on the run the police net spreads. */
export function pursuitTick(g: Game) {
  const p = g.s.underworld.pursuit;
  if (!p || p.settled) return;
  p.zone = Math.min(100, p.zone + 6 + g.s.underworld.wanted * 1.5 - p.disguise / 20);
  p.disguise = Math.max(0, p.disguise - 3);
  if (p.zone >= 100 && !g.queued('caught_on_run')) g.queue('caught_on_run', {}, true);
}

/** Recognition chance when you show your face (fame makes it worse). */
export const recognition = (g: Game) => Math.max(0.05, Math.min(0.9, 0.2 + g.s.fame / 150 + g.s.underworld.wanted * 0.06 - (g.s.underworld.pursuit?.disguise ?? 0) / 200));

export function canFleeCountry(g: Game): string | null {
  if (!itemCount(g, 'passport')) return 'Needs a fake passport';
  if (g.s.money + g.s.underworld.dirty < 20000) return 'Needs $20,000';
  if (!g.s.underworld.properties.some((p) => p.kind === 'boat') && g.s.region !== 'city') return 'Needs a boat or the city airport';
  return null;
}

export function fleeCountry(g: Game): string {
  const u = g.s.underworld;
  spendItem(g, 'passport');
  const pay = Math.min(20000, g.s.money);
  g.money(-pay);
  u.dirty = Math.max(0, u.dirty - (20000 - pay));
  for (const c of u.cases) if (c.status === 'open') c.status = 'cold';
  u.fled = true;
  endPursuit(g);
  recomputeWanted(g);
  g.heat(-100);
  g.s.familyName = `${g.s.familyName.charAt(0)}.`;
  g.milestone('Fled the country under a new name');
  return 'A new country. A new language. You can never go home.';
}
