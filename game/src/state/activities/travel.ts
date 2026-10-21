import type { Game } from '../Game';
import type { Region } from '../types';
import { HOUSING } from '../data/locations';
import { CAREER_BY_ID } from '../data/careers';
import { fmt } from '../systems/finance';
import { type ActivityDef } from './types';

export function relocate(g: Game, to: Region): string {
  const s = g.s;
  const h = HOUSING[s.housing];
  if (h.owned && h.price) {
    const sale = Math.round(h.price[s.region] * 0.92);
    g.money(sale);
    g.log(`Sold ${h.name} for ${fmt(sale)}`, 'money');
  }
  s.region = to;
  s.housing = 'shared';
  s.location = 'home';
  if (s.job) {
    const c = CAREER_BY_ID[s.job.careerId];
    if (c.region && c.region !== to) {
      g.log(`You left your job at ${c.place}.`, 'work');
      s.job = null;
    }
  }
  if (to === 'city' && s.hometown === 'country') g.achieve('citymouse');
  if (to === 'country' && s.hometown === 'city') g.achieve('countrymouse');
  g.setFlag('movedOut');
  g.burst('confetti');
  g.milestone(`Moved to the ${to === 'city' ? 'city' : 'countryside'}`);
  return to === 'city' ? 'The skyline glitters ahead. A new life in the city begins.' : 'Open skies and dirt roads. A new life in the countryside begins.';
}

export const TRAVEL_ACTS: ActivityDef[] = [
  {
    id: 'move_city', loc: 'station', name: 'Move to the City', icon: '🏙️', desc: 'Big dreams, big rent.', cat: 'travel', energy: 20, cost: 1200, region: 'country', minAge: 18,
    run: (g) => relocate(g, 'city'),
  },
  {
    id: 'move_country', loc: 'station', name: 'Move to the Countryside', icon: '🌾', desc: 'Slow down. Breathe.', cat: 'travel', energy: 20, cost: 800, region: 'city', minAge: 18,
    run: (g) => relocate(g, 'country'),
  },
  {
    id: 'getaway', loc: 'station', name: 'Weekend Getaway', icon: '🧳', desc: 'Mood way up.', cat: 'travel', energy: 10, cost: 600, minAge: 16, cooldown: 12,
    run: (g) => {
      g.stat('mood', 20);
      g.stat('energy', 15);
      g.burst('sparkle');
      const p = g.partner;
      if (p) g.rel(p, 8);
      return g.pick(['A beach town with perfect sunsets.', 'A mountain cabin with no Wi-Fi.', 'A city you’ve never seen. You walked everywhere.']) + (p ? ` ${p.name} came along.` : '');
    },
  },
];
