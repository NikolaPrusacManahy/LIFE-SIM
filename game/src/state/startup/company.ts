import type { Game } from '../Game';
import type { Appeal, Building, IdeaId, SkillBranch, Startup, Status } from './types';
import { APPEAL, BUILDINGS, BUILDING_ORDER, IDEAS, INVESTOR_NAMES, ROUNDS, SKILLS, SKILL_ORDER, STATUS, STATUS_ORDER, STATUS_POINTS, WAGES, skillCost, type RoundId } from './data';
import { fmt } from '../systems/finance';

// Update 0.11 — START-UP: found it, fund it, grow it. Every management move is one computer action.

/** Update 0.12 — every branch at 0 (also fills new branches into older saves). */
export const blankSkills = (): Startup['skills'] => Object.fromEntries(SKILL_ORDER.map((k) => [k, 0])) as Startup['skills'];

export const startup = (g: Game) => (g.s.startup && !g.s.startup.closed ? g.s.startup : null);
export const headcount = (c: Startup) => c.staff.employees + c.staff.supervisors + (c.staff.manager ? 1 : 0) + (c.staff.hr ? 1 : 0);

export function foundLock(g: Game, idea: IdeaId, invest: number): string | null {
  if (g.age < 16) return 'Must be 16';
  if (startup(g)) return 'You already run a company';
  if (invest < IDEAS[idea].found) return `Needs at least ${fmt(IDEAS[idea].found)}`;
  if (!g.canAfford(invest)) return 'Not enough money';
  return null;
}

export function found(g: Game, name: string, idea: IdeaId, appeal: Appeal, invest: number): string {
  if (foundLock(g, idea, invest)) return '';
  g.money(-invest);
  g.s.startup = {
    name: name.trim() || `${IDEAS[idea].name} Inc.`, idea, appeal, founded: g.s.clock, building: 'room', cash: invest,
    hype: appeal === 'easy' ? 25 : appeal === 'normal' ? 15 : 10, progress: 0, quality: 40, version: 0, revenue: 0, profit: 0,
    staff: { employees: 0, supervisors: 0, manager: false, hr: false }, investors: [], stake: 1,
    skills: blankSkills(), points: 0, status: 'founder', redMonths: 0, greenMonths: 0, paid: 0, closed: false,
  };
  g.milestone(`Founded ${g.s.startup.name}`);
  return `🚀 ${g.s.startup.name} is born — in your bedroom, with ${fmt(invest)} and a dream.`;
}

// ---------------------------------------------------------------- numbers

export function revenueOf(c: Startup): number {
  if (!c.version) return 0;
  const idea = IDEAS[c.idea];
  const versionF = Math.min(1, 0.45 + c.version * 0.2);
  return Math.round(idea.potential * APPEAL[c.appeal].ceiling * Math.pow(c.hype / 100, 1.5) * (c.quality / 100) * versionF * (1 + 0.15 * c.skills.profit));
}

export function wagesOf(c: Startup): number {
  const s = c.staff;
  const raw = s.employees * WAGES.employee + s.supervisors * WAGES.supervisor + (s.manager ? WAGES.manager : 0) + (s.hr ? WAGES.hr : 0);
  return Math.round(raw * (1 - 0.1 * c.skills.payroll) * (s.hr ? 0.95 : 1));
}

export const costsOf = (c: Startup) => wagesOf(c) + BUILDINGS[c.building].rent;

/** It's a real business: a quarter of each month's profit is paid out, your share lands in your bank account (taxed). */
export const DIVIDEND = 0.25;
export const DIVIDEND_TAX = 0.25;
/** Update 0.12 — the Dividend skill pays out more. */
export const dividendRate = (c: Startup) => DIVIDEND + 0.05 * c.skills.dividend;
/** Update 0.12 — the Office space skill fits more people in each building. */
export const capOf = (c: Startup) => Math.floor(BUILDINGS[c.building].cap * (1 + 0.1 * c.skills.space));

/** Development per month, in progress points (100 = a launch). */
export function outputOf(c: Startup): number {
  const s = c.staff;
  const units = (6 + s.employees * 4 + s.supervisors * 6) * (s.manager ? 1.2 : 1) * (1 + 0.2 * c.skills.speed);
  // every new version is a bigger job than the last
  return Math.round((units / (IDEAS[c.idea].work * (1 + 0.6 * c.version))) * 1000) / 10;
}

export function valuationOf(c: Startup): number {
  const brand = (c.hype / 100) * IDEAS[c.idea].potential * APPEAL[c.appeal].ceiling * 3;
  return Math.max(0, Math.round(Math.max(0, c.cash) + revenueOf(c) * 12 * 3 + brand));
}

export const stakeValue = (g: Game) => {
  const c = startup(g);
  return c ? Math.round(valuationOf(c) * c.stake) : 0;
};

export function statusOf(c: Startup): Status {
  const v = valuationOf(c);
  let best: Status = 'founder';
  for (const st of STATUS_ORDER) if (v >= STATUS[st].at && (st !== 'diplomatic' || c.building === 'skyscraper')) best = st;
  return best;
}

/** Diplomatic status is for life: immunity from police and scandals (hard safety rules still apply). */
export function refreshStatus(g: Game) {
  const c = startup(g);
  if (!c) return;
  const next = statusOf(c);
  if (STATUS_ORDER.indexOf(next) > STATUS_ORDER.indexOf(c.status)) {
    c.status = next;
    c.points += STATUS_POINTS;
    g.banner(`${STATUS[next].icon} ${STATUS[next].name.toUpperCase()}`, 0xffd166);
    g.milestone(`Became a ${STATUS[next].name} (${c.name})`);
    if (next === 'diplomatic') {
      g.setFlag('diplomatic');
      g.fame(20);
    }
  }
}

// ---------------------------------------------------------------- actions (each is one computer action)

const need = (c: Startup, cost: number) => (c.cash >= cost ? null : `Company needs ${fmt(cost)}`);

export const MARKETING = [
  { id: 'social', name: 'Social campaign', icon: '📣', cost: 5000, hype: 6 },
  { id: 'ads', name: 'Ad blitz', icon: '📺', cost: 50000, hype: 12 },
  { id: 'event', name: 'Launch event', icon: '🎤', cost: 500000, hype: 20 },
  { id: 'superbowl', name: 'Prime-time ad', icon: '🏈', cost: 3000000, hype: 30 },
] as const;

export function marketing(g: Game, id: string): string {
  const c = startup(g);
  const m = MARKETING.find((x) => x.id === id);
  if (!c || !m || need(c, m.cost)) return '';
  c.cash -= m.cost;
  const gain = Math.round(m.hype * (1 - c.hype / 150) * (1 + 0.2 * c.skills.marketing));
  c.hype = Math.min(100, c.hype + gain);
  return `${m.icon} ${m.name}: hype +${gain}.`;
}

export type HireKind = 'employee' | 'supervisor' | 'manager' | 'hr';

export function hireLock(c: Startup, kind: HireKind, n = 1): string | null {
  if (kind === 'supervisor' && c.staff.employees < (c.staff.supervisors + 1) * 5) return 'Needs 5 employees per supervisor';
  if (kind === 'manager' && (c.staff.manager || c.building === 'room')) return c.staff.manager ? 'Already hired' : 'Needs an office';
  if (kind === 'hr' && (c.staff.hr || headcount(c) < 10)) return c.staff.hr ? 'Already hired' : 'Needs 10+ staff';
  const room = capOf(c) - headcount(c);
  if (room < n) return `No room (${BUILDINGS[c.building].name} fits ${capOf(c)})`;
  return null;
}

export function hire(g: Game, kind: HireKind, n = 1): string {
  const c = startup(g);
  if (!c || hireLock(c, kind, n)) return '';
  if (kind === 'employee') c.staff.employees += n;
  else if (kind === 'supervisor') c.staff.supervisors += n;
  else if (kind === 'manager') c.staff.manager = true;
  else c.staff.hr = true;
  return kind === 'employee' ? `Hired ${n} employee${n > 1 ? 's' : ''}. Payroll ${fmt(wagesOf(c))}/mo.` : `Hired a ${kind === 'hr' ? 'head of HR' : kind}.`;
}

export function layOff(g: Game, n: number): string {
  const c = startup(g);
  if (!c || c.staff.employees <= 0) return '';
  const k = Math.min(n, c.staff.employees);
  c.staff.employees -= k;
  c.hype = Math.max(0, c.hype - 2);
  return `Laid off ${k}. The office went quiet.`;
}

/** You code all night yourself. */
export function crunch(g: Game): string {
  const c = startup(g);
  if (!c || c.progress >= 100) return '';
  const pts = Math.round(4 + g.s.stats.smarts / 12 + g.s.stats.creativity / 20 + 2 * c.skills.crunch);
  c.progress = Math.min(100, c.progress + pts);
  g.stat('energy', -(12 - 2 * c.skills.crunch));
  return `☕ You worked through the night. Development +${pts}%.`;
}

export function launch(g: Game): string {
  const c = startup(g);
  if (!c || c.progress < 100) return '';
  c.version++;
  c.progress = 0;
  c.quality = Math.min(100, c.quality + 5 + 2 * c.skills.quality);
  c.hype = Math.min(100, c.hype + 10);
  c.revenue = revenueOf(c);
  c.points++;
  g.fame(2);
  g.burst('confetti');
  g.milestone(`${c.name} launched v${c.version}`);
  refreshStatus(g);
  return `🎉 ${c.name} v${c.version} is out! Revenue now ${fmt(c.revenue)}/mo.`;
}

export function pitchOdds(g: Game, c: Startup): number {
  const o = 0.25 + c.hype / 250 + g.s.stats.charm / 400 + g.s.stats.smarts / 500 + APPEAL[c.appeal].pitch + 0.05 * c.skills.pitch - IDEAS[c.idea].risk + (c.version ? 0.1 : 0);
  return Math.max(0.05, Math.min(0.9, o));
}

export function pitchLock(g: Game, round: RoundId): string | null {
  const c = startup(g);
  const r = ROUNDS.find((x) => x.id === round)!;
  if (!c) return 'No company';
  if (valuationOf(c) < r.minVal) return `Valuation ${fmt(r.minVal)}+`;
  if (g.flag(`pitch:${round}`) === g.s.clock + 1) return 'Pitched this month';
  return null;
}

/** Investors put in money for a share of the company. */
export function pitch(g: Game, round: RoundId): string {
  const c = startup(g);
  const r = ROUNDS.find((x) => x.id === round);
  if (!c || !r || pitchLock(g, round)) return '';
  g.setFlag(`pitch:${round}`, g.s.clock + 1);
  if (Math.random() >= pitchOdds(g, c)) {
    c.hype = Math.max(0, c.hype - 4);
    return `${r.icon} The ${r.name.toLowerCase()} passed. “Not for us right now.”`;
  }
  const val = valuationOf(c);
  const amount = Math.round(Math.max(r.min, Math.min(r.max, Math.max(val, r.min) * (0.15 + Math.random() * 0.2))));
  const share = (amount / (val + amount)) * (1 - 0.08 * c.skills.terms);
  c.stake *= 1 - share;
  for (const inv of c.investors) inv.stake *= 1 - share;
  c.investors.push({ name: g.pick(INVESTOR_NAMES), amount, stake: share });
  c.cash += amount;
  c.hype = Math.min(100, c.hype + 5);
  refreshStatus(g);
  return `${r.icon} Deal! ${fmt(amount)} for ${(share * 100).toFixed(1)}% of ${c.name}. You still own ${(c.stake * 100).toFixed(1)}%.`;
}

export function investOwn(g: Game, amount: number): string {
  const c = startup(g);
  if (!c || amount <= 0 || !g.canAfford(amount)) return '';
  g.money(-amount);
  c.cash += amount;
  return `You put ${fmt(amount)} of your own money into ${c.name}.`;
}

/** Pay yourself from company cash (taxed; investors notice big payouts). */
export function payYourself(g: Game, amount: number): string {
  const c = startup(g);
  if (!c || amount <= 0 || c.cash < amount) return '';
  c.cash -= amount;
  const net = Math.round(amount * 0.75);
  g.money(net);
  if (amount > Math.max(0, c.profit)) c.hype = Math.max(0, c.hype - 2);
  return `You paid yourself ${fmt(amount)} (${fmt(net)} after tax).`;
}

export function nextBuilding(c: Startup): Building | null {
  const i = BUILDING_ORDER.indexOf(c.building);
  return BUILDING_ORDER[i + 1] ?? null;
}

export function upgradeBuilding(g: Game): string {
  const c = startup(g);
  const next = c && nextBuilding(c);
  if (!c || !next || need(c, BUILDINGS[next].upgrade)) return '';
  c.cash -= BUILDINGS[next].upgrade;
  c.building = next;
  c.points++;
  c.hype = Math.min(100, c.hype + 5);
  g.milestone(`${c.name} moved into a ${BUILDINGS[next].name.toLowerCase()}`);
  refreshStatus(g);
  return `${BUILDINGS[next].icon} ${c.name} moved into a ${BUILDINGS[next].name.toLowerCase()}!`;
}

/** Skill points are spent freely (no action). */
export function learnSkill(g: Game, b: SkillBranch): string {
  const c = startup(g);
  if (!c || c.skills[b] >= SKILLS[b].max || c.points < skillCost(c.skills[b])) return '';
  c.points -= skillCost(c.skills[b]);
  c.skills[b]++;
  return `${SKILLS[b].icon} ${SKILLS[b].name} ${c.skills[b]}/${SKILLS[b].max}: ${SKILLS[b].per}.`;
}

/** Cash out: sell the whole company. */
export function sellCompany(g: Game): string {
  const c = startup(g);
  if (!c) return '';
  const take = Math.round(valuationOf(c) * c.stake);
  g.money(take);
  c.closed = true;
  g.milestone(`Sold ${c.name} for ${fmt(valuationOf(c))}`);
  return `🤝 You sold ${c.name}. Your share: ${fmt(take)}.`;
}
