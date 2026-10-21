import type { Game } from '../Game';
import type { NightNpc } from './types';
import { INTOX_LIMIT } from './types';
import { endNight, night, tick } from './night';
import { current, promote, swapNumbers } from './talk';
import { settings } from '../settings';
import { isRomanceEligible } from '../npc/identity';
import { canBeIntimate, beginNight } from '../systems/intimacy';

// Update 0.8 — "Want to get out of here?" HARD RULES: both 18+, Mature Content on, mutual,
// and NOBODY past the intoxication limit — then it's replaced by responsible options.

/** Every time the option is offered or used (tests prove the rules always held). */
export const LEAVE_AUDIT: { playerAge: number; npcAge: number; playerIntox: number; npcIntox: number }[] = [];

export type LeaveOption = 'leave' | 'cab' | 'swap' | 'walk';

/** Can you even raise it with them right now? (connection + chemistry) */
const mutual = (g: Game, c: NightNpc) => c.conn >= 80 && c.p.attraction >= 40 && isRomanceEligible(g, c.p);

/** The options shown at Connected. 'leave' only when every hard rule holds. */
export function leaveOptions(g: Game, c: NightNpc): LeaveOption[] {
  // a minor who got in on a fake ID gets nothing here with adults — not even numbers
  if (g.age < 18 && g.ageOf(c.p) >= 18) return [];
  if (!mutual(g, c)) return c.conn >= 40 ? ['swap'] : [];
  const n = night(g);
  const sober = n.intox < INTOX_LIMIT && c.intox < INTOX_LIMIT;
  const allowed = g.age >= 18 && g.ageOf(c.p) >= 18 && settings.mature && sober && canBeIntimate(g, c.p);
  if (allowed) {
    LEAVE_AUDIT.push({ playerAge: g.age, npcAge: g.ageOf(c.p), playerIntox: n.intox, npcIntox: c.intox });
    return ['leave', 'swap'];
  }
  // too drunk (either of you) or not 18+: responsible alternatives only
  return ['cab', 'swap', 'walk'];
}

export const LEAVE_LABEL: Record<LeaveOption, string> = {
  leave: '🌙 Want to get out of here?',
  cab: '🚕 Get them a cab ($20)',
  swap: '📱 Swap numbers, text tomorrow',
  walk: '🫶 Walk them back to their friends',
};

export function chooseLeave(g: Game, opt: LeaveOption, where: string): string {
  const c = current(g);
  if (!c || !leaveOptions(g, c).includes(opt)) return '';
  const n = night(g);
  if (opt === 'swap') return swapNumbers(g, where);
  if (opt === 'cab') {
    g.money(-Math.min(20, g.s.money));
    n.spent += 20;
    g.karma(3);
    const p = promote(g, c, where);
    p.hasNumber = true;
    p.theyHaveNumber = true;
    p.trust = Math.min(100, p.trust + 15);
    c.done = true;
    n.talking = null;
    tick(g, `You put ${p.name} in a cab home.`);
    return `You put ${p.name} in a cab and made sure they got home. They texted you a thank-you.`;
  }
  if (opt === 'walk') {
    g.karma(2);
    c.done = true;
    n.talking = null;
    tick(g, `You walked ${c.p.name} back to their friends.`);
    return `You walked ${c.p.name} back to their friends. Good night, good human.`;
  }
  // leave together — re-checked at the moment it happens
  const wasKnown = !!c.known;
  const p = promote(g, c, where);
  if (!canBeIntimate(g, p) || n.intox >= INTOX_LIMIT || c.intox >= INTOX_LIMIT) return '';
  p.hasNumber = true;
  p.theyHaveNumber = true;
  if (!wasKnown) p.role = 'fling';
  n.leftWith = p.id;
  endNight(g);
  return `You and ${p.name} leave together. ${beginNight(g, p)}`.trim();
}
