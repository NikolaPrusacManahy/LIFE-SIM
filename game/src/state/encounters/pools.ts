import type { Game } from '../Game';
import type { Archetype, Person } from '../types';
import { LOC_BY_ID } from '../data/locations';
import { addLabel } from '../npc/labels';

// Update 0.4 — random encounters: who you can meet depends on the place and on your age.

interface Pool {
  /** NPC age range for this place (given the player's age) */
  ages: (g: Game) => [number, number];
  contexts: string[];
  bias?: Archetype[];
  label?: 'classmate' | 'coworker';
  minPlayerAge?: number;
}

const peers = (g: Game): [number, number] => [Math.max(14, g.age - 1), Math.min(18, g.age + 1)];
const mixed = (g: Game): [number, number] => (g.age < 18 ? [14, 70] : [18, 75]);

export const POOLS: Record<string, Pool> = {
  school: { ages: peers, contexts: ['Hallway', 'Lunch', 'Class', 'Gym class', 'After-school club'], label: 'classmate' },
  campus: { ages: () => [18, 24], contexts: ['Lecture hall', 'Dorm lounge', 'Campus quad', 'Library stacks'], label: 'classmate', minPlayerAge: 18 },
  college: { ages: () => [18, 45], contexts: ['Night class', 'Campus café'], label: 'classmate', minPlayerAge: 18 },
  park: { ages: mixed, contexts: ['Park bench', 'Jogging path', 'Dog park'] },
  downtown: { ages: mixed, contexts: ['Coffee shop', 'Mall', 'Bus stop', 'Arcade'] },
  mainstreet: { ages: mixed, contexts: ['Diner', 'General store', 'Main Street'] },
  library: { ages: mixed, contexts: ['Library', 'Reading room'], bias: ['nerd', 'loner', 'overachiever'] },
  gym: { ages: mixed, contexts: ['Weight room', 'Treadmills'], bias: ['jock', 'athlete'] },
  work: { ages: (g) => [Math.max(16, g.age - 10), Math.max(30, g.age + 20)], contexts: ['Break room', 'The floor'], label: 'coworker' },
  club: { ages: () => [21, 40], contexts: ['Dance floor', 'Bar line'], bias: ['party', 'popular', 'player'], minPlayerAge: 18 },
  bar: { ages: () => [21, 65], contexts: ['At the bar', 'Pool table'], bias: ['party', 'mature'], minPlayerAge: 18 },
  roadhouse: { ages: () => [21, 65], contexts: ['At the bar', 'Dance floor'], minPlayerAge: 18 },
  casino: { ages: () => [21, 75], contexts: ['Card table', 'Slot row'], minPlayerAge: 18 },
  church: { ages: (g) => (g.age < 18 ? [14, 80] : [18, 80]), contexts: ['After the service', 'Bake sale'], bias: ['religious', 'sweetheart', 'mature'] },
  hospital: { ages: (g) => (g.age < 18 ? [14, 80] : [18, 80]), contexts: ['Waiting room', 'Volunteer desk'], bias: ['sweetheart', 'mature'] },
  lake: { ages: mixed, contexts: ['The dock', 'Lakeshore'] },
  farm: { ages: mixed, contexts: ['The barn', 'Fields'] },
};

export const KINDS: { id: string; text: string; where?: string[]; adult?: boolean }[] = [
  { id: 'bump', text: 'You literally bump into {name}. Books everywhere.' },
  { id: 'spill', text: 'You spill your drink on {name}. Oh no.' },
  { id: 'sits', text: '{name} sits down next to you. "Is anyone sitting here?"' },
  { id: 'dog', text: '{name} is frantically looking for a lost dog.', where: ['park', 'downtown', 'mainstreet', 'lake'] },
  { id: 'directions', text: '{name} looks lost and asks you for directions.', where: ['downtown', 'mainstreet', 'park', 'campus', 'college'] },
  { id: 'drops', text: '{name} drops {their} wallet without noticing.' },
  { id: 'project', text: 'You’ve been paired with {name} for a group project.', where: ['school', 'campus', 'college'] },
  { id: 'transfer', text: '{name} is new here and looks a little overwhelmed.', where: ['school', 'campus', 'work'] },
  { id: 'bullied', text: 'A few people are picking on {name}.', where: ['school', 'park'] },
  { id: 'money', text: '{name} asks if you can spare a few dollars for the bus.', where: ['downtown', 'mainstreet', 'park'] },
  { id: 'drunk', text: '{name} has had way too much and is talking to everyone.', where: ['club', 'bar', 'roadhouse', 'casino'], adult: true },
  { id: 'chat', text: '{name} strikes up a conversation.' },
];

/** After an activity: maybe meet someone. Returns true if an encounter was queued. */
export function rollEncounter(g: Game, loc: string): boolean {
  const pool = POOLS[loc];
  if (!pool || g.s.events.length || g.jailed || (pool.minPlayerAge && g.age < pool.minPlayerAge)) return false;
  if (!g.chance(0.14)) return false;
  const where = LOC_BY_ID[loc]?.name(g) ?? loc;
  const kinds = KINDS.filter((k) => (!k.where || k.where.includes(loc)) && (!k.adult || g.age >= 21));
  const kind = g.pick(kinds);
  const [lo, hi] = pool.ages(g);
  // sometimes it's someone you already know from here
  const known = g.s.people.filter((p) => p.alive && p.status === 'alive' && p.where === where && !['mother', 'father', 'sibling', 'child', 'teacher', 'professor'].includes(p.role));
  let p: Person;
  if (known.length && g.chance(0.35)) p = g.pick(known);
  else {
    const archetype = pool.bias && g.chance(0.5) ? g.pick(pool.bias) : undefined;
    p = g.addPerson('acquaintance', { age: g.rand(lo, hi), rel: 6, met: g.dateLabel, where, how: kind.id, archetype });
    p.tags.push('stranger');
    if (pool.label) addLabel(p, pool.label);
  }
  g.queue('encounter', { pid: p.id, kind: kind.id, where: `${g.pick(pool.contexts)}, ${where}` });
  return true;
}

export const KIND_TEXT: Record<string, string> = Object.fromEntries(KINDS.map((k) => [k.id, k.text]));
