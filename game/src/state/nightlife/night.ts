import type { Game } from '../Game';
import type { NightNpc, Venue, VenueType, Vibe, Zone } from './types';
import { INTOX_LIMIT, NIGHT_ACTIONS } from './types';
import { makeNpc } from '../npc/generator';
import { newId } from '../Game';
import { legalAge } from '../rules/us';
import { consume } from '../systems/addiction';
import { underageCatch } from '../systems/trouble';

// Update 0.8 — a night out at a bar, club or roadhouse. One time slot, ~12 actions until closing.
// Ages follow this life's laws: bars/clubs = drinking age (US 21 / EU 18); 18+ nights let 18+ in with a wristband.

const ROTATION: Record<Venue, VenueType[]> = {
  bar: ['dive', 'pub', 'karaoke', 'trivia'],
  club: ['techno', 'eighteen', 'gay', 'rooftop'],
  roadhouse: ['country'],
};

/** What's on tonight (stable for the month). */
export function venueType(g: Game, v: Venue): VenueType {
  const list = ROTATION[v];
  return list[(g.s.clock + v.length) % list.length];
}

/** Youngest person through the door tonight. */
export const minAgeFor = (g: Game, t: VenueType) => (t === 'eighteen' ? 18 : Math.max(18, legalAge(g, 'alcohol')));

const ZONES: Zone[] = ['bar', 'dance', 'booths', 'smoking', 'restrooms'];
const VIBES: Vibe[] = ['fun', 'fun', 'friends', 'looking', 'looking', 'alone'];

/** 15–25 people for the night, all at least `minAge`. */
export function makeCrowd(g: Game, t: VenueType, minAge: number): NightNpc[] {
  const n = g.rand(15, 25);
  const out: NightNpc[] = [];
  const top = t === 'eighteen' ? 26 : t === 'country' ? 60 : 45;
  for (let i = 0; i < n; i++) {
    const age = g.rand(minAge, Math.max(minAge + 2, top));
    const p = makeNpc(newId(), { role: 'acquaintance', age, clock: g.s.clock, met: 'A night out', where: g.s.region === 'city' ? 'downtown' : 'the roadhouse' });
    if (t === 'gay') p.sexuality = g.pick(['gay', 'gay', 'bi', 'pan']);
    out.push({ p, vibe: g.pick(VIBES), zone: i < 2 && t !== 'eighteen' ? 'vip' : g.pick(ZONES), intox: g.rand(0, 55), conn: 0, done: false });
  }
  // an ex or a rival might be here too (only adults who could be here)
  const known = g.s.people.find((p) => p.alive && p.status === 'alive' && (p.role === 'ex' || p.rivalry >= 50) && g.ageOf(p) >= minAge);
  if (known && g.chance(0.25)) out.push({ p: known, vibe: 'fun', zone: g.pick(ZONES), intox: g.rand(10, 50), conn: 30, done: false, known: true });
  return out;
}

export function startNight(g: Game, venue: Venue): string {
  const type = venueType(g, venue);
  const minAge = minAgeFor(g, type);
  const wristband = g.age < legalAge(g, 'alcohol');
  g.s.night = { venue, type, minAge, wristband, time: NIGHT_ACTIONS, intox: 0, confidence: 40 + g.s.stats.charm / 5, spent: 0, zone: 'bar', vip: false, crowd: makeCrowd(g, type, minAge), talking: null, log: [], incident: null, startPhase: g.phase };
  return wristband && type === 'eighteen' ? 'You got a wristband at the door — no drinks for you tonight.' : 'The music hits you at the door.';
}

export const inNight = (g: Game) => !!g.s.night;
export const night = (g: Game) => g.s.night!;

/** Spend one of the night's actions. */
export function tick(g: Game, line: string) {
  const n = g.s.night;
  if (!n) return;
  n.time = Math.max(0, n.time - 1);
  if (line) n.log.push(line);
  // the crowd keeps drinking
  for (const c of n.crowd) c.intox = Math.min(100, c.intox + (Math.random() < 0.3 ? 6 : 0));
}

export const DRINKS: { id: string; name: string; icon: string; price: number; alc: number }[] = [
  { id: 'water', name: 'Water', icon: '💧', price: 0, alc: -8 },
  { id: 'soda', name: 'Mocktail', icon: '🧃', price: 6, alc: 0 },
  { id: 'beer', name: 'Beer', icon: '🍺', price: 7, alc: 12 },
  { id: 'wine', name: 'Wine', icon: '🍷', price: 10, alc: 14 },
  { id: 'cocktail', name: 'Cocktail', icon: '🍹', price: 14, alc: 18 },
  { id: 'shot', name: 'Shot', icon: '🥃', price: 6, alc: 22 },
];

export function drinkLock(g: Game, id: string): string | null {
  const n = g.s.night;
  const d = DRINKS.find((x) => x.id === id);
  if (!n || !d) return 'Not here';
  if (d.alc > 0 && n.wristband && n.type === 'eighteen') return 'Wristband — no alcohol';
  if (!g.canAfford(d.price)) return `Need $${d.price}`;
  return null;
}

export function orderDrink(g: Game, id: string): string {
  const n = night(g);
  const d = DRINKS.find((x) => x.id === id)!;
  if (drinkLock(g, id)) return '';
  g.money(-d.price);
  n.spent += d.price;
  if (d.alc > 0) {
    // underage with a fake ID: the bartender might look twice
    if (n.wristband && underageCatch(g, 0.06, { name: 'Underage drinking', sev: 1, kind: 'alcohol', by: 'security' })) {
      endNight(g);
      return 'The bartender looked at your ID twice. You’re out.';
    }
    consume(g, 'alcohol', d.alc / 6);
  }
  n.intox = Math.max(0, Math.min(100, n.intox + d.alc));
  n.confidence = Math.min(100, n.confidence + (d.alc > 0 ? 6 : 0));
  const line = d.alc > 0 ? (n.intox >= INTOX_LIMIT ? `${d.icon} The room is spinning a little.` : `${d.icon} ${d.name}. Confidence +.`) : `${d.icon} ${d.name}. Good call.`;
  tick(g, line);
  return line;
}

/** Very drunk people you met stay unable to consent for two slots, then sober up. */
export function soberUp(g: Game) {
  for (const p of g.s.people) {
    const t = p.tags.find((x) => x.startsWith('soberAt:'));
    if (t && Number(t.slice(8)) <= g.s.turn) p.tags = p.tags.filter((x) => x !== 'intox:very' && !x.startsWith('soberAt:'));
  }
}

/** Your judgement at this intoxication: chip odds penalty. */
export const judgement = (g: Game) => (g.s.night && g.s.night.intox > 50 ? (g.s.night.intox - 50) / 120 : 0);

/** Closing time or you head out. Returns the summary line. */
export function endNight(g: Game): string {
  const n = g.s.night;
  if (!n) return '';
  g.s.night = null;
  // Update 0.8 — a night that ran into the morning: you slept it off (half energy if you got drunk)
  if (n.startPhase === 'night' || n.startPhase === 'evening' && g.phase === 'morning') {
    const target = Math.round(g.maxOf('energy') * (n.intox >= 50 ? 0.5 : 1));
    g.stat('energy', target - g.s.stats.energy);
  }
  // what tomorrow remembers
  g.setFlag('lastNightIntox', n.intox);
  g.setFlag('lastNightSpent', n.spent);
  g.setFlag('lastNightTurn', g.s.turn);
  g.setFlag('intox', n.intox);
  g.setFlag('intoxTurn', g.s.turn);
  if (n.intox >= 30) g.setFlag('drunkTurn', g.s.turn);
  if (!n.leftWith) g.queue('night_home', { intox: n.intox }, true);
  const best = n.log.slice(-3).join(' ');
  return `${best}${n.spent ? ` You spent $${n.spent}.` : ''}`;
}
