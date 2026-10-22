import { fmt } from '../systems/finance';
import { consume } from '../systems/addiction';
import { underageCatch } from '../systems/trouble';
import { type ActivityDef } from './types';
import { pct } from './helpers';
import { legalAge } from '../rules/us';

// Update 0.3 — casino (US 21+ / EU 18+). Gambling feeds the addiction meter.

function bet(stake: number, edge: (g: Parameters<ActivityDef['run']>[0]) => number, mult: number, label: string): ActivityDef['run'] {
  return (g) => {
    consume(g, 'gambling', stake >= 1000 ? 9 : 5);
    if (underageCatch(g, 0.25, { name: 'Underage gambling', sev: 1, kind: 'id' })) return 'Security checked your ID…';
    // Update 0.13 — you played the hand: a win pays, a push (or a pair) gets your stake back
    const played = g.playScore;
    if (played !== null && played > 0.25 && played < 0.75) {
      g.money(stake);
      return `${label} — a push. You get your ${fmt(stake)} back.`;
    }
    if (played !== null ? played >= 0.75 : Math.random() < edge(g)) {
      const win = Math.round(stake * mult);
      g.money(win);
      g.stat('mood', 8);
      g.burst('coins');
      return `${label} — you won ${fmt(win)}!`;
    }
    g.stat('mood', -4);
    return `${label} — the house won.`;
  };
}

const CASINO = { gate: 'casino' as const, legality: 'underage' as const, venue: true, phases: ['evening', 'night'] as ActivityDef['phases'] };

export const CASINO_ACTS: ActivityDef[] = [
  {
    id: 'slots', loc: 'casino', name: 'Slot Machines', icon: '🎰', desc: 'Lights! Sounds! Odds!', cat: 'fun', energy: 5, cost: 50, ...CASINO,
    preview: (g) => (g.age < legalAge(g, 'casino') ? ['ID check 25%'] : []),
    run: (g) => {
      consume(g, 'gambling', 4);
      if (underageCatch(g, 0.25, { name: 'Underage gambling', sev: 1, kind: 'id' })) return 'Security checked your ID…';
      // Update 0.13 — you stopped the reels yourself: three of a kind pays 20×, a pair 2×
      const played = g.playScore;
      if (played !== null) {
        if (played >= 1) { g.money(1000); g.burst('coins'); return `Three of a kind! You won ${fmt(1000)}.`; }
        if (played >= 0.5) { g.money(100); return `A pair! You won ${fmt(100)}.`; }
        return 'Spin, spin, nothing.';
      }
      const r = Math.random();
      if (r < 0.002) { g.money(25000); g.achieve('jackpot'); g.banner('🎰 JACKPOT', 0xf5b53a); g.burst('coins'); return 'JACKPOT! $25,000!'; }
      if (r < 0.3) { const w = g.rand(20, 120); g.money(w); return `Cherries! You won ${fmt(w)}.`; }
      return 'Spin, spin, nothing.';
    },
  },
  { id: 'blackjack', loc: 'casino', name: 'Blackjack ($100)', icon: '🃏', desc: 'Smarts tilt the odds.', cat: 'fun', energy: 8, cost: 100, ...CASINO, risk: (g) => pct(0.42 + g.s.stats.smarts / 1000), preview: (g) => (g.age < legalAge(g, 'casino') ? ['ID check 25%'] : []), run: bet(100, (g) => 0.42 + g.s.stats.smarts / 1000, 2, 'Blackjack') },
  { id: 'poker', loc: 'casino', name: 'Poker Table ($250)', icon: '♠️', desc: 'A game of skill. Mostly.', cat: 'fun', energy: 14, cost: 250, ...CASINO, risk: (g) => pct(g.odds((g.s.stats.smarts + g.s.stats.charm) / 2, 60) * 0.9), preview: (g) => (g.age < legalAge(g, 'casino') ? ['ID check 25%'] : []), run: bet(250, (g) => g.odds((g.s.stats.smarts + g.s.stats.charm) / 2, 60) * 0.9, 2.2, 'Poker') },
  { id: 'high_roller', loc: 'casino', name: 'High-Roller Room ($5k)', icon: '💎', desc: 'Big money, bigger risk.', cat: 'fun', energy: 15, cost: 5000, ...CASINO, risk: () => '45%', run: bet(5000, () => 0.45, 2.1, 'High stakes') },
];
