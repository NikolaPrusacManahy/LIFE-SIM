import type { Game } from '../Game';
import { CAREER_BY_ID } from '../data/careers';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Raise current enrollment performance, scaled by Smarts and traits. */
export function studyPerf(g: Game, base: number) {
  const e = g.s.education.current;
  if (!e) return;
  let m = base > 0 ? 0.55 + g.s.stats.smarts / 110 : 1;
  if (base > 0 && g.hasTrait('ambitious')) m *= 1.4;
  if (base > 0 && g.hasTrait('rebel')) m *= 0.8;
  e.perf = clamp(e.perf + base * m, 0, 100);
}

/** Raise job performance, scaled by the career's key stat. */
export function jobPerf(g: Game, base: number) {
  const j = g.s.job;
  if (!j) return;
  const c = CAREER_BY_ID[j.careerId];
  let m = base > 0 ? 0.55 + g.s.stats[c.stat] / 110 : 1;
  if (base > 0 && g.hasTrait('ambitious')) m *= 1.4;
  j.perf = clamp(j.perf + base * m, 0, 100);
}

export const jobFlavor = (g: Game) => {
  const j = g.s.job;
  return j ? g.pick(CAREER_BY_ID[j.careerId].flavor) : '';
};

export const pct = (p: number) => `${Math.round(p * 100)}%`;

/** Teens living at home who stay out at night can get caught by their parents. */
export function curfew(g: Game) {
  if (g.age < 18 && g.livesWithParents && g.phase === 'night' && g.chance(0.2)) g.queue('curfew');
}

/** Small chance to meet someone new. */
export function maybeMeet(g: Game, p: number, where: string) {
  if (!g.queued('meet_someone') && g.chance(p)) g.queue('meet_someone', { where });
}
