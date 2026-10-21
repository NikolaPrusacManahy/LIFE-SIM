import type { Game } from '../Game';
import type { Gender } from '../types';
import { isPublic, spendAction } from '../pc/session';
import { firstName, lastName } from '../data/names';
import { depositUsd, fmtCoins } from '../systems/bitcons';
import { openCase } from '../crime/investigation';

// Update 0.12 final touch — Hackr (crime): fictional leaked accounts. Each one comes with a riddle hint for its
// password; 3 guesses. Crack it to see their profile, and sometimes find a credit card or a Bitcons wallet.
// Needs a VPN (Bitstore). Adults only; the people in the leaks are always adults.

export const VPN_PRICE = 60;
export const HACK_TRIES = 3;
export const LEAKS_PER_MONTH = 4;
export const LOOT_ODDS = { card: 0.35, wallet: 0.12 };
export const HACK_HEAT = { fail: 3, card: 8, wallet: 5 };
/** chance using a stolen card opens a fraud case */
export const CARD_CASE = 0.15;

export interface Leak {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  job: string;
  city: string;
  source: string;
  hint: string;
  answer: string;
  tries: number;
  status: 'open' | 'locked' | 'cracked';
  loot: 'card' | 'wallet' | null;
  /** the loot was used / transferred */
  taken: boolean;
  /** card limit or wallet value, in dollars */
  amount: number;
}

export interface HackState {
  month: number;
  leaks: Leak[];
}

export const blankHack = (): HackState => ({ month: -1, leaks: [] });

export const RIDDLES: [hint: string, answer: string][] = [
  ['Man’s best friend', 'dog'], ['Keeps the doctor away', 'apple'], ['King of the jungle', 'lion'], ['Our closest star', 'sun'],
  ['It purrs on your lap', 'cat'], ['Frozen water', 'ice'], ['The big apple, for short', 'nyc'], ['Opposite of night', 'day'],
  ['Bees make it', 'honey'], ['Monkeys love it', 'banana'], ['A pirate’s treasure', 'gold'], ['Color of the sky', 'blue'],
  ['It says moo', 'cow'], ['Hoots at night', 'owl'], ['Comes after Thursday', 'friday'], ['A rainbow has seven of them', 'colors'],
  ['Cheese on a round crust', 'pizza'], ['The red planet', 'mars'], ['It has a trunk and never forgets', 'elephant'], ['Grows on your head', 'hair'],
  ['Where the fish live', 'sea'], ['First month of the year', 'january'], ['Santa’s favorite reindeer', 'rudolph'], ['Ice cream in a crispy…', 'cone'],
];
const JOBS = ['Accountant', 'Nurse', 'Teacher', 'Sales rep', 'Engineer', 'Barista', 'Lawyer', 'Truck driver', 'Dentist', 'Manager', 'Chef', 'Retired'];
const CITIES = ['Riverton', 'Lakeside', 'Northgate', 'Westbrook', 'Harbor City', 'Oakfield', 'Pine Hollow', 'Maple Ridge'];
const SOURCES = ['FaceSpace leak', 'Old forum dump', 'ShopRight breach', 'Fitness app leak', 'Game account dump'];

export function hackLock(g: Game): string | null {
  if (g.age < 18) return 'Must be 18';
  if (isPublic(g)) return 'Not on a public computer';
  if (!g.s.web.installed.includes('vpn')) return 'Needs a VPN (Bitstore)';
  return null;
}

export function buyVpn(g: Game): string {
  if (isPublic(g)) return 'No downloads on a library PC';
  if (g.s.web.installed.includes('vpn')) return 'Already installed.';
  if (!g.canAfford(VPN_PRICE)) return 'Not enough money';
  g.money(-VPN_PRICE);
  g.s.web.installed.push('vpn');
  return 'GhostTunnel VPN installed. Your address is masked.';
}

/** A fresh batch of leaks each month. */
export function leaksFor(g: Game): Leak[] {
  const h = g.s.hack;
  if (h.month === g.s.clock) return h.leaks;
  h.month = g.s.clock;
  h.leaks = Array.from({ length: LEAKS_PER_MONTH }, (_, i) => {
    const gender: Gender = g.chance(0.5) ? 'male' : 'female';
    const [hint, answer] = g.pick(RIDDLES);
    const r = Math.random();
    const loot = r < LOOT_ODDS.wallet ? 'wallet' : r < LOOT_ODDS.wallet + LOOT_ODDS.card ? 'card' : null;
    return {
      id: `${g.s.clock}-${i}`, name: `${firstName(gender)} ${lastName()}`, gender, age: g.rand(18, 75), job: g.pick(JOBS), city: g.pick(CITIES),
      source: g.pick(SOURCES), hint, answer, tries: HACK_TRIES, status: 'open', loot, taken: false,
      amount: loot === 'wallet' ? g.rand(800, 12000) : loot === 'card' ? g.rand(200, 3000) : 0,
    };
  });
  return h.leaks;
}

export const letters = (l: Leak) => `${l.answer.length} letters`;

/** One guess. The first guess on an account uses a computer action. */
export function guess(g: Game, id: string, word: string): string {
  const l = g.s.hack.leaks.find((x) => x.id === id);
  if (!l || l.status !== 'open' || hackLock(g)) return '';
  if (l.tries === HACK_TRIES && !spendAction(g, `Tried to get into ${l.name}’s account.`)) return 'No actions left this sitting';
  if (word.trim().toLowerCase() === l.answer) {
    l.status = 'cracked';
    g.inc('hacks');
    g.stat('smarts', 1);
    return `Access granted: ${l.name}.${l.loot === 'card' ? ' A saved credit card!' : l.loot === 'wallet' ? ' A Bitcons wallet!' : ''}`;
  }
  l.tries--;
  if (l.tries > 0) return `Wrong password. ${l.tries} ${l.tries === 1 ? 'try' : 'tries'} left.`;
  l.status = 'locked';
  g.heat(HACK_HEAT.fail);
  return 'Account locked. Someone may have noticed.';
}

/** Use a stolen card (crime: money, heat, a chance of a fraud case). */
export function chargeCard(g: Game, id: string): string {
  const l = g.s.hack.leaks.find((x) => x.id === id);
  if (!l || l.status !== 'cracked' || l.loot !== 'card' || l.taken || hackLock(g)) return '';
  l.taken = true;
  g.money(l.amount);
  g.heat(HACK_HEAT.card);
  g.karma(-3);
  if (g.chance(CARD_CASE)) {
    openCase(g, 'fraud', null, undefined, ['digital', 'money']);
    return `Spent $${l.amount.toLocaleString()} on ${l.name}’s card. The bank flagged it — police are looking into it.`;
  }
  return `Spent $${l.amount.toLocaleString()} on ${l.name}’s card. Nobody noticed. Yet.`;
}

/** Move a found wallet into yours. */
export function takeWallet(g: Game, id: string): string {
  const l = g.s.hack.leaks.find((x) => x.id === id);
  if (!l || l.status !== 'cracked' || l.loot !== 'wallet' || l.taken || hackLock(g)) return '';
  l.taken = true;
  const coins = depositUsd(g, l.amount);
  g.heat(HACK_HEAT.wallet);
  g.karma(-3);
  return `Moved ${fmtCoins(coins)} into your wallet.`;
}
