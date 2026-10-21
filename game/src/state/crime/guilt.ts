import type { Game } from '../Game';
import { consume } from '../systems/addiction';

// Update 0.5 — guilt & conscience. Cold characters become "Sociopath": no guilt, but people sense something off.

export function addGuilt(g: Game, n: number) {
  if (g.hasTrait('sociopath')) return;
  g.s.underworld.guilt = Math.min(100, g.s.underworld.guilt + n);
  g.inc('violentActs', n >= 6 ? 1 : 0);
}

export function easeGuilt(g: Game, n: number) {
  g.s.underworld.guilt = Math.max(0, g.s.underworld.guilt - n);
}

export function guiltMonth(g: Game) {
  const u = g.s.underworld;
  if (u.guilt > 0) u.guilt = Math.max(0, u.guilt - 1.5);
  if (u.guilt >= 30) {
    g.stat('energy', -6); // nightmares
    g.stat('mood', -3);
    if (u.guilt >= 50 && g.chance(0.3)) consume(g, 'alcohol', 4);
    if (!g.queued('guilt_event') && g.chance(u.guilt / 200)) g.queue('guilt_event', { kind: g.pick(['nightmare', 'paranoia', 'confess']) });
  }
  // three violent acts and barely a flicker of guilt → Sociopath
  if (!g.hasTrait('sociopath') && g.flag('violentActs') >= 3 && u.guilt < 15) {
    g.s.traits.push('sociopath');
    g.log('🧊 You realise you don’t feel much of anything anymore. (Trait: Sociopath)', 'crime');
  }
  if (g.hasTrait('sociopath') && g.s.stats.charm > 30) g.stat('charm', -0.3);
}
