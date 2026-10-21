import type { Game } from '../Game';

export type ProgramKind = 'hs' | 'uni' | 'grad' | 'trade' | 'academy' | 'cc';

export interface ProgramDef {
  id: string;
  name: string;
  icon: string;
  kind: ProgramKind;
  length: number; // months
  tuition: number; // per year
  degree: string;
  minSmarts: number;
  desc: string;
  region?: 'city' | 'country';
  stipend?: number;
  /** Update 0.3 — classes in the evening instead of the morning */
  night?: boolean;
  req?: (g: Game) => string | null;
}

const hasHS = (g: Game) => g.hasDegree('hs') || g.hasDegree('ged');
const needHS = (g: Game) => (hasHS(g) ? null : 'Needs a high school diploma or GED');
const anyBachelor = (g: Game) => g.s.education.degrees.some((d) => d.startsWith('ba_'));
const needBA = (g: Game) => (anyBachelor(g) ? null : "Needs a bachelor's degree");

export const PROGRAMS: ProgramDef[] = [
  { id: 'hs', name: 'High School', icon: '🏫', kind: 'hs', length: 48, tuition: 0, degree: 'hs', minSmarts: 0, desc: 'Four years. Survive it.' },

  { id: 'uni_cs', name: 'B.S. Computer Science', icon: '💻', kind: 'uni', length: 48, tuition: 14000, degree: 'ba_cs', minSmarts: 55, desc: 'Code, caffeine, and big tech salaries.', req: needHS },
  { id: 'uni_eng', name: 'B.S. Engineering', icon: '⚙️', kind: 'uni', length: 48, tuition: 13000, degree: 'ba_eng', minSmarts: 55, desc: 'Build bridges. Literally.', req: needHS },
  { id: 'uni_bus', name: 'B.A. Business', icon: '💼', kind: 'uni', length: 48, tuition: 12000, degree: 'ba_bus', minSmarts: 40, desc: 'Finance, marketing, networking.', req: needHS },
  { id: 'uni_med', name: 'B.S. Pre-Med & Nursing', icon: '🩺', kind: 'uni', length: 48, tuition: 15000, degree: 'ba_med', minSmarts: 60, desc: 'The road to scrubs.', req: needHS },
  { id: 'uni_law', name: 'B.A. Political Science', icon: '⚖️', kind: 'uni', length: 48, tuition: 12000, degree: 'ba_law', minSmarts: 48, desc: 'Pre-law. Debate everyone.', req: needHS },
  { id: 'uni_arts', name: 'B.F.A. Arts & Media', icon: '🎭', kind: 'uni', length: 48, tuition: 11000, degree: 'ba_arts', minSmarts: 30, desc: 'Film, music, writing, starving.', req: needHS },
  { id: 'uni_crim', name: 'B.S. Criminology', icon: '🕵️', kind: 'uni', length: 48, tuition: 10000, degree: 'ba_crim', minSmarts: 40, desc: 'Understand crime. Fight it. Or...', req: needHS },
  { id: 'uni_agri', name: 'B.S. Agriculture', icon: '🌾', kind: 'uni', length: 48, tuition: 7000, degree: 'ba_agri', minSmarts: 35, desc: 'Soil science and big tractors.', req: needHS },

  { id: 'grad_ms', name: "Master's Degree", icon: '🎓', kind: 'grad', length: 24, tuition: 18000, degree: 'ms', minSmarts: 58, desc: 'Specialize. Out-earn your peers.', req: needBA },
  { id: 'grad_mba', name: 'MBA', icon: '📊', kind: 'grad', length: 24, tuition: 32000, degree: 'mba', minSmarts: 50, desc: 'Expensive handshake school.', req: needBA },
  {
    id: 'grad_phd', name: 'PhD Program', icon: '🔬', kind: 'grad', length: 48, tuition: 0, degree: 'phd', minSmarts: 72, stipend: 1800,
    desc: 'Funded research. Paid in prestige (and a stipend).',
    req: (g) => (g.hasDegree('ms') || (anyBachelor(g) && g.s.stats.smarts >= 82) ? null : "Needs a master's degree"),
  },
  { id: 'grad_md', name: 'Medical School (M.D.)', icon: '⚕️', kind: 'grad', length: 48, tuition: 42000, degree: 'md', minSmarts: 72, desc: 'Become a doctor. Bring coffee.', req: (g) => (g.hasDegree('ba_med') ? null : 'Needs a Pre-Med degree') },
  { id: 'grad_jd', name: 'Law School (J.D.)', icon: '🏛️', kind: 'grad', length: 36, tuition: 38000, degree: 'jd', minSmarts: 62, desc: 'Pass the bar. Bill by the hour.', req: needBA },

  { id: 'trade_elec', name: 'Electrician Program', icon: '⚡', kind: 'trade', length: 24, tuition: 4500, degree: 'trade_elec', minSmarts: 25, desc: 'Good money, no student debt.', req: needHS },
  { id: 'trade_mech', name: 'Auto Mechanic Program', icon: '🔧', kind: 'trade', length: 24, tuition: 4000, degree: 'trade_mech', minSmarts: 20, desc: 'Grease, engines, respect.', req: needHS },
  { id: 'cc_assoc', name: 'Associate Degree', icon: '🏫', kind: 'cc', length: 24, tuition: 3800, degree: 'assoc', minSmarts: 15, desc: 'Cheap credits. Transfer to a university later.', req: (g) => (g.age < 18 ? 'Must be 18' : needHS(g)) },
  { id: 'cc_night', name: 'Associate Degree (Night)', icon: '🌙', kind: 'cc', night: true, length: 30, tuition: 3800, degree: 'assoc', minSmarts: 15, desc: 'Evening classes around a day job.', req: (g) => (g.age < 18 ? 'Must be 18' : needHS(g)) },
  { id: 'trade_chef', name: 'Culinary School', icon: '🔪', kind: 'trade', length: 18, tuition: 7000, degree: 'culinary', minSmarts: 20, desc: 'Yes, chef.', req: () => null },
  {
    id: 'academy', name: 'Police Academy', icon: '🚓', kind: 'academy', length: 6, tuition: 0, degree: 'academy', minSmarts: 25,
    desc: 'Six months to a badge. Clean record required.',
    req: (g) => {
      if (!hasHS(g)) return 'Needs a high school diploma or GED';
      if (g.age < 18) return 'Must be 18+';
      if (g.s.crime.record.length) return 'Criminal record — rejected';
      if (g.s.stats.fitness < 40) return 'Needs Fitness 40+';
      return null;
    },
  },
];

export const PROGRAM_BY_ID: Record<string, ProgramDef> = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

export const DEGREE_LABEL: Record<string, string> = {
  hs: 'High School Diploma',
  ged: 'GED',
  ba_cs: 'B.S. Computer Science',
  ba_eng: 'B.S. Engineering',
  ba_bus: 'B.A. Business',
  ba_med: 'B.S. Pre-Med',
  ba_law: 'B.A. Political Science',
  ba_arts: 'B.F.A. Arts',
  ba_crim: 'B.S. Criminology',
  ba_agri: 'B.S. Agriculture',
  ms: "Master's",
  mba: 'MBA',
  phd: 'PhD',
  md: 'M.D.',
  jd: 'J.D.',
  trade_elec: 'Licensed Electrician',
  trade_mech: 'Certified Mechanic',
  culinary: 'Culinary Diploma',
  academy: 'Police Academy',
  assoc: 'Associate Degree',
};
