import type { Game } from '../Game';
import type { LogKind, Phase, Region } from '../types';
import type { GateKey } from '../rules/us';

export type ActCategory =
  | 'rest' | 'study' | 'work' | 'social' | 'fitness' | 'fun' | 'money' | 'travel' | 'romance' | 'health' | 'faith' | 'panel' | 'crime';

export type PanelId = 'jobs' | 'school' | 'shop' | 'housing' | 'bank' | 'blackmarket' | 'crime';

export interface ActivityDef {
  id: string;
  loc: string;
  name: string;
  icon: string;
  desc: string;
  cat: ActCategory;
  /** energy spent; restoring activities use 0 and add energy in run() */
  energy: number;
  cost?: number | ((g: Game) => number);
  phases?: Phase[];
  /** content suitability only (legal ages go through `gate`) */
  minAge?: number;
  maxAge?: number;
  /** Update 0.3 — legal age gate from rules/us.ts */
  gate?: GateKey;
  /** 'illegalUnder21': minors may attempt it at a risk; a fake ID lets 16–20s into 21+ venues */
  legality?: 'legal' | 'illegal' | 'illegalUnder21';
  /** consequence preview chips, e.g. "Police 12%" */
  preview?: (g: Game) => string[];
  /** a 21+ venue (bar, club, casino): underage entry needs a fake ID */
  venue?: boolean;
  region?: Region;
  when?: (g: Game) => boolean;
  lock?: (g: Game) => string | null;
  /** turns before it can be done again */
  cooldown?: number;
  /** short label shown on the card, e.g. "62% success" */
  risk?: (g: Game) => string | null;
  kind?: LogKind;
  /** opens a UI panel instead of spending a turn */
  panel?: PanelId;
  run: (g: Game) => string;
}

export const NIGHT: Phase[] = ['night'];
export const LATE: Phase[] = ['evening', 'night'];
export const DAY: Phase[] = ['morning', 'afternoon'];
export const NOT_NIGHT: Phase[] = ['morning', 'afternoon', 'evening'];
export const EVE: Phase[] = ['evening'];
