import type { Game } from '../Game';
import { propertiesMonth } from './properties';
import { captiveMonth, blackmailMonth } from './captives';
import { drugsMonth, crewMonth } from './drugs';
import { investigationMonth } from './investigation';
import { guiltMonth } from './guilt';

// Update 0.5 — monthly underworld tick.
export function underworldMonth(g: Game) {
  const u = g.s.underworld;
  propertiesMonth(g);
  drugsMonth(g);
  crewMonth(g);
  captiveMonth(g);
  blackmailMonth(g);
  investigationMonth(g);
  guiltMonth(g);
  if (u.news && g.s.clock > u.news.until) u.news = null;
  // spending big dirty piles raises eyebrows
  if (u.dirty > 50000 && g.chance(0.2)) g.heat(4);
}
