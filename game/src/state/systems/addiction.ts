import type { Game } from '../Game';

// Update 0.3 — addiction meters (0..100). Grow with use, decay with abstinence.

// Update 0.8 — gaming and adult-site meters (no health damage; gaming hurts grades and work)
export type Habit = 'alcohol' | 'nicotine' | 'gambling' | 'gaming' | 'adult';
export const HABITS: Habit[] = ['alcohol', 'nicotine', 'gambling', 'gaming', 'adult'];
export const HABIT_LABEL: Record<Habit, string> = { alcohol: 'Alcohol', nicotine: 'Nicotine', gambling: 'Gambling', gaming: 'Gaming', adult: 'Late-night browsing' };

export const habit = (g: Game, h: Habit) => g.flag(`addict:${h}`);

export function consume(g: Game, h: Habit, amount: number) {
  const v = Math.min(100, habit(g, h) + amount);
  g.setFlag(`addict:${h}`, v);
  g.setFlag(`used:${h}`, g.s.clock);
  if (h === 'alcohol') g.setFlag('drunkTurn', g.s.turn);
}

export function treat(g: Game, amount: number) {
  for (const h of HABITS) g.setFlag(`addict:${h}`, Math.max(0, habit(g, h) - amount));
}

export function addictionMonth(g: Game) {
  for (const h of HABITS) {
    const v = habit(g, h);
    if (v <= 0) continue;
    const usedRecently = g.s.clock - g.flag(`used:${h}`) <= 1;
    g.setFlag(`addict:${h}`, Math.max(0, v - (usedRecently ? 1 : 4)));
    if (v >= 50 && (h === 'alcohol' || h === 'nicotine')) g.stat('health', -0.6);
    if (v >= 70 && h === 'gaming') {
      g.stat('energy', -6);
      if (g.s.education.current) g.s.education.current.perf -= 2;
    }
    if (v >= 60 && !g.queued('craving') && g.chance(0.35)) g.queue('craving', { habit: h });
    if (v >= 80 && g.s.job && g.chance(0.25)) {
      g.s.job.warnings++;
      g.log(`⚠️ Your ${HABIT_LABEL[h].toLowerCase()} habit is showing at work. (Warning ${g.s.job.warnings}/3)`, 'bad');
    }
  }
}
