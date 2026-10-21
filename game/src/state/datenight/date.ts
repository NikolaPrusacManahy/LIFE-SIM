import type { Game } from '../Game';
import type { Person } from '../types';
import type { DateVenue, Moment } from './types';
import { DATE_ACTIONS, FRIEND_EXTRA, MOMENT_AT, RESTROOM_LOVE } from './types';
import { SHARED_ACTIONS, VENUES, venueCost, venueLock, type DateAction } from './venues';
import { INTOX_LIMIT } from '../nightlife/types';
import { isRomanceEligible, say } from '../npc/identity';
import { hasTrait } from '../npc/traits';
import { bump } from '../npc/interactions';
import { canBeIntimate, beginNight } from '../systems/intimacy';
import { legalAge } from '../rules/us';
import { itemCount, spendItem } from '../inventory/items';
import { homeBonus } from './venues';
import { quoteFor } from './quotes';
import { startDesire, theyAsk } from './desire';

/** Update 0.11 — a date indoors (yours or theirs) */
export const indoors = (g: Game) => g.s.date?.venue === 'home' || g.s.date?.venue === 'theirs';

// Update 0.10 — dates as a scene. Romantic dates only. Every action moves the spark; moments unlock as it rises.
// HARD RULES: hand-holding is fine for any couple; kisses and intimacy need canBeIntimate (both 18+, Mature on,
// consent possible) and nobody too drunk. Non-explicit, fade to black.

/** Everyone a moment was offered or happened with (tests prove the rules held). */
export const DATE_AUDIT: { moment: Moment; playerAge: number; npcAge: number; intox: number }[] = [];

const ROMANTIC_ROLES = ['crush', 'talking', 'dating', 'partner', 'engaged', 'spouse', 'fling'];
export const isRomanticDate = (g: Game, p: Person) => isRomanceEligible(g, p) && (ROMANTIC_ROLES.includes(p.role) || p.labels.includes('fwb'));
/** Update 0.11 — a friend you could make a move on: same date scene, but harder. */
export const isFriendDate = (g: Game, p: Person) => p.role === 'friend' && !p.labels.includes('fwb') && isRomanceEligible(g, p);
/** Spark needed for a moment on this date (friends need more). */
export const momentAt = (g: Game, m: Moment) => Math.min(95, MOMENT_AT[m] + (g.s.date?.friend ? FRIEND_EXTRA : 0));
const FRIEND_ODDS = 0.1;

export const inDate = (g: Game) => !!g.s.date;
export const date = (g: Game) => g.s.date!;
export const partner = (g: Game) => (g.s.date ? g.personById(g.s.date.pid) : null);

/** Called from the "Go on a date" interaction (which spends the slot). */
export function startDate(g: Game, p: Person, venue: DateVenue): string {
  const friend = !isRomanticDate(g, p);
  if (friend && !isFriendDate(g, p)) return '';
  const lock = venueLock(g, venue);
  if (lock) return lock;
  const v = VENUES[venue];
  if (venue === 'movie' && itemCount(g, 'movie_tix')) spendItem(g, 'movie_tix');
  else if (venue === 'concert' && itemCount(g, 'concert_tix')) spendItem(g, 'concert_tix');
  else if (venueCost(g, venue)) g.money(-venueCost(g, venue));
  // romantic people start warmer; a rocky relationship starts colder; a friend starts from what they feel
  const warm = friend ? Math.min(15, p.attraction / 6) : p.romance / 4;
  const spark = Math.max(0, Math.min(40, Math.round(warm + (hasTrait(p, 'romantic') ? 8 : 0) - (p.rivalry > 30 ? 10 : 0))));
  g.s.date = { pid: p.id, venue, time: DATE_ACTIONS, spark, intox: 0, moments: [], log: [], offer: false, ...(friend ? { friend: true } : {}) };
  return say(friend ? `You meet {name} at the ${v.name.toLowerCase()}. Just friends… for now.` : `You meet {name} at the ${v.name.toLowerCase()}.`, p, g.s.name);
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
  if (d.friend) o -= FRIEND_ODDS;
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
  d.quote = quoteFor(a.id, ok);
  const line = ok ? say(g.pick([`${a.icon} {name} lights up.`, `${a.icon} {name} can’t stop smiling.`, `${a.icon} That went perfectly.`]), p, g.s.name) : say(g.pick([`${a.icon} It fell a little flat.`, `${a.icon} {name} smiles politely.`, `${a.icon} Awkward pause.`]), p, g.s.name);
  tick(g, line);
  // sometimes they're the one who suggests going back to yours
  if (!d.offer && d.spark >= momentAt(g, 'yours') && momentLock(g, 'yours') === null && g.chance((0.25 + (d.venue === 'home' ? homeBonus(g) * 2 : 0)) * (d.friend ? 0.5 : 1))) {
    d.offer = true;
    return `${line} ${say(d.venue === 'home' ? '{name} takes your hand: “Show me the bedroom?”' : d.venue === 'theirs' ? '{name} takes your hand: “Stay the night?”' : '{name} leans in: “Want to get out of here? Your place?”', p, g.s.name)}`;
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
  if (d.spark < momentAt(g, m)) return `Spark ${momentAt(g, m)}`;
  if (m === 'hands') return null;
  // everything past holding hands: adults, Mature Content, consent, nobody too drunk
  if (!canBeIntimate(g, p)) return g.age < 18 || g.ageOf(p) < 18 ? 'Adults only' : 'Not available';
  if (tooDrunk(g)) return 'Too drunk';
  if (m === 'restroom') {
    if (!VENUES[d.venue].restroom) return 'No restroom here';
    if (p.romance < RESTROOM_LOVE) return 'Needs more love';
  }
  if (m === 'spot') {
    if (!VENUES[d.venue].spot) return 'Not at this venue';
    if (p.romance < RESTROOM_LOVE) return 'Needs more love';
  }
  return null;
}

/** Update 0.11 — will a friend kiss you back? */
export const friendKissOdds = (p: Person) => Math.max(0.15, Math.min(0.85, 0.3 + p.attraction / 200 + p.romance / 200));

/** Hold hands, kiss, French kiss — or the ones that end the date. */
export function doMoment(g: Game, m: Moment): string {
  const d = g.s.date;
  const p = partner(g);
  if (!d || !p || momentLock(g, m)) return '';
  // Update 0.11 — making a move on a friend: the first kiss can be turned down
  if (d.friend && m === 'kiss' && !d.moments.includes('kiss') && !g.chance(friendKissOdds(p))) {
    d.spark = Math.max(0, d.spark - 15);
    bump(p, 'rel', -3);
    d.quote = 'Whoa— I thought we were just friends…';
    tick(g, say('💋 You lean in. {name} turns {their} head. Awkward.', p, g.s.name));
    return d.log[d.log.length - 1];
  }
  if (m !== 'hands') DATE_AUDIT.push({ moment: m, playerAge: g.age, npcAge: g.ageOf(p), intox: d.intox });
  if (!d.moments.includes(m)) d.moments.push(m);
  if (m === 'hands' || m === 'kiss' || m === 'french') d.quote = quoteFor(m, true);
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
    // a friend who kisses you back: you're talking now
    if (d.friend && p.role === 'friend') {
      p.role = 'talking';
      d.friend = false;
      g.milestone(`More than friends with ${p.name}`);
    }
    tick(g, say(m === 'kiss' ? '💋 A soft kiss. {name} smiles against your lips.' : '😘 A long, slow kiss. The world goes quiet.', p, g.s.name));
    return d.log[d.log.length - 1];
  }
  // the date ends here — fade to black
  const venue = d.venue;
  endDate(g);
  if (m === 'restroom') {
    const locker = venue === 'gym';
    g.queue('protection_choice', { pid: p.id, place: locker ? 'locker' : 'restroom' }, true);
    return say(locker ? 'You catch {name}’s eye and nod toward the locker room…' : 'You catch {name}’s eye and nod toward the restroom…', p, g.s.name);
  }
  if (m === 'spot') {
    g.queue('protection_choice', { pid: p.id, place: 'theater' }, true);
    return say('The back row is empty. {name} pulls you closer…', p, g.s.name);
  }
  if (venue === 'theirs') return `${say('{name} leads you to {their} bedroom.', p, g.s.name)} ${beginNight(g, p, 'theirs')}`.trim();
  return `${say(venue === 'home' ? 'You lead {name} to the bedroom.' : 'You head back to your place together.', p, g.s.name)} ${beginNight(g, p, 'mine')}`.trim();
}

/** Their "your place?" — yes goes home; no is always fine. */
export function answerOffer(g: Game, yes: boolean): string {
  const d = date(g);
  d.offer = false;
  const q = partner(g);
  // Update 0.11 — they love you this much: they ask where and how
  if (yes && q && indoors(g) && theyAsk(g, q) && momentLock(g, 'yours') === null) {
    const theirs = d.venue === 'theirs';
    DATE_AUDIT.push({ moment: 'yours', playerAge: g.age, npcAge: g.ageOf(q), intox: d.intox });
    endDate(g);
    startDesire(g, q, 'them', theirs);
    return say('{name} doesn’t let go of your hand.', q, g.s.name);
  }
  if (yes) return doMoment(g, 'yours');
  const p = partner(g);
  tick(g, p ? say('“Another time,” you say. {name} nods — no pressure.', p, g.s.name) : '');
  return d.log[d.log.length - 1];
}

/** Update 0.10 — at your place: end with a calm, cozy night (a little extra romance, no intimacy). */
export function calmNight(g: Game): string {
  const d = g.s.date;
  const p = partner(g);
  if (!d || !p || !indoors(g)) return '';
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
