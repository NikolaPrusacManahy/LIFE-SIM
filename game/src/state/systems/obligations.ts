import type { Game } from '../Game';
import { PROGRAM_BY_ID } from '../data/programs';
import { CAREER_BY_ID } from '../data/careers';

export interface Obligation {
  kind: 'school' | 'work' | 'service';
  label: string;
  icon: string;
  loc: string;
  acts: string[];
}

export const SCHOOL_ACTS = ['class_attend', 'class_focus', 'class_sleep', 'class_clown', 'cheat_test'];
export const LECTURE_ACTS = ['lecture_attend', 'lecture_focus', 'lecture_doze'];
export const ACADEMY_ACTS = ['academy_train', 'academy_drill'];
export const CC_ACTS = ['cc_attend', 'cc_focus'];
export const SERVICE_ACTS = ['community_service'];
export const WORK_ACTS = ['work_shift', 'work_hard', 'work_slack', 'work_network'];

export function currentObligations(g: Game): Obligation[] {
  const out: Obligation[] = [];
  if (g.jailed || g.s.dead) return out;
  const ph = g.phase;
  const e = g.s.education.current;
  if (e) {
    const p = PROGRAM_BY_ID[e.program];
    const daytime = ph === 'morning' || ph === 'afternoon';
    if (p.kind === 'hs') {
      if (!g.isSummer && daytime) out.push({ kind: 'school', label: 'School is in session', icon: '🏫', loc: 'school', acts: SCHOOL_ACTS });
    } else if (p.kind === 'cc') {
      if (ph === (p.night ? 'evening' : 'morning')) out.push({ kind: 'school', label: `${p.name} class`, icon: p.icon, loc: 'college', acts: CC_ACTS });
    } else if (p.kind === 'academy') {
      if (daytime) out.push({ kind: 'school', label: 'Academy training', icon: '🚓', loc: 'campus', acts: ACADEMY_ACTS });
    } else if (ph === 'morning' && !(g.isSummer && p.kind === 'uni')) {
      out.push({ kind: 'school', label: `${p.name} lectures`, icon: p.icon, loc: 'campus', acts: LECTURE_ACTS });
    }
  }
  // Update 0.3 — court-ordered community service, evenings
  if (g.flag('serviceLeft') > 0 && ph === 'evening') out.push({ kind: 'service', label: `Community service (${g.flag('serviceLeft')} left)`, icon: '🧹', loc: 'church', acts: SERVICE_ACTS });
  const j = g.s.job;
  if (j) {
    const c = CAREER_BY_ID[j.careerId];
    if (c.shift.includes(ph)) out.push({ kind: 'work', label: `${c.levels[j.level].title} shift`, icon: c.icon, loc: 'work', acts: WORK_ACTS });
  }
  return out;
}

export function recordSkips(g: Game, obs: Obligation[], actId: string) {
  for (const ob of obs) {
    const e = g.s.education.current;
    if (ob.acts.includes(actId)) {
      if (ob.kind === 'school' && e) e.attended++;
      if (ob.kind === 'work' && g.s.job) g.s.job.worked = (g.s.job.worked ?? 0) + 1;
      continue;
    }
    if (ob.kind === 'school' && e) {
      e.skips++;
      e.perf = Math.max(0, e.perf - 2.5);
      if (g.hasTrait('rebel')) g.stat('mood', 2);
    }
    if (ob.kind === 'service' && g.inc('serviceSkips') >= 4) {
      g.setFlag('serviceSkips', 0);
      if (!g.queued('probation_violation')) g.queue('probation_violation');
    }
    if (ob.kind === 'work' && g.s.job) {
      g.s.job.skips++;
      g.s.job.perf = Math.max(0, g.s.job.perf - 4);
    }
  }
}
