import type { Game } from '../Game';
import type { Person } from '../types';

// Update 0.8 — an NPC's current attitude toward you, so replies make sense ("still mad about yesterday").

export type NpcMood = 'ok' | 'mad' | 'busy';
export interface NpcState {
  mood: NpcMood;
  reason: string | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Something you did upset them; they stay cold for `months` (default: the rest of this month and next). */
export function setMad(g: Game, p: Person, why: string, months = 1) {
  g.s.flags[`mad:${p.id}`] = g.s.clock + months;
  // reason lives in a tag so it never shows up as a memory
  p.tags = p.tags.filter((t) => !t.startsWith('madWhy:'));
  p.tags.push(`madWhy:${g.s.clock}:${why}`);
}

export function clearMad(g: Game, p: Person) {
  g.s.flags[`mad:${p.id}`] = 0;
}

/** Busy at work or school during the day — they answer next slot (stable per person and slot). */
export function isBusy(g: Game, p: Person) {
  if (g.phase !== 'morning' && g.phase !== 'afternoon') return false;
  let h = g.s.turn;
  for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) >>> 0;
  return h % 10 < 3;
}

export function npcState(g: Game, p: Person): NpcState {
  if (g.flag(`mad:${p.id}`) > g.s.clock) {
    const t = p.tags.find((x) => x.startsWith('madWhy:'));
    if (!t) return { mood: 'mad', reason: 'something you did' };
    const [, clock, ...why] = t.split(':');
    return { mood: 'mad', reason: `${why.join(':')}, ${MONTHS[Number(clock) % 12]}` };
  }
  if (isBusy(g, p)) return { mood: 'busy', reason: g.ageOf(p) < 18 ? 'in class' : 'at work' };
  return { mood: 'ok', reason: null };
}

export const stateLabel = (s: NpcState) => (s.mood === 'mad' ? `😠 Upset with you (${s.reason})` : s.mood === 'busy' ? `💼 Busy — ${s.reason}` : null);
