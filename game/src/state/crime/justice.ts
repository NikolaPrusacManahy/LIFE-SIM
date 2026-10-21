import type { Game } from '../Game';
import type { CrimeCase } from './types';
import { CRIME_BY_ID } from './catalog';
import { caseStrength, recomputeWanted } from './investigation';
import { sendToJail } from '../systems/crime';
import { fmt } from '../systems/finance';
import { lastName } from '../data/names';

// Update 0.5 — arrest → trial → sentence. Under-18 players never reach this (juvenile system only).

export type Lawyer = 'public' | 'private' | 'crooked';
export const LAWYER_COST: Record<Lawyer, (sev: number) => number> = { public: () => 0, private: (sev) => 8000 * sev, crooked: (sev) => 20000 + 5000 * sev };

export const caseById = (g: Game, id: string) => g.s.underworld.cases.find((c) => c.id === id) ?? null;

/** Chance a jury convicts: evidence vs lawyer, charm and fame. */
export function convictOdds(g: Game, c: CrimeCase, lawyer: Lawyer): number {
  const ev = caseStrength(c) / 100;
  const law = lawyer === 'private' ? 0.22 : lawyer === 'crooked' ? 0.32 : 0.05;
  const o = 0.25 + ev * 0.8 - law - (g.s.stats.charm - 50) / 300 + (g.s.fame > 40 ? 0.05 : 0);
  return Math.max(0.05, Math.min(0.97, o));
}

export function sentenceFor(g: Game, c: CrimeCase, mult = 1): number {
  const def = CRIME_BY_ID[c.crimeId];
  const [lo, hi] = def?.sentence ?? [6, 24];
  return Math.max(1, Math.round(g.rand(lo, hi) * mult));
}

/** Guilty: prison, assets seized, record. */
export function convict(g: Game, c: CrimeCase, mult = 1): string {
  const u = g.s.underworld;
  c.status = 'closed';
  const months = sentenceFor(g, c, mult);
  const seized = u.dirty;
  u.dirty = 0;
  if (c.sev >= 4) {
    u.business = null;
    u.properties = u.properties.filter((p) => p.kind === 'storage' && g.chance(0.5));
  }
  for (const p of g.s.people) if (p.status === 'captive') { p.status = 'alive'; p.tags = p.tags.filter((t) => t !== 'captive' && t !== 'sedated'); }
  sendToJail(g, months, c.name);
  recomputeWanted(g);
  g.heat(-100);
  return `Guilty. ${months >= 600 ? 'Life in prison.' : `${Math.round(months / 12) || months} ${months >= 12 ? 'years' : 'months'} inside.`}${seized ? ` ${fmt(seized)} in dirty cash seized.` : ''}`;
}

export function acquit(g: Game, c: CrimeCase): string {
  c.status = 'closed';
  c.suspect = false;
  recomputeWanted(g);
  g.heat(-30);
  g.fame(2);
  return 'Not guilty. You walk out into a crowd of reporters.';
}

/** Give up your crew or supplier → lighter sentence + witness protection. */
export function witnessProtection(g: Game): string {
  const old = g.s.familyName;
  g.s.familyName = lastName();
  g.s.region = g.s.region === 'city' ? 'country' : 'city';
  g.s.housing = 'apartment';
  for (const p of g.s.people) {
    if (p.crewRole || p.labels.includes('rival')) {
      p.rivalry = 100;
      if (!p.labels.includes('enemy')) p.labels.push('enemy');
    }
  }
  g.s.underworld.business = null;
  g.milestone(`Entered witness protection (was ${old})`);
  return `New name: ${g.s.name} ${g.s.familyName}. New ${g.s.region === 'city' ? 'city' : 'town'}. Old friends want you dead.`;
}
