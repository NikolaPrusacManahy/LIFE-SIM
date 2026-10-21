import type { Game } from '../Game';
import { fmt } from './finance';

// Update 0.2 — the phone: teens need a parent's permission; adults just buy one.

export const PHONE_PRICE = 350;

/** Owned and not currently confiscated. */
export function hasPhone(g: Game) {
  return g.has('phone') && g.flag('phoneTakenUntil') <= g.s.clock;
}

export function phoneConfiscated(g: Game) {
  return g.has('phone') && g.flag('phoneTakenUntil') > g.s.clock;
}

/** Why the player can't buy a phone themselves, or null if they can. */
export function phoneLock(g: Game): string | null {
  if (g.age >= 18 || !g.livesWithParents || g.parents.length === 0) return null;
  return g.flag('phoneAllowed') ? null : 'Ask your parents first';
}

/** Either parent can say yes. Odds rise with the relationship and age; wealthier parents also pay for it. */
export function askForPhone(g: Game): string {
  const parents = [...g.parents].sort(() => Math.random() - 0.5);
  const wealth = g.s.background === 'rich' ? 1.25 : g.s.background === 'middle' ? 1 : 0.7;
  for (const p of parents) {
    const odds = (p.rel / 100) * 0.8 * wealth + (g.age - 14) * 0.08;
    if (Math.random() < odds) {
      g.setFlag('phoneAllowed');
      g.rel(p, 2);
      if (g.s.background === 'poor') return `${p.name} said yes — but you’ll have to buy it yourself (${fmt(PHONE_PRICE)} at the shops).`;
      g.give('phone');
      g.burst('sparkle');
      g.milestone('Got your first phone');
      return `${p.name} said yes and handed you a brand-new phone! 📱`;
    }
  }
  for (const p of parents) g.rel(p, -2);
  return g.pick(['"Not until your grades improve."', '"You’re too young for a phone."', '"We’ll talk about it next year."']);
}

export function confiscatePhone(g: Game, months: number) {
  if (!g.has('phone')) return '';
  g.setFlag('phoneTakenUntil', g.s.clock + months);
  return ` They took your phone for ${months} month${months > 1 ? 's' : ''}.`;
}
