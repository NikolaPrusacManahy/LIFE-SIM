import type { Game } from '../Game';
import type { StatKey } from '../types';
import { CAREERS, CAREER_BY_ID, type CareerDef } from '../data/careers';
import { DEGREE_LABEL } from '../data/programs';
import { ASSET_BY_ID, fmt } from './finance';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function hasCareerDegree(g: Game, c: CareerDef) {
  if (!c.degree) return true;
  return c.degree.some((d) => (d === 'selftaught' ? g.flag('coder') >= 30 : g.hasDegree(d)));
}

export function careerStatus(g: Game, c: CareerDef): { visible: boolean; ok: boolean; reason?: string; chance: number } {
  const no = (reason: string) => ({ visible: true, ok: false, reason, chance: 0 });
  if (c.hidden) return { visible: false, ok: false, chance: 0 };
  if (c.region && c.region !== g.s.region) return { visible: false, ok: false, chance: 0 };
  if (g.age < 16 && c.track !== 'teen' && c.track !== 'creative') return { visible: false, ok: false, chance: 0 };
  if (g.age < c.minAge) return no(`Must be ${c.minAge}+`);
  if (c.maxAge && g.age > c.maxAge) return { visible: false, ok: false, chance: 0 };
  if (g.s.job?.careerId === c.id) return no('Your current job');
  if (!hasCareerDegree(g, c)) {
    const names = c.degree!.map((d) => (d === 'selftaught' ? 'self-taught coder' : DEGREE_LABEL[d] ?? d));
    return no(`Needs ${names.join(' or ')}`);
  }
  if (c.asset && !g.has(c.asset)) return no(`Needs ${ASSET_BY_ID[c.asset]?.name ?? c.asset}`);
  if (c.minStat) {
    for (const [k, v] of Object.entries(c.minStat)) {
      if (g.s.stats[k as StatKey] < (v as number)) return no(`Needs ${k[0].toUpperCase() + k.slice(1)} ${v}+`);
    }
  }
  if (c.noRecord && g.s.crime.record.length) return no('Criminal record — disqualified');
  const req = c.req?.(g);
  if (req) return no(req);
  if (g.onCooldown(`job:${c.id}`)) return no('Applied recently');
  return { visible: true, ok: true, chance: hireChance(g, c) };
}

export function hireChance(g: Game, c: CareerDef) {
  let p = 0.55 + (g.s.stats[c.stat] - c.difficulty) / 70;
  p += (g.s.stats.charm - 40) / 250;
  p -= g.s.crime.record.length * 0.12;
  if (g.flag('ivy')) p += 0.12;
  if (g.hasDegree('mba') && (c.id === 'finance' || c.id === 'marketing')) p += 0.1;
  p += g.s.fame / 500;
  if (c.track === 'teen') p += 0.2;
  return clamp(p, 0.05, 0.97);
}

export function applyJob(g: Game, id: string): { ok: boolean; text: string } {
  const c = CAREER_BY_ID[id];
  const st = careerStatus(g, c);
  if (!st.ok) return { ok: false, text: st.reason ?? 'Not eligible.' };
  if (!g.chance(st.chance)) {
    g.cooldown(`job:${c.id}`, 12);
    g.stat('mood', -3);
    return { ok: false, text: `${c.place} passed on you. Try again in a few months.` };
  }
  startJob(g, id);
  return { ok: true, text: `Hired at ${c.place} as ${c.levels[0].title}! Pay: ${fmt(c.levels[0].pay)}/mo.` };
}

export function startJob(g: Game, id: string, level = 0) {
  const c = CAREER_BY_ID[id];
  if (g.s.job) quitJob(g, true);
  g.s.job = { careerId: id, level, perf: 50, months: 0, monthsAtLevel: 0, warnings: 0, skips: 0 };
  g.stat('mood', 8);
  g.burst('confetti');
  if (!g.flag('firstJob')) {
    g.setFlag('firstJob');
    g.achieve('firstjob');
  }
  g.milestone(`Started working as ${c.levels[level].title} at ${c.place}`);
}

export function quitJob(g: Game, silent = false) {
  const j = g.s.job;
  if (!j) return;
  const c = CAREER_BY_ID[j.careerId];
  g.s.job = null;
  if (!silent) g.log(`You quit your job at ${c.place}.`, 'work');
}

export function promote(g: Game) {
  const j = g.s.job;
  if (!j) return;
  const c = CAREER_BY_ID[j.careerId];
  if (j.level >= c.levels.length - 1) return;
  j.level++;
  j.monthsAtLevel = 0;
  j.perf = 55;
  j.warnings = 0;
  g.stat('mood', 12);
  g.banner(`⬆ ${c.levels[j.level].title}`, 0xffd166);
  g.burst('confetti');
  g.milestone(`Promoted to ${c.levels[j.level].title} (${c.name})`);
  if (j.level === c.levels.length - 1) g.achieve('topjob');
  if (c.id === 'police' && j.level === c.levels.length - 1) g.achieve('commissioner');
}

export function fire(g: Game, reason: string) {
  const j = g.s.job;
  if (!j) return;
  const c = CAREER_BY_ID[j.careerId];
  g.s.job = null;
  g.stat('mood', -12);
  g.fx({ type: 'shake', power: 6 });
  g.inc('fired');
  g.milestone(`Fired from ${c.place} — ${reason}`);
}

export const salary = (g: Game) => {
  const j = g.s.job;
  if (!j) return 0;
  return CAREER_BY_ID[j.careerId].levels[j.level].pay;
};

/** One shift's worth of career stat gains. */
export function workGains(g: Game, mult = 1) {
  const j = g.s.job;
  if (!j) return;
  const c = CAREER_BY_ID[j.careerId];
  for (const [k, v] of Object.entries(c.gains)) g.stat(k as StatKey, (v as number) * mult);
  if (c.fame) g.fame(c.fame * 0.3 * mult * (1 + j.level * 0.5));
}

export function careerMonth(g: Game) {
  const j = g.s.job;
  if (!j) return;
  const c = CAREER_BY_ID[j.careerId];
  j.months++;
  j.monthsAtLevel++;
  const penalty = clamp(1 - j.skips * 0.12, 0.3, 1);
  let pay = c.levels[j.level].pay * penalty;
  if (c.fame) pay *= 1 + g.s.fame / 200;
  g.money(pay);
  j.perf = clamp(j.perf - 2, 0, 100);
  // Missing every shift in a month earns a warning.
  if (j.skips > 0 && !j.worked) {
    j.warnings++;
    g.log(`⚠️ Your boss noticed you missed ${j.skips} shifts. (Warning ${j.warnings}/3)`, 'bad');
    if (j.warnings >= 3) g.queue('fired', { reason: 'too many no-shows' });
  } else if (j.perf < 15 && g.chance(0.4)) {
    g.queue('fired', { reason: 'terrible performance' });
  }
  j.skips = 0;
  j.worked = 0;
  if (j.level < c.levels.length - 1 && j.perf >= 72 && j.monthsAtLevel >= c.promoMonths && g.chance(0.55)) {
    g.queue('promotion');
  }
  if (g.age >= 65 && !g.flag('retireOffered') && c.track !== 'special') {
    g.setFlag('retireOffered');
    g.queue('retirement');
  }
}

export function visibleCareers(g: Game) {
  return CAREERS.map((c) => ({ c, st: careerStatus(g, c) })).filter((x) => x.st.visible);
}
