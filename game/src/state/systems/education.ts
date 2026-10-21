import type { Game } from '../Game';
import type { Enrollment } from '../types';
import { PROGRAM_BY_ID, PROGRAMS, DEGREE_LABEL, type ProgramDef } from '../data/programs';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const gpa = (perf: number) => (clamp(perf, 0, 100) / 25).toFixed(2);

export function gradeLabel(e: Enrollment) {
  const p = PROGRAM_BY_ID[e.program];
  if (p.kind === 'hs') return `Grade ${Math.min(12, 9 + Math.floor(e.months / 12))}`;
  if (p.kind === 'uni') return ['Freshman', 'Sophomore', 'Junior', 'Senior'][Math.min(3, Math.floor(e.months / 12))];
  return `Month ${e.months + 1}/${e.length}`;
}

export function enrollStatus(g: Game, p: ProgramDef): { visible: boolean; ok: boolean; reason?: string; chance: number } {
  if (p.kind === 'hs') return { visible: false, ok: false, chance: 0 };
  if (p.region && p.region !== g.s.region) return { visible: false, ok: false, chance: 0 };
  const r = (reason: string) => ({ visible: true, ok: false, reason, chance: 0 });
  if (g.hasDegree(p.degree)) return r('Already earned');
  if (g.s.education.current) return r('Already enrolled');
  if (g.age < 16) return r('Too young');
  const req = p.req?.(g);
  if (req) return r(req);
  if (g.onCooldown(`apply:${p.id}`)) return r('Rejected recently — try later');
  return { visible: true, ok: true, chance: admitChance(g, p) };
}

export function admitChance(g: Game, p: ProgramDef) {
  const sm = g.s.stats.smarts;
  if (p.kind === 'trade' || p.kind === 'cc') return 0.97;
  if (p.kind === 'academy') return clamp(0.55 + (g.s.stats.fitness - 40) / 60, 0.2, 0.95);
  const prior = g.flag('lastPerf') || 50;
  let c = 0.35 + (sm - p.minSmarts) / 45 + (prior - 55) / 110;
  if (g.flag('scholarship')) c += 0.1;
  if (g.hasDegree('assoc') && p.kind === 'uni') c += 0.2;
  if (g.flag('sat')) c += (g.flag('sat') - 1050) / 2000;
  if (g.flag('medVolunteer') >= 5 && (p.id === 'uni_med' || p.id === 'grad_md')) c += 0.08;
  if (g.flag('varsity') && p.kind === 'uni') c += 0.05;
  if (g.s.crime.record.length) c -= 0.12;
  return clamp(c, 0.03, 0.97);
}

export interface FundingOption {
  id: Enrollment['funding'];
  label: string;
  ok: boolean;
  reason?: string;
}

export function fundingOptions(g: Game, p: ProgramDef): FundingOption[] {
  if (p.tuition === 0) return [{ id: 'free', label: p.stipend ? `Funded + $${p.stipend}/mo stipend` : 'Free', ok: true }];
  const par = g.parents;
  const love = par.length ? Math.max(...par.map((x) => x.rel)) : 0;
  const parentsOk = par.length > 0 && g.s.background !== 'poor' && love >= 45 && g.age < 30 && (p.tuition < 20000 || g.s.background === 'rich');
  const schol = (g.s.stats.smarts >= 80 && g.flag('lastPerf') >= 82) || g.flag('scholarship') > 0 || (g.flag('varsity') > 0 && g.s.stats.fitness >= 70 && p.kind === 'uni');
  const monthly = Math.round(p.tuition / 12);
  return [
    { id: 'scholarship', label: 'Full Scholarship', ok: schol && p.kind === 'uni', reason: 'Needs elite grades, a science award, or varsity sports' },
    { id: 'parents', label: 'Parents pay', ok: parentsOk, reason: 'Parents can’t or won’t pay' },
    { id: 'cash', label: `Pay $${monthly.toLocaleString()}/mo`, ok: g.s.money >= monthly * 3, reason: 'Need 3 months of tuition saved' },
    { id: 'loan', label: `Student loan (+$${monthly.toLocaleString()}/mo debt)`, ok: true },
  ];
}

export function enroll(g: Game, programId: string, funding: Enrollment['funding']): { ok: boolean; text: string } {
  const p = PROGRAM_BY_ID[programId];
  const st = enrollStatus(g, p);
  if (!st.ok) return { ok: false, text: st.reason ?? 'Cannot enroll.' };
  if (!g.chance(st.chance)) {
    g.cooldown(`apply:${p.id}`, 24);
    g.stat('mood', -5);
    g.log(`✉️ Rejected from ${p.name}.`, 'bad');
    return { ok: false, text: `Rejected from ${p.name}. Improve your Smarts and grades, then try again in six months.` };
  }
  g.s.education.current = { program: p.id, months: 0, length: p.length, perf: 55, skips: 0, attended: 0, warnings: 0, funding };
  if (funding === 'scholarship') g.achieve('scholar');
  if (funding === 'parents') for (const par of g.parents) g.rel(par, 4);
  g.stat('mood', 10);
  g.burst('confetti');
  g.milestone(`Enrolled in ${p.name}`);
  return { ok: true, text: `Accepted into ${p.name}! Classes start now.` };
}

export function dropOut(g: Game, why = 'Dropped out') {
  const e = g.s.education.current;
  if (!e) return;
  const p = PROGRAM_BY_ID[e.program];
  g.s.education.current = null;
  g.setFlag('dropout');
  g.milestone(`${why} of ${p.name}`);
}

export function graduate(g: Game) {
  const e = g.s.education.current;
  if (!e) return;
  const p = PROGRAM_BY_ID[e.program];
  g.s.education.degrees.push(p.degree);
  g.setFlag('lastPerf', Math.round(e.perf));
  g.s.education.current = null;
  g.burst('confetti');
  g.banner(`🎓 ${DEGREE_LABEL[p.degree]}`, 0x7ae582);
  g.milestone(`Graduated: ${DEGREE_LABEL[p.degree]} (GPA ${gpa(e.perf)})`);
  if (p.degree === 'hs') g.achieve('diploma');
  if (p.degree === 'phd') g.achieve('doctorate');
  if (p.degree === 'md') g.achieve('doctor');
  if (p.degree === 'jd') g.achieve('lawyer');
  if (e.perf >= 92) g.achieve('valedictorian');
}

export const passMark = (p: ProgramDef) => (p.kind === 'hs' ? 33 : p.kind === 'academy' ? 30 : 40);

export function educationMonth(g: Game) {
  const e = g.s.education.current;
  if (!e) return;
  const p = PROGRAM_BY_ID[e.program];
  const offSeason = (p.kind === 'hs' || p.kind === 'uni') && g.isSummer;
  if (!offSeason) {
    e.perf = clamp(e.perf - 1.5, 0, 100);
    // Skipping every class slot in a month earns a warning.
    if (e.skips > 0 && e.attended === 0) {
      e.warnings++;
      g.queue('school_warning', { n: e.warnings, skips: e.skips });
    }
  }
  e.skips = 0;
  e.attended = 0;
  e.months++;
  if (e.months >= e.length) g.queue('graduation');
}

export function availablePrograms(g: Game) {
  return PROGRAMS.map((p) => ({ p, st: enrollStatus(g, p) })).filter((x) => x.st.visible);
}
