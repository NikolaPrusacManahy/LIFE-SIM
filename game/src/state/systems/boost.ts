import type { Game } from '../Game';
import { STAT_LABEL, type StatKey } from '../types';
import { USD_PER_EUR } from '../rules/us';
import { fmt } from './finance';

// Update 0.11 — "Stats on steroids": buy stat levels with real money (computer app). Karma can't be bought.

/** Every stat that can be bought (karma is a meter, not a stat). */
export const BOOST_STATS: StatKey[] = ['health', 'mood', 'energy', 'smarts', 'fitness', 'charm', 'creativity', 'looks', 'street'];
/** These two can also have their maximum raised. */
export const CAP_STATS = ['health', 'energy'] as const;
export type CapStat = (typeof CAP_STATS)[number];
export const BASE_CAP = 100;
export const CAP_MAX = 300;
/** 100 per level in your own currency: $100 on a US life, €100 on an EU life. */
export const LEVEL_LOCAL = 100;

/** Price of one level, in dollars (the game's internal money). */
export const levelPrice = (g: Game) => (g.s.rules === 'eu' ? Math.round(LEVEL_LOCAL * USD_PER_EUR) : LEVEL_LOCAL);
const levels = (from: number, to: number) => Math.max(0, Math.ceil(to - from - 1e-9));

export const boostCost = (g: Game, k: StatKey, target: number) => levels(g.s.stats[k], target) * levelPrice(g);

export function boostLock(g: Game, k: StatKey, target: number): string | null {
  if (!BOOST_STATS.includes(k)) return 'Can’t be bought';
  if (!Number.isFinite(target) || target <= Math.floor(g.s.stats[k])) return 'Already there';
  if (target > g.maxOf(k)) return `Max ${g.maxOf(k)}`;
  if (!g.canAfford(boostCost(g, k, target))) return 'Not enough money';
  return null;
}

/** Set a stat to the level you paid for. */
export function boostStat(g: Game, k: StatKey, target: number): string {
  const t = Math.round(target);
  if (boostLock(g, k, t)) return '';
  const cost = boostCost(g, k, t);
  const before = Math.round(g.s.stats[k]);
  g.money(-cost);
  g.s.stats[k] = t;
  return `💉 ${STAT_LABEL[k]} ${before} → ${t} for ${fmt(cost)}.`;
}

export const capCost = (g: Game, k: CapStat, target: number) => levels(g.maxOf(k), target) * levelPrice(g);

export function capLock(g: Game, k: CapStat, target: number): string | null {
  if (!Number.isFinite(target) || target <= g.maxOf(k)) return 'Already there';
  if (target > CAP_MAX) return `Max ${CAP_MAX}`;
  if (!g.canAfford(capCost(g, k, target))) return 'Not enough money';
  return null;
}

/** Raise the maximum health or energy (up to 300). The current value stays; fill it up separately. */
export function raiseCap(g: Game, k: CapStat, target: number): string {
  const t = Math.round(target);
  if (capLock(g, k, t)) return '';
  const cost = capCost(g, k, t);
  const before = g.maxOf(k);
  g.money(-cost);
  g.s.statCaps[k] = t;
  return `🧬 Max ${STAT_LABEL[k].toLowerCase()} ${before} → ${t} for ${fmt(cost)}.`;
}
