import { blankSpark } from './systems/dating';
import { GOD_WEALTH, Game } from './Game';
import type { Appearance, Background, GameState, Gender, Person, Pronouns, Region, Sexuality, StatKey } from './types';
import { pronounsFor } from './npc/identity';
import { blankUnderworld } from './crime/types';
import { blankPc, blankWeb } from './pc/types';
import { ensureStaff } from './npc/school';
import { TRAIT_BY_ID } from './data/traits';
import { firstName, lastName } from './data/names';
import { ensureRoommate, netWorth } from './systems/finance';
import { randomAvatar } from './npc/generator';
import { blankWallet } from './systems/bitcons';
import { blankHack } from './web/hack';

export const SAVE_VERSION = 4;
export const START_AGE = 14;

export interface NewLifeOptions {
  name: string;
  familyName: string;
  gender: Gender;
  background: Background;
  hometown: Region;
  traits: string[];
  look: Appearance;
  /** Update 0.4 */
  pronouns?: Pronouns;
  sexuality?: Sexuality;
  siblings?: number;
  /** Update 0.5.1 — start as a teen (14) or a young adult (23) */
  startAge?: 14 | 23;
  /** Update 0.5.1 — $1,000,000 trust fund */
  millionaire?: boolean;
  /** Update 0.5.1 — US or EU laws */
  rules?: 'us' | 'eu';
  /** Update 0.6 — born a god */
  god?: boolean;
}

const rnd = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

/** A blank, fully-populated state. Also the source of defaults for save hydration. */
export function blankState(): GameState {
  return {
    v: SAVE_VERSION,
    name: 'Alex',
    familyName: 'Rivera',
    gender: 'nonbinary',
    pronouns: { subj: 'they', obj: 'them', poss: 'their', plural: true, label: 'they/them' },
    sexuality: 'unsure',
    inventory: {},
    inbox: [],
    schedule: [],
    underworld: blankUnderworld(),
    chats: {},
    plans: [],
    notes: [],
    pc: blankPc(),
    web: blankWeb(),
    session: null,
    orders: [],
    night: null,
    usedThisSlot: { turn: -1, ids: [] },
    date: null,
    startup: null,
    statCaps: { health: 100, energy: 100 },
    stalker: null,
    notebook: [],
    wallet: blankWallet(),
    hack: blankHack(),
    spark: blankSpark(),
    groups: [],
    background: 'middle',
    rules: 'us',
    god: false,
    traits: [],
    look: { skin: 0, hair: 0, hairStyle: 0, eyes: 0, height: 1, build: 1, freckles: false, glasses: false, body: 'male' },
    region: 'city',
    hometown: 'city',
    location: 'home',
    clock: 0,
    bornAt: -START_AGE * 12,
    startYear: new Date().getFullYear(),
    phase: 0,
    turn: 0,
    stats: { health: 85, mood: 60, energy: 80, smarts: 30, fitness: 30, charm: 30, creativity: 25, street: 5, looks: 40 },
    karma: 0,
    heat: 0,
    fame: 0,
    money: 0,
    debt: 0,
    housing: 'parents',
    missedRent: 0,
    assets: [],
    education: { current: null, degrees: [], gedStudy: 0 },
    job: null,
    crime: { record: [], arrests: 0, org: null, formerOrgs: [], jail: null, fugitive: false, crimes: 0, juvRecord: [] },
    people: [],
    flags: {},
    cooldowns: {},
    log: [],
    events: [],
    achievements: [],
    milestones: [],
    dead: null,
    generation: 1,
    netWorthPeak: 0,
  };
}

export function createLife(o: NewLifeOptions): Game {
  const s = blankState();
  s.name = o.name.trim() || firstName(o.gender);
  s.familyName = o.familyName.trim() || lastName();
  s.gender = o.gender;
  s.background = o.background;
  s.rules = o.rules ?? 'us';
  s.god = !!o.god;
  s.hometown = o.hometown;
  s.region = o.hometown;
  s.traits = o.traits.slice(0, 2);
  s.pronouns = o.pronouns ?? pronounsFor(o.gender);
  s.sexuality = o.sexuality ?? 'unsure';
  s.flags.identitySet = o.sexuality && o.sexuality !== 'unsure' ? 1 : 0;
  s.look = o.look;
  const age = o.startAge ?? START_AGE;
  const adult = age >= 18;
  s.bornAt = -age * 12 - rnd(0, 11);

  const st = s.stats;
  for (const k of Object.keys(st) as StatKey[]) if (k !== 'energy' && k !== 'health') st[k] = Math.max(0, st[k] + rnd(-6, 6));
  if (o.background === 'rich') { st.smarts += 5; st.looks += 5; st.street -= 3; }
  if (o.background === 'poor') { st.street += 8; st.mood -= 5; }
  if (o.hometown === 'country') { st.fitness += 5; st.street -= 2; }
  for (const t of s.traits) for (const [k, v] of Object.entries(TRAIT_BY_ID[t]?.start ?? {})) st[k as StatKey] = Math.min(100, st[k as StatKey] + (v as number));
  // Update 0.6 — a god is born at the peak of everything
  if (o.god) for (const k of ['health', 'smarts', 'fitness', 'charm', 'creativity', 'looks'] as StatKey[]) st[k] = 100;
  for (const k of Object.keys(st) as StatKey[]) st[k] = Math.max(0, Math.min(100, st[k]));
  s.money = adult ? { poor: 900, middle: 4000, rich: 25000 }[o.background] : { poor: 40, middle: 300, rich: 2500 }[o.background];
  if (o.millionaire) s.money += 1_000_000;
  if (o.god) s.money = GOD_WEALTH;

  if (adult) {
    // Update 0.5.1 — young-adult start: diploma done, own phone, a shared flat
    s.education.degrees.push('hs');
    s.assets.push('phone');
  } else s.education.current = { program: 'hs', months: 0, length: 48, perf: 50 + (st.smarts - 30) / 3, skips: 0, attended: 0, warnings: 0, funding: 'free' };

  if ((o.background === 'rich' || o.god) && !adult) s.assets.push('phone');
  const g = new Game(s);
  const parentRel = o.background === 'poor' ? rnd(50, 70) : rnd(60, 80);
  const single = o.background === 'poor' && Math.random() < 0.5;
  const fam = { surname: s.familyName, met: 'Family', where: 'Home' };
  const older = age - START_AGE;
  g.addPerson('mother', { ...fam, gender: 'female', age: rnd(36, 50) + older, rel: parentRel });
  if (!single) g.addPerson('father', { ...fam, gender: 'male', age: rnd(38, 52) + older, rel: parentRel - rnd(0, 15) });
  const sibs = o.siblings ?? (Math.random() < 0.55 ? 1 : 0);
  for (let i = 0; i < sibs; i++) g.addPerson('sibling', { ...fam, age: Math.max(1, age + rnd(-6, 6)), rel: rnd(40, 75) });
  if (adult) {
    s.housing = 'shared';
    g.setFlag('movedOut');
    ensureRoommate(g);
  } else ensureStaff(g);

  g.log(`👶 ${s.name} ${s.familyName} — age ${age}, ${o.hometown === 'city' ? 'the city' : 'the countryside'}, ${o.background} family${o.millionaire ? ', a millionaire' : ''}${o.god ? ' — and a god' : ''}.`, 'milestone');
  if (!adult) g.queue('hs_first_day');
  return g;
}

/** Generational play: start a new life as one of your children (age 14+). */
export function continueAsChild(old: GameState, childId: string): Game | null {
  const prev = new Game(old);
  const kid = old.people.find((p) => p.id === childId && p.role === 'child' && p.alive);
  if (!kid) return null;
  const kidAge = prev.ageOf(kid);
  if (kidAge < START_AGE) return null;
  const estate = Math.max(0, Math.round(netWorth(prev) * 0.5));
  const s = blankState();
  s.name = kid.name;
  s.familyName = old.familyName;
  s.gender = kid.gender;
  s.background = estate > 500000 ? 'rich' : estate > 30000 ? 'middle' : 'poor';
  s.hometown = old.region;
  s.region = old.region;
  // Update 0.7 — the heir keeps their own look (it used to copy the parent's body)
  s.look = kid.look ? { ...kid.look } : randomAvatar(kid.gender);
  s.clock = old.clock;
  s.startYear = old.startYear;
  s.bornAt = kid.bornMonths;
  s.generation = old.generation + 1;
  s.rules = old.rules ?? 'us';
  s.money = estate;
  s.achievements = [...old.achievements];
  if (kidAge < 18) s.education.current = { program: 'hs', months: (kidAge - START_AGE) * 12, length: 48, perf: 55, skips: 0, attended: 0, warnings: 0, funding: 'free' };
  else { s.education.degrees.push('hs'); s.housing = 'shared'; s.assets.push('phone'); }
  const g = new Game(s);
  const other = old.people.find((p) => p.alive && p.role === 'spouse');
  if (other) g.addPerson(other.gender === 'male' ? 'father' : 'mother', { name: other.name, gender: other.gender, bornMonths: other.bornMonths, rel: 70 });
  for (const sib of old.people.filter((p) => p.alive && p.role === 'child' && p.id !== kid.id)) {
    const copy: Person = { ...sib, role: 'sibling', rel: 60 };
    g.s.people.push(copy);
  }
  g.achieve('legacy');
  g.log(`🧬 Generation ${s.generation}: ${s.name} ${s.familyName} inherits ${estate > 0 ? `$${estate.toLocaleString()}` : 'nothing but a name'}.`, 'milestone');
  return g;
}

export const randomLook = (body: 'male' | 'female' = Math.random() < 0.5 ? 'male' : 'female'): Appearance => randomAvatar(body === 'male' ? 'male' : 'female');
