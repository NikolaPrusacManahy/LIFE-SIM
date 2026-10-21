import type { EventDef } from './types';
import type { Game } from '../Game';
import { riskCatch } from '../systems/trouble';
import { pushMsg } from '../phone/convo';
import { soberUp } from '../nightlife/night';

// Update 0.8 — getting home after a night out, and what the next morning remembers.

const hasWheels = (g: Game) => g.has('car') || g.has('sportscar') || g.has('truck');

function morning(g: Game) {
  const intox = g.flag('lastNightIntox');
  const spent = g.flag('lastNightSpent');
  if (intox >= 40 || spent >= 80) g.queue('night_after', { intox, spent });
}

export const NIGHT_EVENTS: EventDef[] = [
  {
    id: 'night_home', title: 'Getting Home', icon: '🌃',
    text: (_g, c) => (c.intox >= 50 ? 'The street is spinning a little. How are you getting home?' : 'Closing time. How are you getting home?'),
    choices: [
      {
        label: '🚶 Walk', hint: 'Free · mugging risk at night',
        run: (g) => {
          soberUp(g);
          morning(g);
          if (g.chance(0.07 + g.flag('lastNightIntox') / 1000)) {
            const loss = Math.min(g.s.money, g.rand(40, 200));
            g.money(-loss);
            g.stat('mood', -10);
            return `Someone stepped out of an alley. They took $${loss}. You’re okay — shaken, but okay.`;
          }
          return 'Cold air, quiet streets. You made it home.';
        },
      },
      { label: '🚕 Cab ($20)', req: (g) => (g.canAfford(20) ? null : 'Need $20'), run: (g) => { g.money(-20); soberUp(g); morning(g); return 'The driver had opinions about everything. You got home safe.'; } },
      {
        label: '🚗 Drive', when: (g) => hasWheels(g), hint: 'If you’ve been drinking: DUI / crash risk',
        run: (g, c) => {
          soberUp(g);
          morning(g);
          if (c.intox < 30) return 'You drove home carefully.';
          if (g.chance(0.12)) { g.stat('health', -25); g.fx({ type: 'shake', power: 12 }); g.karma(-5); return 'You hit a lamppost. Airbags, sirens, a hospital bed.'; }
          if (riskCatch(g, 0.25, { name: 'Drunk driving', sev: 2, kind: 'other', by: 'police' })) return 'Blue lights in the mirror.';
          g.karma(-3);
          return 'You made it. You shouldn’t have driven.';
        },
      },
    ],
  },
  {
    id: 'night_after', title: 'The Morning After', icon: '🥴',
    text: (g, c) => {
      const bits: string[] = [];
      if (c.intox >= 50) bits.push('Your head is pounding.');
      if (c.spent >= 80) bits.push(`Your bank app says you spent $${c.spent} last night.`);
      if (g.flag('phoneLostTurn') >= g.s.turn - 2) bits.push('Your phone is still missing.');
      return bits.join(' ') || 'Last night was a blur.';
    },
    choices: [
      {
        label: 'Check your phone…',
        run: (g, c) => {
          // the hangover is already the half-energy morning (night.ts); here it just hurts
          if (c.intox >= 50) g.stat('mood', -6);
          const out: string[] = [];
          // drunk texts you already sent — they've been read, so no unsending
          const ex = g.s.people.find((p) => p.alive && p.hasNumber && ['ex', 'crush', 'dating', 'partner'].includes(p.role));
          if (c.intox >= 60 && ex && g.chance(0.5)) {
            pushMsg(g, ex.id, { from: 'me', text: 'heyyyy u up?? 🥺 i miss u', turn: g.s.turn, read: true });
            pushMsg(g, ex.id, { from: ex.id, text: g.pick(['lol go to sleep', '…are you okay?', 'we’ll talk when you’re sober']), turn: g.s.turn, kind: 'reaction' });
            out.push(`You texted ${ex.name} at 3am. They read it.`);
          }
          if (c.intox >= 70 && g.chance(0.4)) {
            g.s.web.chirp.posts++;
            g.fame(1);
            g.stat('mood', -4);
            out.push('Someone posted photos of you dancing on a table to Chirp.');
          }
          return out.join(' ') || 'No drunk texts. A small miracle.';
        },
      },
    ],
  },
];
