import type { Game } from '../Game';
import type { Person } from '../types';

// Update 0.13 — who you see on the stage: the people you live with (at home), and contacts who'd be at a place
// (classmates at school, coworkers at work). Pure: the stage view turns them into little figures.

export interface Seen {
  pid: string;
  kind: 'adult' | 'kid';
}

const here = (p: Person) => p.alive && p.status === 'alive';

/** The people you live with. */
export function householdOf(g: Game): Seen[] {
  if (g.s.housing === 'homeless' || g.jailed) return [];
  const seen = (p: Person): Seen => ({ pid: p.id, kind: g.ageOf(p) < 18 ? 'kid' : 'adult' });
  if (g.livesWithParents) return g.s.people.filter((p) => here(p) && ['mother', 'father', 'sibling'].includes(p.role)).map(seen);
  const out = g.s.people.filter((p) => here(p) && (p.role === 'spouse' || p.role === 'engaged' || (p.role === 'child' && g.ageOf(p) < 18) || p.labels.includes('roommate')));
  return out.map(seen);
}

/** Pets at home (the dog asset until the pets system lands). */
export const petsAtHome = (g: Game) => (g.has('dog') ? 1 : 0);

const SCHOOL_LOCS = ['school', 'campus', 'college'];
/** Contacts who'd be around at a place (at most 4). */
export function peopleAt(g: Game, loc: string): Seen[] {
  if (loc === 'home') return [];
  const enrolled = !!g.s.education.current || g.age < 18;
  const match = (p: Person) => {
    if (!here(p) || p.role === 'mother' || p.role === 'father') return false;
    if (SCHOOL_LOCS.includes(loc)) return enrolled && p.labels.includes('classmate');
    if (loc === 'work') return !!g.s.job && p.labels.includes('coworker');
    return false;
  };
  return g.s.people.filter(match).slice(0, 4).map((p) => ({ pid: p.id, kind: g.ageOf(p) < 18 ? 'kid' : 'adult' }));
}
