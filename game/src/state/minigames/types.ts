import type { Game } from '../Game';

// Update 0.12 — activity minigames. The UI plays the minigame, then hands its result to the activity through
// `g.mini`. With no minigame played (autopilot, the simulator) the activity uses an average result.

export type MiniKind = 'code' | 'cook' | 'write' | 'gym' | import('./themes').Engine;

export interface MiniResult {
  kind: MiniKind;
  /** 0–1 */
  score: number;
  /** code: the language */
  lang?: string;
  /** Final touch — code: which project */
  project?: string;
  /** cook: what was cooked */
  food?: string;
  /** gym: correct key presses */
  presses?: number;
  /** a line for the result card */
  note?: string;
  /** Update 0.13 — ⏩ Skip: counts as not played (autopilot odds, no bonus) */
  skipped?: boolean;
}

/** The result of the minigame played for this activity (or an average one), and clear it. */
export function takeMini(g: Game, kind: MiniKind): MiniResult & { played: boolean } {
  const r = g.mini;
  g.mini = null;
  if (r && r.kind === kind && !r.skipped) return { ...r, score: Math.max(0, Math.min(1, r.score)), played: true };
  return { kind, score: 0.5, played: false };
}
