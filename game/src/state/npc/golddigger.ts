import type { Game } from '../Game';
import type { Person } from '../types';
import { fmt } from '../systems/finance';

// Update 0.12 — gold diggers: everything can be bought. Asking them out, making it official, proposing —
// each needs money on the table first. Pay, and they're far more likely to say yes.

export const GOLD_PRICE: Record<string, number> = { askout: 200, date: 150, official: 2000, propose: 25000 };

/** Why you can't (yet): not enough money for what they expect. */
export function goldLock(g: Game, p: Person, id: string): string | null {
  const price = p.persona === 'golddigger' ? GOLD_PRICE[id] : undefined;
  return price && !g.canAfford(price) ? `They expect ${fmt(price)} first` : null;
}

/** Pay up before the ask (returns a line for the result, or ''). */
export function goldPay(g: Game, p: Person, id: string): string {
  const price = p.persona === 'golddigger' ? GOLD_PRICE[id] : undefined;
  if (!price || !g.canAfford(price)) return '';
  g.money(-price);
  p.attraction = Math.min(100, p.attraction + 25);
  p.romance = Math.min(100, p.romance + 10);
  return `💸 You put ${fmt(price)} on the table. ${p.name}’s eyes light up. `;
}
