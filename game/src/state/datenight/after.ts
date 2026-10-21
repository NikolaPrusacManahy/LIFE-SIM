import type { Person } from '../types';

// Update 0.12 — the end of a date: the spark you built decides what you can ask for.

/** Spark needed to ask: a second date, friends with benefits, a one-night stand. */
export const AFTER_AT = { second: 40, fwb: 60, ons: 70 } as const;
export type AfterAsk = keyof typeof AFTER_AT;

/** How likely they say yes: mostly the spark, plus how they feel about you. */
export function afterOdds(p: Person, spark: number, ask: AfterAsk): number {
  const base = ask === 'second' ? 0.35 : ask === 'fwb' ? 0.1 : 0.15;
  const o = base + (spark - AFTER_AT[ask]) / 60 + p.attraction / 300 + (ask === 'second' ? p.romance / 300 : 0);
  return Math.max(0.05, Math.min(0.95, o));
}
