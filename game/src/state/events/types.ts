import type { Game } from '../Game';

export type Ctx = Record<string, any>;

export interface ChoiceDef {
  label: string;
  /** small grey line under the label, e.g. "Charm check · 64%" */
  hint?: string | ((g: Game, ctx: Ctx) => string);
  when?: (g: Game, ctx: Ctx) => boolean;
  /** return a reason string to show the choice disabled */
  req?: (g: Game, ctx: Ctx) => string | null;
  run: (g: Game, ctx: Ctx) => string;
}

export interface RandomSpec {
  weight?: number | ((g: Game) => number);
  when: (g: Game) => boolean;
  /** turns before it can fire again (default 48 = one year) */
  cooldown?: number;
  once?: boolean;
  /** true = only while jailed; undefined = only while free */
  jail?: boolean;
  ctx?: (g: Game) => Ctx;
}

export interface EventDef {
  id: string;
  title: string | ((g: Game, ctx: Ctx) => string);
  icon?: string;
  text: (g: Game, ctx: Ctx) => string;
  choices: ChoiceDef[] | ((g: Game, ctx: Ctx) => ChoiceDef[]);
  random?: RandomSpec;
  /** Update 0.4 — person shown as a chip (defaults to ctx.pid) */
  who?: (g: Game, ctx: Ctx) => string | null;
  /** Update 0.4 — 18+ content: may only resolve between adults with Mature Content on */
  mature?: boolean;
}

export const checkHint = (stat: Parameters<Game['statOdds']>[0], diff: number) => (g: Game) =>
  `${stat[0].toUpperCase() + stat.slice(1)} check · ${g.pct(stat, diff)}`;

export const inHS = (g: Game) => g.s.education.current?.program === 'hs';
