import type { Game } from '../Game';
import { consume, habit } from '../systems/addiction';

// Update 0.8 — Bitstore games. Each is a small playable mini-game; the score turns into Mood / Smarts / tournament cash.

export type GameId = 'flappy' | 'fowl' | 'snek' | 'mines' | 'blocks' | 'words' | 'golf';

export interface GameDef {
  id: GameId;
  name: string;
  icon: string;
  price: number;
  desc: string;
  /** score that counts as a great run (tournament win) */
  great: number;
  /** which stat a good run trains */
  stat: 'smarts' | 'fitness' | 'creativity' | null;
}

export const GAMES: GameDef[] = [
  { id: 'flappy', name: 'Flappy Pigeon', icon: '🐦', price: 0, desc: 'Click to flap. Avoid the pipes.', great: 15, stat: null },
  { id: 'fowl', name: 'Furious Fowl', icon: '🐔', price: 5, desc: 'Fling hens at wobbly towers.', great: 3, stat: null },
  { id: 'snek', name: 'Snek', icon: '🐍', price: 0, desc: 'Eat, grow, don’t bite yourself.', great: 20, stat: null },
  { id: 'mines', name: 'Mines', icon: '💣', price: 0, desc: 'Clear the field. Logic only.', great: 1, stat: 'smarts' },
  { id: 'blocks', name: 'Block Drop', icon: '🧱', price: 8, desc: 'Falling blocks. Clear lines.', great: 10, stat: 'smarts' },
  { id: 'words', name: 'Word Duel', icon: '🔤', price: 4, desc: 'Guess the 5-letter word vs a friend.', great: 1, stat: 'smarts' },
  { id: 'golf', name: 'Golf Solitaire', icon: '🃏', price: 0, desc: 'Clear the cards one up or down.', great: 1, stat: 'smarts' },
];
export const GAME_BY_ID: Record<GameId, GameDef> = Object.fromEntries(GAMES.map((x) => [x.id, x])) as Record<GameId, GameDef>;

/** Your setup and practice make you better: a multiplier on the raw score. */
export function skillBonus(g: Game): number {
  const pc = g.s.session?.device === 'pc' ? g.s.pc.score / 200 : 0;
  return 1 + pc + (g.s.web.guides.includes('games') ? 0.15 : 0);
}

export const TOURNAMENT_FEE = 20;
export const TOURNAMENT_PRIZE = 150;

/** Turn a finished run into effects. Pure apart from the Game helpers (tested). */
export function rewardRun(g: Game, id: GameId, rawScore: number, tournament = false): { score: number; text: string } {
  const def = GAME_BY_ID[id];
  const score = Math.round(rawScore * skillBonus(g) * 10) / 10;
  const great = score >= def.great;
  g.stat('mood', great ? 6 : 3);
  if (def.stat && great) g.stat(def.stat, 1);
  consume(g, 'gaming', 2);
  if (habit(g, 'gaming') >= 70) g.stat('energy', -3);
  let text = great ? `${def.name}: ${score} — a great run!` : `${def.name}: ${score}.`;
  if (tournament) {
    g.money(-TOURNAMENT_FEE);
    if (great) {
      g.money(TOURNAMENT_PRIZE);
      text += ` You won the tournament (+$${TOURNAMENT_PRIZE})!`;
    } else text += ' Knocked out of the tournament.';
  }
  return { score, text };
}
