import type { Game } from '../Game';
import type { NightNpc } from './types';
import { INTOX_LIMIT } from './types';
import { endNight, night, tick } from './night';
import { current, promote, swapNumbers } from './talk';
import { settings } from '../settings';
import { isRomanceEligible } from '../npc/identity';
import { canBeIntimate, beginNight } from '../systems/intimacy';
import { pushMsg } from '../phone/convo';
import { setMad } from '../npc/mood';
import { bump } from '../npc/interactions';

// Update 0.9 — reach Flirty, then "Go back to their place?". Two outcomes:
//   • neither of you drunk (sober / tipsy) → their place, condom or not;
//   • either of you drunk → nothing happens, and next morning they're furious over text.
// HARD RULES still hold: both 18+, Mature Content on, and nothing intimate ever happens past INTOX_LIMIT.

/** Every night that actually went to their place (tests prove nobody was drunk or under 18). */
export const LEAVE_AUDIT: { playerAge: number; npcAge: number; playerIntox: number; npcIntox: number }[] = [];

export type LeaveOption = 'leave' | 'swap';

export const FLIRTY = 60;

/** From Flirty: their place (adults, Mature on, someone who could be into you) + swapping numbers. */
export function leaveOptions(g: Game, c: NightNpc): LeaveOption[] {
  // a minor who got in on a fake ID gets nothing here with adults — not even numbers
  if (g.age < 18 && g.ageOf(c.p) >= 18) return [];
  if (c.conn < FLIRTY) return c.conn >= 40 ? ['swap'] : [];
  const can = g.age >= 18 && g.ageOf(c.p) >= 18 && settings.mature && isRomanceEligible(g, c.p);
  return can ? ['leave', 'swap'] : ['swap'];
}

export const LEAVE_LABEL: Record<LeaveOption, string> = {
  leave: '🌙 Go back to their place?',
  swap: '📱 Swap numbers, text tomorrow',
};

const FURIOUS = [
  'what was that last night?? I could barely stand and you tried to take me home. not cool.',
  'I’m so angry right now. you KNEW I was wasted.',
  'never do that again. I was drunk and you knew it.',
];

export const isDrunk = (g: Game, c: NightNpc) => night(g).intox >= INTOX_LIMIT || c.intox >= INTOX_LIMIT;

export function chooseLeave(g: Game, opt: LeaveOption, where: string): string {
  const c = current(g);
  if (!c || !leaveOptions(g, c).includes(opt)) return '';
  if (opt === 'swap') return swapNumbers(g, where);
  const n = night(g);
  const wasKnown = !!c.known;
  const p = promote(g, c, where);
  p.hasNumber = true;
  p.theyHaveNumber = true;
  // drunk → nothing happens; they're furious over text next morning
  if (isDrunk(g, c) || !canBeIntimate(g, p)) {
    c.done = true;
    n.talking = null;
    bump(p, 'rel', -15);
    bump(p, 'romance', -10);
    setMad(g, p, 'tried to take them home drunk');
    pushMsg(g, p.id, { from: p.id, text: g.pick(FURIOUS), turn: g.s.turn + 1, kind: 'furious', free: true });
    tick(g, `${p.name} stumbled off with their friends.`);
    return `${p.name} stumbled off with their friends. Nothing happened — you were way too drunk for that.`;
  }
  LEAVE_AUDIT.push({ playerAge: g.age, npcAge: g.ageOf(p), playerIntox: n.intox, npcIntox: c.intox });
  if (!wasKnown) p.role = 'fling';
  n.leftWith = p.id;
  endNight(g);
  return `You go back to ${p.name}’s place. ${beginNight(g, p, 'theirs')}`.trim();
}
