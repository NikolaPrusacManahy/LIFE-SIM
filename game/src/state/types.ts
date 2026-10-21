export type Phase = 'morning' | 'afternoon' | 'evening' | 'night';
export const PHASES: Phase[] = ['morning', 'afternoon', 'evening', 'night'];
export const PHASE_LABEL: Record<Phase, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};
export const PHASE_ICON: Record<Phase, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙',
};
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type Region = 'city' | 'country';
export type Gender = 'male' | 'female' | 'nonbinary';
export type Background = 'poor' | 'middle' | 'rich';

export type StatKey = 'health' | 'mood' | 'energy' | 'smarts' | 'fitness' | 'charm' | 'creativity' | 'street' | 'looks';
export type MeterKey = 'karma' | 'heat' | 'fame';
export type Stats = Record<StatKey, number>;

export const STAT_LABEL: Record<StatKey | MeterKey | 'money', string> = {
  health: 'Health',
  mood: 'Mood',
  energy: 'Energy',
  smarts: 'Smarts',
  fitness: 'Fitness',
  charm: 'Charm',
  creativity: 'Creativity',
  street: 'Street',
  looks: 'Looks',
  karma: 'Karma',
  heat: 'Heat',
  fame: 'Fame',
  money: 'Money',
};

export type Role =
  | 'mother'
  | 'father'
  | 'sibling'
  | 'friend'
  | 'crush'
  | 'partner'
  | 'spouse'
  | 'ex'
  | 'child'
  | 'crew'
  | 'rival'
  | 'mentor'
  | 'coworker'
  | 'fling'
  // Update 0.4
  | 'acquaintance'
  | 'talking'
  | 'dating'
  | 'engaged'
  | 'teacher'
  | 'professor';

export type Sexuality = 'straight' | 'gay' | 'bi' | 'pan' | 'ace' | 'unsure';
export type BodyBase = 'male' | 'female';

export interface Pronouns {
  subj: string;
  obj: string;
  poss: string;
  /** they/them takes plural verbs */
  plural: boolean;
  label: string;
}

export type Archetype =
  | 'jock' | 'nerd' | 'popular' | 'artsy' | 'rebel' | 'loner' | 'gamer' | 'party' | 'overachiever' | 'clown'
  | 'religious' | 'richkid' | 'hustler' | 'goth' | 'influencer' | 'sweetheart' | 'bully' | 'gossip' | 'athlete'
  | 'activist' | 'mature' | 'career' | 'freespirit' | 'player' | 'homebody';

export type SideLabel =
  | 'rival' | 'enemy' | 'mentor' | 'classmate' | 'coworker' | 'roommate' | 'neighbour' | 'teacher' | 'professor'
  | 'situationship' | 'fwb' | 'sugar' | 'sugarbaby' | 'affair' | 'ons';

export interface AvatarSpec {
  skin: number;
  hair: number;
  hairStyle: number;
  eyes: number;
  /** 0 short · 1 average · 2 tall */
  height: number;
  /** 0 slim · 1 average · 2 athletic · 3 heavy */
  build: number;
  freckles: boolean;
  glasses: boolean;
  body: BodyBase;
}

export interface Memory {
  clock: number;
  text: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface Person {
  id: string;
  name: string;
  role: Role;
  rel: number;
  bornMonths: number; // absolute game month the person was born (age = now - born)
  gender: Gender;
  alive: boolean;
  tags: string[];
  met: string;
  /** Update 0.3 — hidden traits, generated lazily (see systems/intimacy.ts) */
  hidden?: HiddenTraits;
  // ---- Update 0.4 — full NPC model
  surname: string;
  pronouns: Pronouns;
  sexuality: Sexuality;
  look: AvatarSpec;
  archetype: Archetype;
  traits: { id: string; revealed: boolean; progress: number }[];
  /** friendship is `rel` */
  romance: number;
  trust: number;
  respect: number;
  attraction: number;
  rivalry: number;
  labels: SideLabel[];
  /** you have their number */
  hasNumber: boolean;
  theyHaveNumber: boolean;
  fakeNumber?: boolean;
  blocked?: boolean;
  /** where you know them from, e.g. "Westside High" */
  where: string;
  how: string;
  memory: Memory[];
  status: 'alive' | 'moved' | 'dead' | 'jail' | 'captive';
  /** Update 0.5 — crew role and loyalty */
  crewRole?: import('./crime/types').CrewRole;
  loyalty?: number;
  mood: number;
  birthMonth: number;
  /** teachers/professors */
  subject?: string;
  lastContact?: number;
}

export type StiKind = 'none' | 'chlamydia' | 'gonorrhea' | 'herpes' | 'hiv';

export interface HiddenTraits {
  sti: StiKind;
  fidelity: number;
  wantsKids: number;
  jealousy: number;
  commitment: number;
  attraction: number;
  onPill: boolean;
}

export interface Enrollment {
  program: string;
  months: number;
  length: number;
  perf: number;
  skips: number; // skipped slots this month
  attended: number; // attended slots this month
  warnings: number;
  funding: 'parents' | 'cash' | 'loan' | 'scholarship' | 'free';
  heldBack?: boolean;
}

export interface Education {
  current: Enrollment | null;
  degrees: string[];
  gedStudy: number;
}

export interface Job {
  careerId: string;
  level: number;
  perf: number;
  months: number;
  monthsAtLevel: number;
  warnings: number;
  skips: number;
  /** shifts worked this month */
  worked?: number;
}

export interface OrgMembership {
  id: string;
  rank: number;
  respect: number;
  joinedAge: number;
  idle: number; // months without doing org work
}

export interface Jail {
  monthsLeft: number;
  total: number;
  behavior: number;
  juvie: boolean;
  paroleTried: boolean;
}

export interface CrimeState {
  record: string[];
  arrests: number;
  org: OrgMembership | null;
  formerOrgs: string[];
  jail: Jail | null;
  fugitive: boolean;
  crimes: number;
  /** Update 0.3 — juvenile offences; minor ones are sealed at 18 */
  juvRecord: { name: string; sev: number }[];
}

export type LogKind = 'info' | 'good' | 'bad' | 'crime' | 'love' | 'money' | 'milestone' | 'event' | 'school' | 'work';

export interface LogEntry {
  turn: number;
  date: string;
  text: string;
  kind: LogKind;
  /** Update 0.4 — person this entry is about (shown as a chip) */
  pid?: string;
}

export interface ActiveEvent {
  id: string;
  ctx: Record<string, any>;
}

export type HousingId =
  | 'parents'
  | 'homeless'
  | 'shared'
  | 'apartment'
  | 'loft'
  | 'house'
  | 'farmhouse'
  | 'mansion'
  | 'ranch';

export type Appearance = AvatarSpec;

/** Update 0.4 — a text message in the phone inbox */
export interface TextMessage {
  id: string;
  pid: string;
  kind: string;
  text: string;
  turn: number;
  read: boolean;
  replied: boolean;
  mature?: boolean;
  ctx?: Record<string, any>;
}

export interface Scheduled {
  at: number;
  id: string;
  ctx: Record<string, any>;
}

export interface GameState {
  v: number;
  name: string;
  familyName: string;
  gender: Gender;
  /** Update 0.4 */
  pronouns: Pronouns;
  sexuality: Sexuality;
  inventory: Record<string, number>;
  inbox: TextMessage[];
  schedule: Scheduled[];
  /** Update 0.5 */
  underworld: import('./crime/types').Underworld;
  chats: Record<string, import('./crime/types').ChatMsg[]>;
  groups: import('./crime/types').GroupChat[];
  /** Update 0.8 — accepted invitations and dates */
  plans: import('./phone/types').Plan[];
  /** Update 0.8 — notification centre (texts, plan reminders, bills, news) */
  notes: import('./phone/types').Note[];
  /** Update 0.8 — computers & the web */
  pc: import('./pc/types').PcState;
  web: import('./pc/types').WebState;
  session: import('./pc/types').Session | null;
  orders: import('./pc/types').Order[];
  /** Update 0.8 — a night out in progress */
  night: import('./nightlife/types').Night | null;
  /** Update 0.8 — free actions you can only do once per time slot (profile actions, a computer sitting) */
  usedThisSlot: { turn: number; ids: string[] };
  /** Update 0.10 — a date in progress */
  date: import('./datenight/types').DateScene | null;
  background: Background;
  /** Update 0.5.1 — legal system this life plays under */
  rules: 'us' | 'eu';
  /** Update 0.6 — born a god: immortal, untouchable */
  god: boolean;
  traits: string[];
  look: Appearance;
  region: Region;
  hometown: Region;
  location: string;
  /** absolute months since game epoch; player's age = clock - bornAt */
  clock: number;
  bornAt: number;
  startYear: number;
  phase: number;
  turn: number;
  stats: Stats;
  karma: number;
  heat: number;
  fame: number;
  money: number;
  debt: number;
  housing: HousingId;
  missedRent: number;
  assets: string[];
  education: Education;
  job: Job | null;
  crime: CrimeState;
  people: Person[];
  flags: Record<string, number>;
  cooldowns: Record<string, number>;
  log: LogEntry[];
  events: ActiveEvent[];
  achievements: string[];
  milestones: string[];
  dead: { cause: string; age: number } | null;
  generation: number;
  netWorthPeak: number;
}

export type FxKind =
  | { type: 'burst'; kind: 'coins' | 'sparkle' | 'hearts' | 'hit' | 'confetti' | 'smoke' | 'zzz' }
  | { type: 'shake'; power?: number }
  | { type: 'flash'; color: number }
  | { type: 'police' }
  | { type: 'banner'; text: string; color?: number };
