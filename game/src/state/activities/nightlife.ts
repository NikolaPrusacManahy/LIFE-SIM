import { fmt } from '../systems/finance';
import { consume } from '../systems/addiction';
import { riskCatch, underageCatch } from '../systems/trouble';
import { settings } from '../settings';
import { LATE, type ActivityDef } from './types';
import { maybeMeet, pct } from './helpers';

// Update 0.3 — clubs and bars are 21+ venues (a fake ID gets 16–20s in, at a risk).

const VENUE = { gate: 'alcohol' as const, legality: 'illegalUnder21' as const, venue: true, phases: LATE };
const idCheck = (g: Parameters<ActivityDef['run']>[0]) => underageCatch(g, 0.2, { name: 'Fake ID at a bar', sev: 1, kind: 'id' });
const idPreview = (g: Parameters<ActivityDef['run']>[0]) => (g.age < 21 ? ['ID check 20%'] : []);

/** Adults only, Mature Content on: a chance to meet someone for the night. */
function maybeFling(g: Parameters<ActivityDef['run']>[0], p: number) {
  if (settings.mature && g.age >= 18 && !g.queued('meet_fling') && g.chance(p)) g.queue('meet_fling', {});
}

export const NIGHTLIFE_ACTS: ActivityDef[] = [
  // ---- club
  {
    id: 'dance', loc: 'club', name: 'Hit the Dance Floor', icon: '💃', desc: 'Lose yourself.', cat: 'fun', energy: 20, cost: 25, ...VENUE, preview: idPreview,
    run: (g) => {
      if (idCheck(g)) return 'The bouncer looked at your ID for a long time…';
      g.stat('mood', 10);
      g.stat('fitness', 1);
      g.stat('charm', 1);
      maybeMeet(g, 0.12, 'the club');
      maybeFling(g, 0.1);
      return g.pick(['The DJ dropped your favorite song.', 'You danced until your feet gave out.', 'A dance circle formed around you.']);
    },
  },
  {
    id: 'club_drinks', loc: 'club', name: 'Cocktails', icon: '🍹', desc: 'Liquid confidence.', cat: 'social', energy: 8, cost: 40, ...VENUE, preview: idPreview,
    run: (g) => {
      if (idCheck(g)) return 'The bartender asked for ID…';
      consume(g, 'alcohol', 5);
      g.stat('mood', 9);
      g.stat('health', -1.5);
      maybeFling(g, 0.12);
      return 'Neon drinks with tiny umbrellas.';
    },
  },
  {
    id: 'vip', loc: 'club', name: 'VIP Table', icon: '🍾', desc: 'See and be seen.', cat: 'fun', energy: 15, cost: 600, ...VENUE,
    run: (g) => {
      consume(g, 'alcohol', 6);
      g.stat('mood', 14);
      g.fame(1);
      g.stat('charm', 1);
      maybeMeet(g, 0.25, 'the VIP section');
      maybeFling(g, 0.15);
      g.burst('sparkle');
      return 'Bottle service, sparklers, and someone famous at the next table.';
    },
  },
  {
    id: 'dj', loc: 'club', name: 'DJ a Set', icon: '🎧', desc: 'Guest slot for cash.', cat: 'money', energy: 20, ...VENUE,
    lock: (g) => (g.s.stats.creativity >= 40 ? null : 'Needs Creativity 40'),
    risk: (g) => pct(g.statOdds('creativity', 55)),
    run: (g) => {
      if (g.check('creativity', 55)) {
        const amt = g.rand(150, 400) + Math.round(g.s.fame * 5);
        g.money(amt);
        g.fame(1);
        g.burst('coins');
        return `The floor went crazy. You earned ${fmt(amt)}.`;
      }
      g.stat('mood', -4);
      return 'You trainwrecked the transition. Polite clapping.';
    },
  },

  // ---- bar + roadhouse
  ...(['bar', 'roadhouse'] as const).flatMap((loc): ActivityDef[] => [
    {
      id: `${loc}_drink`, loc, name: 'Grab a Drink', icon: '🍺', desc: 'Unwind with locals.', cat: 'social', energy: 8, cost: 25, ...VENUE, preview: idPreview,
      run: (g) => {
        if (idCheck(g)) return 'The bartender didn’t buy your ID…';
        consume(g, 'alcohol', 5);
        g.stat('mood', 7);
        g.stat('health', -1);
        g.stat('charm', 0.5);
        maybeMeet(g, 0.1, loc === 'bar' ? 'the bar' : 'the roadhouse');
        maybeFling(g, 0.08);
        return g.pick(['The bartender knows your order now.', 'A stranger told you their whole life story.', 'You won a round of darts.']);
      },
    },
    {
      id: `${loc}_karaoke`, loc, name: 'Karaoke', icon: '🎤', desc: 'Courage required.', cat: 'fun', energy: 12, ...VENUE, preview: idPreview,
      run: (g) => {
        if (idCheck(g)) return 'The bouncer checked IDs at the karaoke night…';
        g.stat('creativity', 1.5);
        g.stat('charm', 1.5);
        g.stat('mood', 6);
        g.fame(0.2);
        return g.check('creativity', 45) ? 'You brought the house down!' : 'Off-key, full confidence. The crowd loved it anyway.';
      },
    },
    {
      id: `${loc}_openmic`, loc, name: 'Open Mic', icon: '🎙️', desc: 'Play your songs.', cat: 'money', energy: 15, ...VENUE,
      lock: (g) => (g.has('guitar') ? null : 'Needs a guitar'),
      run: (g) => {
        const amt = Math.round(20 + g.s.stats.creativity * 1.5 + g.s.fame * 3);
        g.money(amt);
        g.stat('creativity', 2);
        g.fame(0.8);
        if (g.s.job?.careerId === 'musician') g.s.job.perf = Math.min(100, g.s.job.perf + 4);
        return `A great set. Tip jar: ${fmt(amt)}.`;
      },
    },
    {
      id: `${loc}_fight`, loc, name: 'Bar Fight', icon: '🥊', desc: 'Someone spilled your drink.', cat: 'fun', energy: 20, ...VENUE, cooldown: 8,
      risk: (g) => pct(g.statOdds('fitness', 50)),
      preview: () => ['Police 25%'],
      run: (g) => {
        g.stat('street', 2);
        if (riskCatch(g, 0.25, { name: 'Bar fight', sev: 1, kind: 'fight' })) return 'Glass broke. Sirens outside…';
        if (g.check('fitness', 50)) { g.stat('mood', 6); return 'You won. The bar went quiet, then cheered.'; }
        g.stat('health', -10);
        g.fx({ type: 'shake', power: 6 });
        return 'You lost. Badly. Ice pack time.';
      },
    },
  ]),
  {
    id: 'mech_bull', loc: 'roadhouse', name: 'Mechanical Bull', icon: '🐂', desc: 'Eight seconds of glory.', cat: 'fun', energy: 15, cost: 5, ...VENUE,
    risk: (g) => pct(g.statOdds('fitness', 50)),
    run: (g) => {
      if (g.check('fitness', 50)) {
        g.money(100);
        g.stat('mood', 10);
        g.burst('confetti');
        return 'Eight seconds! You won the $100 pot.';
      }
      g.stat('health', -3);
      return 'Launched into the hay. Everyone cheered anyway.';
    },
  },
  {
    id: 'line_dance', loc: 'roadhouse', name: 'Line Dancing', icon: '🤠', desc: 'Boot-scootin’.', cat: 'social', energy: 14, ...VENUE,
    run: (g) => {
      g.stat('mood', 8);
      g.stat('fitness', 1);
      maybeMeet(g, 0.12, 'line dancing');
      maybeFling(g, 0.06);
      return 'You finally nailed the whole routine.';
    },
  },
];
