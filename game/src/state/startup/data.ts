import type { Appeal, Building, IdeaId, SkillBranch, Status } from './types';

// Update 0.11 — START-UP numbers. All in dollars (the display layer shows euros for EU lives).

export interface IdeaDef {
  name: string;
  icon: string;
  /** minimum to found it */
  found: number;
  /** monthly revenue at full hype and quality (normal appeal) */
  potential: number;
  /** how much work a version takes (progress points per 100%) */
  work: number;
  /** investor skepticism (pitch odds penalty) */
  risk: number;
  desc: string;
}

export const IDEAS: Record<IdeaId, IdeaDef> = {
  game: { name: 'AAA game studio', icon: '🎮', found: 15000, potential: 450000, work: 220, risk: 0.05, desc: 'Big, beautiful, crunchy.' },
  llm: { name: 'AI language model', icon: '🤖', found: 40000, potential: 1300000, work: 300, risk: 0.12, desc: 'Everyone wants one. Few can build one.' },
  factory: { name: 'Factory', icon: '🏭', found: 50000, potential: 350000, work: 140, risk: 0.02, desc: 'Steady, boring, profitable.' },
  watch: { name: 'Smartwatch', icon: '⌚', found: 25000, potential: 400000, work: 180, risk: 0.05, desc: 'Steps, sleep, notifications.' },
  phone: { name: 'New phone brand', icon: '📱', found: 60000, potential: 900000, work: 260, risk: 0.1, desc: 'Take on the giants.' },
  social: { name: 'Social app', icon: '💬', found: 8000, potential: 550000, work: 160, risk: 0.08, desc: 'Go viral or go home.' },
  ev: { name: 'Electric cars', icon: '🚗', found: 120000, potential: 1600000, work: 340, risk: 0.14, desc: 'Expensive to start. Huge to win.' },
  biotech: { name: 'Biotech', icon: '🧬', found: 90000, potential: 1900000, work: 380, risk: 0.16, desc: 'Years of research, then miracles.' },
  fashion: { name: 'Fashion brand', icon: '👗', found: 10000, potential: 225000, work: 110, risk: 0.04, desc: 'Taste is everything.' },
  delivery: { name: 'Food delivery app', icon: '🛵', found: 12000, potential: 300000, work: 130, risk: 0.06, desc: 'Hot food, thin margins.' },
  rockets: { name: 'Space rockets', icon: '🚀', found: 200000, potential: 2500000, work: 420, risk: 0.2, desc: 'To the moon. Literally.' },
};
export const IDEA_ORDER = Object.keys(IDEAS) as IdeaId[];

export const APPEAL: Record<Appeal, { name: string; desc: string; pitch: number; ceiling: number }> = {
  easy: { name: 'Safe pitch', desc: 'Investors say yes easily. Low ceiling.', pitch: 0.2, ceiling: 0.5 },
  normal: { name: 'Balanced', desc: 'A fair shot, a fair ceiling.', pitch: 0, ceiling: 1 },
  moonshot: { name: 'Moonshot', desc: 'Hard to convince anyone. Double the ceiling.', pitch: -0.15, ceiling: 2 },
};

export const BUILDINGS: Record<Building, { name: string; icon: string; cap: number; rent: number; upgrade: number }> = {
  room: { name: 'Your room', icon: '🛏️', cap: 3, rent: 0, upgrade: 0 },
  office: { name: 'Small office', icon: '🏢', cap: 15, rent: 5000, upgrade: 50000 },
  facility: { name: 'Facility', icon: '🏭', cap: 60, rent: 20000, upgrade: 500000 },
  hq: { name: 'Headquarters', icon: '🏛️', cap: 200, rent: 80000, upgrade: 5000000 },
  skyscraper: { name: 'Skyscraper', icon: '🌆', cap: 1000, rent: 300000, upgrade: 50000000 },
};
export const BUILDING_ORDER: Building[] = ['room', 'office', 'facility', 'hq', 'skyscraper'];

/** Monthly wages. */
export const WAGES = { employee: 4000, supervisor: 7000, manager: 12000, hr: 8000 };

export const SKILLS: Record<SkillBranch, { name: string; icon: string; per: string; max: number }> = {
  profit: { name: 'Profit', icon: '💰', per: '+15% revenue', max: 3 },
  speed: { name: 'Speed', icon: '⚡', per: '+20% development', max: 3 },
  payroll: { name: 'Payroll', icon: '🧾', per: '−10% wages', max: 3 },
  pitch: { name: 'Pitch', icon: '🎤', per: '+5% investor odds', max: 3 },
};

/** Status by company valuation. Diplomatic also needs the skyscraper. */
export const STATUS: Record<Status, { name: string; icon: string; at: number }> = {
  founder: { name: 'Founder', icon: '🌱', at: 0 },
  ceo: { name: 'CEO', icon: '💼', at: 1000000 },
  tycoon: { name: 'Tycoon', icon: '🎩', at: 25000000 },
  magnate: { name: 'Magnate', icon: '👑', at: 250000000 },
  diplomatic: { name: 'Diplomatic', icon: '🕊️', at: 1000000000 },
};
export const STATUS_ORDER: Status[] = ['founder', 'ceo', 'tycoon', 'magnate', 'diplomatic'];

/** Investor rounds: how much they can put in. */
export const ROUNDS = [
  { id: 'angel', name: 'Angel investor', icon: '😇', min: 20000, max: 250000, minVal: 0 },
  { id: 'vc', name: 'Venture capital', icon: '🦈', min: 500000, max: 5000000, minVal: 1000000 },
  { id: 'fund', name: 'Mega fund', icon: '🏦', min: 10000000, max: 100000000, minVal: 25000000 },
  { id: 'sovereign', name: 'Sovereign fund', icon: '🌐', min: 200000000, max: 1000000000, minVal: 250000000 },
] as const;
export type RoundId = (typeof ROUNDS)[number]['id'];

export const INVESTOR_NAMES = ['Harlow Capital', 'Bluefin Ventures', 'Mira Okafor', 'Sterling & Vane', 'Northwind Partners', 'Juno Fund', 'Kessler Group', 'Aurelia Holdings', 'Pax Ventures', 'Ilse Brandt'];
