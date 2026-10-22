// Update 0.13 — every activity is playable: themes point at real activities, the score scales gains (Skip = not
// played), the casino and the tests are decided by your play, and each engine's rules hold.
import { check, done, resolveAll } from './harness';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import { ACT_BY_ID } from '../src/state/activities';
import { MINI_THEMES, playMulOf } from '../src/state/minigames/themes';
import { chart, judge, rhythmScore, RHYTHM_SECONDS } from '../src/state/minigames/engines/rhythm';
import { hitQuality, zoneFor } from '../src/state/minigames/engines/timing';
import { course, hits, PLAYER_X } from '../src/state/minigames/engines/runner';
import { QUESTIONS, pickQuestions } from '../src/state/minigames/engines/quiz';
import { DUELS, duelScore } from '../src/state/minigames/engines/duel';
import { SORTS } from '../src/state/minigames/engines/sort';
import { blackjackResult, handValue, pokerRank, slotScore, type Card } from '../src/state/minigames/engines/cards';
import { breathQuality, constellation, plantScore, shotQuality, waterTarget, PLANTS } from '../src/state/minigames/engines/skill';
import { SH, SW, canStep, seen, stealthLevel, road } from '../src/state/minigames/engines/grid';

const mk = (age: 14 | 23 = 23): Game => {
  const g = createLife({ name: 'E', familyName: 'N', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: age });
  g.s.money = 100000;
  resolveAll(g);
  return g;
};

// ---------- the theme table
{
  const ids = Object.keys(MINI_THEMES);
  const missing = ids.filter((id) => !ACT_BY_ID[id]);
  check(`all ${ids.length} themed activities exist`, missing.length === 0, missing.join(', '));
  check('no activity has both an old minigame and a theme', ids.every((id) => !ACT_BY_ID[id]?.mini));
  check('a great run gives 1.5× the gains, a poor one 0.6×', playMulOf(1) === 1.5 && Math.abs(playMulOf(0) - 0.6) < 1e-9);
}

// ---------- the score scales gains; Skip is the same as not playing
{
  const gain = (mini: Game['mini']) => {
    let total = 0;
    for (let i = 0; i < 20; i++) {
      const g = mk(14);
      g.s.phase = 1;
      const s0 = g.s.stats.smarts;
      g.mini = mini;
      g.doActivity('homework');
      total += g.s.stats.smarts - s0;
    }
    return total;
  };
  const great = gain({ kind: 'quiz', score: 1 });
  const poor = gain({ kind: 'quiz', score: 0 });
  const none = gain(null);
  const skipped = gain({ kind: 'quiz', score: 0.5, skipped: true });
  check('a great quiz teaches more than a poor one', great > poor * 2, `${great.toFixed(1)} vs ${poor.toFixed(1)}`);
  check('Skip is the same as not playing (no bonus, no penalty)', Math.abs(skipped - none) < none * 0.25, `${skipped.toFixed(1)} vs ${none.toFixed(1)}`);
}

// ---------- the casino is decided by your hand
{
  const play = (id: string, score: number | null, skipped = false) => {
    const g = mk();
    g.s.phase = 2;
    const m0 = g.s.money;
    if (score !== null) g.mini = { kind: 'cards', score, skipped };
    g.doActivity(id);
    return g.s.money - m0;
  };
  check('blackjack: a win pays double your $100', play('blackjack', 1) === 100);
  check('blackjack: a push gives your $100 back', play('blackjack', 0.5) === 0);
  check('blackjack: a loss costs $100', play('blackjack', 0) === -100);
  check('slots: three of a kind pays $1,000', play('slots', 1) === 950);
  check('slots: a pair pays $100', play('slots', 0.5) === 50);
}

// ---------- tests are decided by your play
{
  const road = (score: number) => {
    const g = mk();
    g.s.phase = 1;
    g.setFlag('permit');
    g.setFlag('driveLessons', 3);
    g.mini = { kind: 'drive', score };
    g.doActivity('road_test');
    return !!g.flag('license');
  };
  check('road test: a clean drive passes, a bad one fails', road(0.9) && !road(0.2));
  const permit = (score: number) => {
    const g = mk(14);
    g.s.bornAt -= 24;
    g.s.phase = 1;
    g.mini = { kind: 'quiz', score };
    g.doActivity('permit_test');
    return !!g.flag('permit');
  };
  check('permit test: 4/5 passes, 1/5 fails', permit(0.8) && !permit(0.2));
}

// ---------- each engine's rules
{
  const c = chart(1);
  check('rhythm: a song fills the 20 seconds', c.length > 25 && c.every((n) => n.t > 0 && n.t < RHYTHM_SECONDS));
  check('rhythm: perfect ≤ 90 ms, good ≤ 170 ms, else miss', judge(50) === 'perfect' && judge(-150) === 'good' && judge(300) === 'miss');
  check('rhythm: all perfect = 1', rhythmScore(10, 0, 10) === 1);
  const z = zoneFor(0, 3);
  check('timing: dead centre = 1, the edge = 0.5, outside = 0', hitQuality(z.centre, z) === 1 && Math.abs(hitQuality(z.centre + z.width / 2, z) - 0.5) < 1e-9 && hitQuality(z.centre + z.width, z) === 0);
  check('timing: the green shrinks every round', zoneFor(4, 3).width < zoneFor(0, 3).width);
  const co = course(5);
  check('runner: every obstacle can be jumped (enough room between them)', co.every((o, i) => i === 0 || o.x - co[i - 1].x >= 340));
  check('runner: on the ground you hit an obstacle in your way; in the air you clear it', hits(co[0], PLAYER_X, 0) && !hits(co[0], PLAYER_X, 200));
  const banks = Object.values(QUESTIONS);
  check('quiz: every bank has ≥ 5 questions and every answer key is valid', banks.every((b) => b.length >= 5 && b.every((q) => q.right >= 0 && q.right < 4)));
  const qs = pickQuestions('mixed', 9);
  check('quiz: 5 different questions a session', new Set(qs.map((q) => q.q)).size === 5);
  check('duel: every round has a best line', Object.values(DUELS).every((rs) => rs.every((r) => Math.max(...r.lines.map((l) => l[1])) >= 1)));
  check('duel: the best lines score 1', duelScore(DUELS.debate.map((r) => Math.max(...r.lines.map((l) => l[1]))), DUELS.debate) === 1);
  check('sort: every item has a bin', Object.values(SORTS).every((s) => s.items.every((it) => s.bins.some((b) => b.id === it.bin))));
  const C = (rank: number, suit = 0): Card => ({ rank, suit });
  check('blackjack: an ace counts 11 or 1', handValue([C(12), C(8)]) === 21 && handValue([C(12), C(12), C(8)]) === 12);
  check('blackjack: busting loses, beating the dealer wins', blackjackResult([C(8), C(8), C(5)], [C(8), C(7)]) === 'lose' && blackjackResult([C(8), C(7)], [C(8), C(5)]) === 'win');
  check('poker: flush, straight and full house are ranked', pokerRank([C(0, 1), C(3, 1), C(5, 1), C(7, 1), C(9, 1)]) === 5 && pokerRank([C(0), C(1, 1), C(2), C(3, 2), C(4)]) === 4 && pokerRank([C(5), C(5, 1), C(5, 2), C(9), C(9, 1)]) === 6);
  check('slots: three of a kind = 1, a pair = 0.5, nothing = 0', slotScore([2, 2, 2]) === 1 && slotScore([1, 2, 2]) === 0.5 && slotScore([0, 1, 2]) === 0);
  check('aim: on target scores, far off misses', shotQuality(0.6, 0.6) === 1 && shotQuality(0.1, 0.6) === 0);
  check('gardening: watering every plant to its line scores 1', plantScore(Array.from({ length: PLANTS }, (_, i) => waterTarget(i, 4)), 4) === 1);
  check('calm: clicking at the top of the breath is best', breathQuality(0.95) === 1 && breathQuality(0.3) === 0);
  check('calm: a constellation has stars to connect', constellation(2).length === 6);
  for (const skin of ['house', 'alley', 'prison']) {
    const lvl = stealthLevel(skin);
    const q: [number, number][] = [lvl.start];
    const seenCells = new Set([lvl.start.join()]);
    while (q.length) {
      const [x, y] = q.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n: [number, number] = [x + dx, y + dy];
        if (canStep(lvl, n[0], n[1]) && !seenCells.has(n.join())) {
          seenCells.add(n.join());
          q.push(n);
        }
      }
    }
    check(`stealth (${skin}): the exit can be reached`, seenCells.has(lvl.exit.join()) && lvl.exit[0] < SW && lvl.exit[1] < SH);
  }
  const lvl = stealthLevel('house');
  check('stealth: walls block a guard’s view', !seen(lvl, 4, 1, 2, 1) && seen(lvl, 2, 1, 2, 3));
  check('driving: the road has traffic, cones and lights (no lights in a getaway)', road(3, 'lesson').some((t) => t.kind === 'light') && !road(3, 'getaway').some((t) => t.kind === 'light'));
}

done();
