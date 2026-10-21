import type { Game } from '../Game';
import type { Person } from '../types';
import { canBeIntimate } from '../systems/intimacy';

// Update 0.11 — when they love you this much, THEY ask: where, and how. The player only asks with their spouse.
// Every step re-checks canBeIntimate (adults, Mature on, consent possible, not too drunk). Fade to black.

/** Romance at which a partner starts asking. */
export const LOVE_ASK = 80;

export type Spot = 'couch' | 'bed' | 'counter';
export type Style = 'quick' | 'rounds' | 'raw';

export const SPOT_LABEL: Record<Spot, string> = { couch: '🛋️ The couch', bed: '🛏️ The bed', counter: '🍳 The kitchen counter' };
export const SPOT_LINE: Record<Spot, string> = {
  couch: 'On the couch, the movie long forgotten. ',
  bed: 'The bedroom door closes behind you. ',
  counter: 'Right there on the kitchen counter. ',
};
export const STYLE_ASK: Record<Style, string> = {
  quick: '“Just a quick one? 😏”',
  rounds: '“I’m not letting you sleep tonight.” (five rounds)',
  raw: '“Can we skip the condom tonight? Please?”',
};

/** They want you, and they're the one asking. */
export const theyAsk = (g: Game, p: Person) => canBeIntimate(g, p) && p.romance >= LOVE_ASK && g.flag('hadFirstTime') > 0;
/** Only a spouse can be asked by the player. */
export const canAskSpouse = (g: Game, p: Person) => p.role === 'spouse' && canBeIntimate(g, p) && g.flag('hadFirstTime') > 0;

/** Open the where → how → protection chain. `from` = who's asking. */
export function startDesire(g: Game, p: Person, from: 'them' | 'you', theirs = false): boolean {
  if (from === 'them' ? !theyAsk(g, p) : !canAskSpouse(g, p)) return false;
  g.queue('intimacy_where', { pid: p.id, from, theirs: theirs ? 1 : 0 }, true);
  return true;
}

/** What they want tonight (they asked). */
export function rollStyle(): Style {
  const r = Math.random();
  return r < 0.35 ? 'quick' : r < 0.7 ? 'rounds' : 'raw';
}

/** The after-line and the cost of a long night. */
export function styleAfter(g: Game, p: Person | null, style: Style | undefined): string {
  if (!style || !p) return '';
  if (style === 'rounds') {
    g.stat('energy', -20);
    p.romance = Math.min(100, p.romance + 5);
    return ' Five rounds. Neither of you slept.';
  }
  return style === 'quick' ? ' Quick, breathless, grinning.' : '';
}
