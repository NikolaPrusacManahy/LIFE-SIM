import type { Archetype, AvatarSpec, Gender, Person, Role } from '../types';
import { firstName, lastName, randomGender } from '../data/names';
import { pronounsFor, rollSexuality } from './identity';
import { rollTraits } from './traits';

// Update 0.4 — NPC generator. Pure (no Game import) so save migration can use it.

export const ARCHETYPES: { id: Archetype; name: string; teen: boolean; adult: boolean; stats: Partial<Record<'looks' | 'smarts' | 'charm' | 'fitness' | 'wealth' | 'fame' | 'karma', number>> }[] = [
  { id: 'jock', name: 'Jock', teen: true, adult: true, stats: { fitness: 25, charm: 5 } },
  { id: 'nerd', name: 'Nerd', teen: true, adult: true, stats: { smarts: 25, charm: -5 } },
  { id: 'popular', name: 'Popular', teen: true, adult: true, stats: { looks: 15, charm: 20 } },
  { id: 'artsy', name: 'Artsy', teen: true, adult: true, stats: { charm: 5 } },
  { id: 'rebel', name: 'Rebel', teen: true, adult: true, stats: { karma: -10 } },
  { id: 'loner', name: 'Loner', teen: true, adult: true, stats: { charm: -10, smarts: 5 } },
  { id: 'gamer', name: 'Gamer', teen: true, adult: true, stats: { smarts: 8, fitness: -8 } },
  { id: 'party', name: 'Party Animal', teen: true, adult: true, stats: { charm: 12, karma: -5 } },
  { id: 'overachiever', name: 'Overachiever', teen: true, adult: true, stats: { smarts: 20 } },
  { id: 'clown', name: 'Class Clown', teen: true, adult: false, stats: { charm: 15 } },
  { id: 'religious', name: 'Religious', teen: true, adult: true, stats: { karma: 20 } },
  { id: 'richkid', name: 'Rich Kid', teen: true, adult: true, stats: { wealth: 40, looks: 5 } },
  { id: 'hustler', name: 'Hustler', teen: true, adult: true, stats: { charm: 10, wealth: 10 } },
  { id: 'goth', name: 'Goth / Alt', teen: true, adult: true, stats: { looks: 5 } },
  { id: 'influencer', name: 'Influencer', teen: true, adult: true, stats: { fame: 30, looks: 15 } },
  { id: 'sweetheart', name: 'Sweetheart', teen: true, adult: true, stats: { karma: 20, charm: 10 } },
  { id: 'bully', name: 'Bully', teen: true, adult: false, stats: { fitness: 10, karma: -25 } },
  { id: 'gossip', name: 'Gossip', teen: true, adult: true, stats: { charm: 10 } },
  { id: 'athlete', name: 'Athlete', teen: true, adult: true, stats: { fitness: 30 } },
  { id: 'activist', name: 'Activist', teen: true, adult: true, stats: { karma: 15, smarts: 5 } },
  { id: 'mature', name: 'Mature Adult', teen: false, adult: true, stats: { smarts: 10, wealth: 15 } },
  { id: 'career', name: 'Career-Driven', teen: false, adult: true, stats: { smarts: 12, wealth: 20 } },
  { id: 'freespirit', name: 'Free Spirit', teen: true, adult: true, stats: { charm: 8 } },
  { id: 'player', name: 'Player', teen: false, adult: true, stats: { looks: 15, charm: 15, karma: -10 } },
  { id: 'homebody', name: 'Homebody', teen: true, adult: true, stats: { karma: 5 } },
];
export const ARCHETYPE_BY_ID = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]));

const rint = (a: number, b: number, rnd = Math.random) => Math.floor(a + rnd() * (b - a + 1));
const pickOf = <T,>(arr: T[], rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];

/** Update 0.7 — hairstyles that read clearly as the body's sex (indices into HAIR_STYLES). Players can still pick any. */
export const FEMALE_STYLES = [0, 1, 2, 4, 5, 6, 7, 8, 11];
export const MALE_STYLES = [0, 3, 7, 8, 9, 10];
export const stylesFor = (body: AvatarSpec['body']) => (body === 'female' ? FEMALE_STYLES : MALE_STYLES);

/** Update 0.7 — older NPCs could roll the other sex's hairstyle; move them to the closest fit (stable per id). */
export function fitHairStyle(look: AvatarSpec, id: string) {
  const pool = stylesFor(look.body);
  if (pool.includes(look.hairStyle % 12)) return;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  look.hairStyle = pool[h % pool.length];
}

export function randomAvatar(gender: Gender, rnd = Math.random): AvatarSpec {
  const body = gender === 'male' ? 'male' : gender === 'female' ? 'female' : rnd() < 0.5 ? 'male' : 'female';
  const pool = stylesFor(body);
  return {
    skin: rint(0, 7, rnd),
    hair: rint(0, 9, rnd),
    hairStyle: pool[rint(0, pool.length - 1, rnd)],
    eyes: rint(0, 5, rnd),
    height: rint(0, 2, rnd),
    build: rint(0, 3, rnd),
    freckles: rnd() < 0.15,
    glasses: rnd() < 0.18,
    body,
  };
}

export function rollArchetype(age: number, rnd = Math.random): Archetype {
  const pool = ARCHETYPES.filter((a) => (age < 18 ? a.teen : a.adult));
  return pickOf(pool, rnd).id;
}

export interface NpcSeed {
  role: Role;
  age: number;
  clock: number;
  gender?: Gender;
  name?: string;
  surname?: string;
  rel?: number;
  met?: string;
  where?: string;
  how?: string;
  tags?: string[];
  bornMonths?: number;
  archetype?: Archetype;
}

/** Build a complete NPC. */
export function makeNpc(id: string, s: NpcSeed): Person {
  const gender = s.gender ?? randomGender();
  const p: Person = {
    id,
    name: s.name ?? firstName(gender),
    surname: s.surname ?? lastName(),
    role: s.role,
    rel: s.rel ?? 50,
    bornMonths: s.bornMonths ?? s.clock - s.age * 12 - rint(0, 11),
    gender,
    alive: true,
    tags: s.tags ?? [],
    met: s.met ?? '',
    pronouns: pronounsFor(gender),
    sexuality: rollSexuality(),
    look: randomAvatar(gender),
    archetype: s.archetype ?? rollArchetype(s.age),
    traits: [],
    romance: 0,
    trust: 30,
    respect: 40,
    attraction: 0,
    rivalry: 0,
    labels: [],
    hasNumber: false,
    theyHaveNumber: false,
    where: s.where ?? s.met ?? '',
    how: s.how ?? '',
    memory: [],
    status: 'alive',
    mood: 60,
    birthMonth: 0,
  };
  p.birthMonth = ((p.bornMonths % 12) + 12) % 12;
  p.traits = rollTraits(p.archetype, s.age >= 18);
  const family = ['mother', 'father', 'sibling', 'child'].includes(s.role);
  if (family) {
    p.hasNumber = true;
    p.theyHaveNumber = true;
    p.trust = 70;
    p.surname = s.surname ?? p.surname;
  }
  if (['friend', 'partner', 'spouse', 'crush', 'dating', 'engaged', 'ex', 'mentor', 'coworker', 'crew'].includes(s.role)) {
    p.hasNumber = true;
    p.theyHaveNumber = true;
  }
  if (['partner', 'spouse', 'dating', 'engaged'].includes(s.role)) {
    p.romance = Math.max(50, p.rel);
    p.attraction = 70;
  }
  return p;
}

/** Fill any 0.4 fields missing from an older save. */
export function migrateNpc(raw: Partial<Person> & { id: string; role: Role; bornMonths: number; gender: Gender }, clock: number): Person {
  const age = Math.floor((clock - raw.bornMonths) / 12);
  const base = makeNpc(raw.id, { role: raw.role, age, clock, gender: raw.gender, name: raw.name, rel: raw.rel, met: raw.met, bornMonths: raw.bornMonths, tags: raw.tags });
  return { ...base, ...raw, pronouns: raw.pronouns ?? base.pronouns, traits: raw.traits ?? base.traits, labels: raw.labels ?? base.labels, memory: raw.memory ?? [], look: raw.look ?? base.look } as Person;
}

export const ageOfAt = (p: Person, clock: number) => Math.floor((clock - p.bornMonths) / 12);
export const _pick = pickOf;
