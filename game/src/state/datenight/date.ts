import type { Game } from '../Game';
import type { Person } from '../types';
import type { DateVenue, Moment } from './types';
import { DATE_ACTIONS, MOMENT_AT, RESTROOM_LOVE } from './types';
import { SHARED_ACTIONS, VENUES, venueLock, type DateAction } from './venues';
import { INTOX_LIMIT } from '../nightlife/types';
import { isRomanceEligible, say } from '../npc/identity';
import { hasTrait } from '../npc/traits';
import { bump } from '../npc/interactions';
import { canBeIntimate, beginNight } from '../systems/intimacy';
import { legalAge } from '../rules/us';
import { itemCount, spendItem } from '../inventory/items';
import { homeBonus } from './venues';

// Update 0.10 — dates as a scene. Romantic dates only. Every action moves the spark; moments unlock as it rises.
// HARD RULES: hand-holding is fine for any couple; kisses and intimacy need canBeIntimate (both 18+, Mature on,
// consent possible) and nobody too drunk. Non-explicit, fade to black.

/** Everyone a moment was offered or happened with (tests prove the rules held). */
export const DATE_AUDIT: { moment: Moment; playerAge: number; npcAge: number; intox: number }[] = [];

const ROMANTIC_ROLES = ['crush', 'talking', 'dating', 'partner', 'engaged', 'spouse', 'fling'];
export const isRomanticDate = (g: Game, p: Person) => isRomanceEligible(g, p) && (ROMANTIC_ROLES.includes(p.role) || p.labels.includes('fwb'));

export const inDate = (g: Game) => !!g.s.date;
export const date = (g: Game) => g.s.date!;
export const partner = (g: Game) => (g.s.date ? g.personById(g.s.date.pid) : null);

/** Called from the "Go on a date" interaction (which spends the slot). */
export function startDate(g: Game, p: Person, venue: DateVenue): string {
  if (!isRomanticDate(g, p)) return '';
  const lock = venueLock(g, venue);
  if (lock) return lock;
  const v = VENUES[venue];
  if (venue === 'movie' && itemCount(g, 'movie_tix')) spendItem(g, 'movie_tix');
  else if (venue === 'concert' && itemCount(g, 'concert_tix')) spendItem(g, 'concert_tix');
  else if (v.cost) g.money(-v.cost);
  // romantic people start warmer; a rocky relationship starts colder
  const spark = Math.max(0, Math.min(40, Math.round(p.romance / 4 + (hasTrait(p, 'romantic') ? 8 : 0) - (p.rivalry > 30 ? 10 : 0))));
  g.s.date = { pid: p.id, venue, time: DATE_ACTIONS, spark, intox: 0, moments: [], log: [], offer: false };
  return say(`You meet {name} at the ${v.name.toLowerCase()}.`, p, g.s.name);
}

export const actionsFor = (g: Game): DateAction[] => [...VENUES[date(g).venue].actions, ...SHARED_ACTIONS];

export function actionLock(g: Game, a: DateAction): string | null {
  const d = date(g);
  if (d.time <= 0) return 'The date is winding down';
  if (a.drink && g.age < legalAge(g, 'alcohol')) return `Must be ${legalAge(g, 'alcohol')}`;
  if (a.cost && !g.canAfford(a.cost)) return `Need $${a.cost}`;
  return null;
}

export function oddsOf(g: Game, a: DateAction): number {
  const p = partner(g)!;
  const d = date(g);
  let o = a.odds + (a.stat ? (g.s.stats[a.stat] - 50) / 200 : 0) + (p.romance - 50) / 300 + (p.mood - 50) / 400;
  if (hasTrait(p, 'romantic')) o += 0.08;
  if (hasTrait(p, 'funny') && a.id === 'joke') o += 0.15;
  if (hasTrait(p, 'cheap') && a.cost) o -= 0.2;
  if (d.intox > 50) o -= (d.intox - 50) / 150;
  if (d.venue === 'home') o += homeBonus(g);
  return Math.max(0.05, Math.min(0.95, o));
}

function tick(g: Game, line: string) {
  const d = date(g);
  d.time = Math.max(0, d.time - 1);
  d.log.push(line);
}

/** Do something on the date. */
export function dateAct(g: Game, id: string): string {
  const d = g.s.date;
  const p = partner(g);
  const a = d && actionsFor(g).find((x) => x.id === id);
  if (!d || !p || !a || actionLock(g, a)) return '';
  if (a.cost) g.money(-a.cost);
  if (a.drink) d.intox = Math.min(100, d.intox + a.drink);
  const ok = Math.random() < oddsOf(g, a);
  d.spark = Math.max(0, Math.min(100, d.spark + (ok ? a.gain : -5)));
  const line = ok ? say(g.pick([`${a.icon} {name} lights up.`, `${a.icon} {name} can’t stop smiling.`, `${a.icon} That went perfectly.`]), p, g.s.name) : say(g.pick([`${a.icon} It fell a little flat.`, `${a.icon} {name} smiles politely.`, `${a.icon} Awkward pause.`]), p, g.s.name);
  tick(g, line);
  // sometimes they're the one who suggests going back to yours
  if (!d.offer && d.spark >= MOMENT_AT.yours && momentLock(g, 'yours') === null && g.chance(0.25 + (d.venue === 'home' ? homeBonus(g) * 2 : 0))) {
    d.offer = true;
    return `${line} ${say(d.venue === 'home' ? '{name} takes your hand: “Show me the bedroom?”' : '{name} leans in: “Want to get out of here? Your place?”', p, g.s.name)}`;
  }
  return line;
}

export const tooDrunk = (g: Game) => date(g).intox >= INTOX_LIMIT;

/** Why a moment isn't possible right now (null = go ahead). */
export function momentLock(g: Game, m: Moment): string | null {
  const d = date(g);
  const p = partner(g);
  if (!p) return 'Not here';
  if (d.moments.includes(m) && m !== 'kiss' && m !== 'french') return 'Done';
  if (d.spark < MOMENT_AT[m]) return `Spark ${MOMENT_AT[m]}`;
  if (m === 'hands') return null;
  // everything past holding hands: adults, Mature Content, consent, nobody too drunk
  if (!canBeIntimate(g, p)) return g.age < 18 || g.ageOf(p) < 18 ? 'Adults only' : 'Not available';
  if (tooDrunk(g)) return 'Too drunk';
  if (m === 'restroom') {
    if (!VENUES[d.venue].restroom) return 'No restroom here';
    if (p.romance < RESTROOM_LOVE) return 'Needs more love';
  }
  return null;
}

/** Hold hands, kiss, French kiss — or the two that end the date. */
export function doMoment(g: Game, m: Moment): string {
  const d = g.s.date;
  const p = partner(g);
  if (!d || !p || momentLock(g, m)) return '';
  if (m !== 'hands') DATE_AUDIT.push({ moment: m, playerAge: g.age, npcAge: g.ageOf(p), intox: d.intox });
  if (!d.moments.includes(m)) d.moments.push(m);
  if (m === 'hands') {
    bump(p, 'romance', 3);
    d.spark = Math.min(100, d.spark + 5);
    tick(g, say('🤝 You take {name}’s hand. {They} squeeze{s} back.', p, g.s.name));
    return d.log[d.log.length - 1];
  }
  if (m === 'kiss' || m === 'french') {
    bump(p, 'romance', m === 'kiss' ? 4 : 6);
    d.spark = Math.min(100, d.spark + (m === 'kiss' ? 6 : 8));
    g.burst('hearts');
    tick(g, say(m === 'kiss' ? '💋 A soft kiss. {name} smiles against your lips.' : '😘 A long, slow kiss. The world goes quiet.', p, g.s.name));
    return d.log[d.log.length - 1];
  }
  // the date ends here — fade to black
  const restroom = m === 'restroom';
  endDate(g);
  if (restroom) {
    g.queue('protection_choice', { pid: p.id, place: 'restroom' }, true);
    return say('You catch {name}’s eye and nod toward the restroom…', p, g.s.name);
  }
  return `${say(d.venue === 'home' ? 'You lead {name} to the bedroom.' : 'You head back to your place together.', p, g.s.name)} ${beginNight(g, p, 'mine')}`.trim();
}

/** Their "your place?" — yes goes home; no is always fine. */
export function answerOffer(g: Game, yes: boolean): string {
  const d = date(g);
  d.offer = false;
  if (yes) return doMoment(g, 'yours');
  const p = partner(g);
  tick(g, p ? say('“Another time,” you say. {name} nods — no pressure.', p, g.s.name) : '');
  return d.log[d.log.length - 1];
}

/** Update 0.10 — at your place: end with a calm, cozy night (a little extra romance, no intimacy). */
export function calmNight(g: Game): string {
  const d = g.s.date;
  const p = partner(g);
  if (!d || !p || d.venue !== 'home') return '';
  bump(p, 'romance', 4 + Math.round(d.spark / 20));
  bump(p, 'trust', 3);
  g.stat('mood', 4);
  const text = endDate(g);
  return `${say('🛋️ A calm night in. {name} fell asleep on your shoulder halfway through the movie.', p, g.s.name)} ${text}`;
}

/** The date is over: how well it went shows in the relationship. */
export function endDate(g: Game): string {
  const d = g.s.date;
  if (!d) return '';
  g.s.date = null;
  const p = g.personById(d.pid);
  if (!p) return '';
  bump(p, 'romance', Math.round(d.spark / 8));
  bump(p, 'rel', Math.round(d.spark / 12));
  p.lastContact = g.s.clock;
  g.stat('mood', Math.round(d.spark / 10));
  if (d.intox >= 30) g.setFlag('drunkTurn', g.s.turn);
  const verdict = d.spark >= 70 ? 'An amazing date.' : d.spark >= 40 ? 'A really nice date.' : d.spark >= 20 ? 'A pleasant enough date.' : 'An awkward date.';
  return say(`${verdict} {name} ${d.spark >= 40 ? 'texted you before you even got home.' : 'said goodnight.'}`, p, g.s.name);
}
