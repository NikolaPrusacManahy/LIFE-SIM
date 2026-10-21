import type { Game } from '../Game';

// Update 0.11 — who the police can't touch: gods (0.6) and anyone who reached Diplomatic status (START-UP).
// This only covers police, jail and scandals — the hard safety rules (minors, consent, Mature Content) never bend.

export const untouchable = (g: Game) => g.s.god || g.flag('diplomatic') > 0;
