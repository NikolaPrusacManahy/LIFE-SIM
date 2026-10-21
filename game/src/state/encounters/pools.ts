import type { Game } from '../Game';
import type { Archetype, Person } from '../types';
import { LOC_BY_ID } from '../data/locations';
import { addLabel } from '../npc/labels';
import { legalAge } from '../rules/us';
import { makeMatch } from '../npc/match';
import { makeYandere, rollPersona, setPersona, type Persona } from '../npc/persona';
import { isRomanceEligible } from '../npc/identity';

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
  club: { ages: (g) => [legalAge(g, 'alcohol'), 40], contexts: ['Dance floor', 'Bar line'], bias: ['party', 'popular', 'player'], minPlayerAge: 18 },
  bar: { ages: (g) => [legalAge(g, 'alcohol'), 65], contexts: ['At the bar', 'Pool table'], bias: ['party', 'mature'], minPlayerAge: 18 },
  roadhouse: { ages: (g) => [legalAge(g, 'alcohol'), 65], contexts: ['At the bar', 'Dance floor'], minPlayerAge: 18 },
  casino: { ages: (g) => [legalAge(g, 'casino'), 75], contexts: ['Card table', 'Slot row'], minPlayerAge: 18 },
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
  // Update 0.12 — admirers (never picked at random: see ADMIRER_LOCS)
  { id: 'admirer', text: '{name} keeps glancing at you. Finally {they} walk{s} over, blushing.', where: [] },
  { id: 'yandere', text: '{name} has been watching you for a while. When you look up, {they} smile{s} — perfectly.', where: [] },
  // Update 0.12 — hospital staff (never picked at random: see staffEncounter)
  { id: 'doctor', text: 'Dr. {name} checks your chart between patients and actually asks how you’re doing.', where: [] },
  { id: 'nurse', text: 'Nurse {name} takes your blood pressure and cracks a joke to calm you down.', where: [] },
  { id: 'doctor_love', text: 'Dr. {name} walks in, looks up from your chart — and forgets what {they} were about to say. {They} can’t stop smiling at you.', where: [] },
];

/** Update 0.12 — places where people who are into you find you. */
export const ADMIRER_LOCS = ['library', 'club', 'bar', 'roadhouse', 'park', 'work', 'campus', 'college'];

/** Someone attracted to you walks up (adults: sometimes a yandere). */
export function admirerEncounter(g: Game, loc: string, act?: string): boolean {
  const pool = POOLS[loc];
  if (!pool || !ADMIRER_LOCS.includes(loc) || g.s.events.length) return false;
  const where = LOC_BY_ID[loc]?.name(g) ?? loc;
  const [lo, hi] = pool.ages(g);
  const ylo = Math.max(18, lo);
  let p: Person | null = g.age >= 18 && g.chance(0.18) ? makeYandere(g, 'acquaintance', where) : null;
  if (p && (g.ageOf(p) < ylo || g.ageOf(p) > Math.max(ylo, hi))) p.bornMonths = g.s.clock - g.rand(ylo, Math.max(ylo, Math.min(hi, g.age + 6))) * 12;
  if (!p) {
    p = makeMatch(g, 'acquaintance', [lo, hi], { rel: 10, met: g.dateLabel, where });
    if (!isRomanceEligible(g, p)) p.bornMonths = g.s.clock - g.age * 12;
    setPersona(p, rollPersona(g, g.ageOf(p), p.gender, false, biasFor(loc, act)));
    p.attraction = g.rand(55, 80);
  }
  p.tags.push('stranger');
  if (pool.label) addLabel(p, pool.label);
  g.queue('encounter', { pid: p.id, kind: p.persona === 'yandere' ? 'yandere' : 'admirer', where: `${g.pick(pool.contexts)}, ${where}` });
  return true;
}

/** Update 0.12 — doctors and nurses (25–60) at the hospital. Adults can meet ones who are into them;
 *  sometimes a doctor falls for you at first sight. */
export const STAFF_ODDS = 0.45;
export const LOVE_AT_FIRST_SIGHT = 0.2;
export function staffEncounter(g: Game): boolean {
  const where = LOC_BY_ID.hospital?.name(g) ?? 'Hospital';
  const doctor = g.chance(0.5);
  const p = g.age >= 18 ? makeMatch(g, 'acquaintance', [25, 60], { rel: 8, met: g.dateLabel, where }) : g.addPerson('acquaintance', { age: g.rand(25, 60), rel: 8, met: g.dateLabel, where });
  p.subject = doctor ? 'Doctor' : 'Nurse';
  p.archetype = g.pick(['mature', 'sweetheart', 'overachiever'] as Archetype[]);
  p.tags.push('stranger', doctor ? 'doctor' : 'nurse');
  const love = doctor && g.age >= 18 && isRomanceEligible(g, p) && g.chance(LOVE_AT_FIRST_SIGHT);
  if (love) {
    p.attraction = g.rand(90, 100);
    p.romance = 30;
    p.tags.push('loveAtFirstSight');
    p.memory.unshift({ clock: g.s.clock, text: 'Love at first sight', tone: 'good' });
  } else if (g.age >= 18 && isRomanceEligible(g, p)) p.attraction = g.rand(30, 70);
  g.queue('encounter', { pid: p.id, kind: love ? 'doctor_love' : doctor ? 'doctor' : 'nurse', where: `${g.pick(['Exam room', 'Hallway', 'Nurses’ station'])}, ${where}` });
  return true;
}

/** Update 0.12 — who you'd expect to meet here (by place or by what you're doing). */
export const PLACE_PERSONAS: Record<string, Persona[]> = {
  mall: ['gyaru', 'golddigger'], shopping: ['gyaru', 'golddigger'], makeover: ['gyaru', 'golddigger'],
  arcade: ['gamer', 'otaku'], coffee: ['booknerd', 'otaku'], library: ['booknerd', 'otaku'],
  campus: ['gyaru', 'booknerd', 'gamer'], college: ['booknerd', 'gamer'], club: ['gyaru', 'golddigger'], casino: ['golddigger'],
};
const biasFor = (loc: string, act?: string): Persona[] => PLACE_PERSONAS[(act ?? '').replace(/_c$/, '')] ?? PLACE_PERSONAS[loc] ?? [];

/** After an activity: maybe meet someone. Returns true if an encounter was queued. */
export function rollEncounter(g: Game, loc: string, act?: string): boolean {
  const pool = POOLS[loc];
  if (!pool || g.s.events.length || g.jailed || (pool.minPlayerAge && g.age < pool.minPlayerAge)) return false;
  if (!g.chance(0.14)) return false;
  if (loc === 'hospital' && g.chance(STAFF_ODDS)) return staffEncounter(g);
  const where = LOC_BY_ID[loc]?.name(g) ?? loc;
  // Update 0.12 — sometimes it's someone who's into you
  if (ADMIRER_LOCS.includes(loc) && g.age >= 14 && g.chance(0.3)) return admirerEncounter(g, loc, act);
  const kinds = KINDS.filter((k) => (!k.where || k.where.includes(loc)) && (!k.adult || g.age >= legalAge(g, 'alcohol')));
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
    setPersona(p, rollPersona(g, g.ageOf(p), p.gender, true, biasFor(loc, act)));
  }
  g.queue('encounter', { pid: p.id, kind: kind.id, where: `${g.pick(pool.contexts)}, ${where}` });
  return true;
}

export const KIND_TEXT: Record<string, string> = Object.fromEntries(KINDS.map((k) => [k.id, k.text]));
