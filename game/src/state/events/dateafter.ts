import type { Game } from '../Game';
import type { Ctx, EventDef } from './types';
import { say } from '../npc/identity';
import { bump } from '../npc/interactions';
import { addLabel } from '../npc/labels';
import { beginNight, canBeIntimate } from '../systems/intimacy';
import { createPlan, nextSlot } from '../phone/plans';
import { AFTER_AT, afterOdds } from '../datenight/after';

// Update 0.12 — how the date went decides what you can ask for at the end of the night.

const who = (g: Game, c: Ctx) => g.personById(c.pid);
const COMMITTED = ['dating', 'partner', 'engaged', 'spouse'];
const pct = (n: number) => `${Math.round(n * 100)}%`;

export const DATE_AFTER_EVENTS: EventDef[] = [
  {
    id: 'date_after', icon: '🌙', who: (_g, c) => c.pid,
    title: 'End of the Night',
    text: (g, c) => say(c.spark >= 70 ? '{name} doesn’t want the night to end. Neither do you.' : c.spark >= 40 ? '{name} lingers at the door, smiling.' : '{name} says goodnight. It was… fine.', who(g, c), g.s.name),
    choices: (g, c) => {
      const p = who(g, c);
      const spark = Number(c.spark) || 0;
      const free = !!p && !COMMITTED.includes(p.role);
      const adult = !!p && canBeIntimate(g, p);
      return [
        {
          label: '💌 Ask for a second date', when: () => spark >= AFTER_AT.second, hint: p ? pct(afterOdds(p, spark, 'second')) : '',
          run: (gg) => {
            if (!p) return 'They’re gone.';
            if (!gg.chance(afterOdds(p, spark, 'second'))) { bump(p, 'romance', -1); return say('“Let me think about it,” {name} says. Not a no.', p, gg.s.name); }
            bump(p, 'romance', 5);
            createPlan(gg, p, 'date', 'date', nextSlot(gg, 2, 4));
            return say('“Yes. Same time next week?” {name} kisses your cheek. 📅 Date planned.', p, gg.s.name);
          },
        },
        {
          label: '🤝 Ask to be friends with benefits', when: () => spark >= AFTER_AT.fwb && free && adult && !p!.labels.includes('fwb'), hint: p ? pct(afterOdds(p, spark, 'fwb')) : '',
          run: (gg) => {
            if (!p || !canBeIntimate(gg, p)) return 'The moment passed.';
            if (!gg.chance(afterOdds(p, spark, 'fwb'))) { bump(p, 'rel', -2); return say('“I’m not really a no-strings person,” {name} says. Fair.', p, gg.s.name); }
            addLabel(p, 'fwb');
            return say('“No strings? …Deal.” {name} grins. They’re your friend with benefits now.', p, gg.s.name);
          },
        },
        {
          label: '🔥 One-night stand', when: () => spark >= AFTER_AT.ons && free && adult, hint: p ? pct(afterOdds(p, spark, 'ons')) : '',
          run: (gg) => {
            if (!p || !canBeIntimate(gg, p)) return 'The moment passed.';
            if (!gg.chance(afterOdds(p, spark, 'ons'))) return say('{name} laughs softly. “Not tonight. But I had fun.”', p, gg.s.name);
            addLabel(p, 'ons');
            return `${say('You go home together. Just tonight.', p, gg.s.name)} ${beginNight(gg, p, 'mine')}`.trim();
          },
        },
        { label: 'Just say goodnight', run: () => 'You walk home with your hands in your pockets, replaying the night.' },
      ];
    },
  },
];
