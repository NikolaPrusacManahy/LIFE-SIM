import type { Game } from '../Game';
import type { Person } from '../types';
import { settings } from '../settings';

// Update 0.5 — HARD RULES shared by every crime module.
//  1. Minors are never crime targets.            → isValidCrimeTarget()
//  2. Crime and intimacy never mix.               → cannotConsent() (checked inside canBeIntimate())
//  3. Dark Crime toggle gates violent/capital/organised crime.

/** Captive, sedated, heavily intoxicated, or being blackmailed by the player. */
export function cannotConsent(g: Game, p: Person): boolean {
  if (p.status === 'captive') return true;
  if (p.tags.includes('sedated') || p.tags.includes('intox:very')) return true;
  if (g.s.underworld?.blackmail.some((b) => b.pid === p.id)) return true;
  return false;
}

export const darkCrimeOn = () => settings.darkCrime && settings.isAdult;

/** Every crime target list goes through this. */
export const CRIME_TARGET_AUDIT: { npcAge: number; playerAge: number; crime: string }[] = [];

export function isValidCrimeTarget(g: Game, p: Person, dark: boolean): boolean {
  if (!p.alive || p.status === 'dead' || p.status === 'moved') return false;
  if (g.ageOf(p) < 18) return false;
  if (g.age < 18) return false;
  if (dark && !darkCrimeOn()) return false;
  return true;
}

/** Record (and enforce) a target at the moment a crime resolves. */
export function auditTarget(g: Game, p: Person, crime: string) {
  CRIME_TARGET_AUDIT.push({ npcAge: g.ageOf(p), playerAge: g.age, crime });
  if (CRIME_TARGET_AUDIT.length > 5000) CRIME_TARGET_AUDIT.splice(0, 1000);
  if (g.ageOf(p) < 18 || g.age < 18) throw new Error(`invalid crime target for ${crime}`);
}
