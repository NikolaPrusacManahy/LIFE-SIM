import type { Game } from '../Game';
import type { Ctx, EventDef } from './types';
import { canBeIntimate, encounter } from '../systems/intimacy';
import { say } from '../npc/identity';
import { SPOT_LABEL, STYLE_ASK, rollStyle, styleAfter, type Spot, type Style } from '../datenight/desire';

// Update 0.11 — they ask where, then how (or you ask your spouse). Non-explicit, fade to black.

const who = (g: Game, c: Ctx) => g.personById(c.pid);
const SPOTS: Spot[] = ['couch', 'bed', 'counter'];
const passed = 'The moment passed.';
const notTonight = { label: 'Not tonight', run: (g: Game, c: Ctx) => say('“Another time,” you say. {name} kisses your cheek — no pressure.', who(g, c), g.s.name) };

/** Go on to the protection choice, carrying where and how. */
const toProtection = (g: Game, c: Ctx, style?: Style) => {
  g.queue('protection_choice', { pid: c.pid, theirs: c.theirs, spot: c.spot, style }, true);
  return '';
};

export const DESIRE_EVENTS: EventDef[] = [
  {
    id: 'intimacy_where', icon: '🔥', mature: true, who: (_g, c) => c.pid,
    title: (g, c) => (c.from === 'you' ? 'Where?' : `${who(g, c)?.name ?? 'They'} Wants You`),
    text: (g, c) => say(c.from === 'you' ? 'You pull {name} close. Where?' : '{name} pulls you close: “Couch, bed… or right here on the kitchen counter?”', who(g, c), g.s.name),
    choices: [
      ...SPOTS.map((spot) => ({
        label: SPOT_LABEL[spot],
        run: (g: Game, c: Ctx) => {
          if (!canBeIntimate(g, who(g, c))) return passed;
          g.queue('intimacy_how', { ...c, spot, style: c.from === 'you' ? undefined : rollStyle() }, true);
          return '';
        },
      })),
      notTonight,
    ],
  },
  {
    id: 'intimacy_how', icon: '🔥', mature: true, who: (_g, c) => c.pid,
    title: (_g, c) => (c.from === 'you' ? 'How?' : 'What They Want'),
    text: (g, c) => (c.from === 'you' ? 'And how?' : say(`{name} whispers: ${STYLE_ASK[c.style as Style]}`, who(g, c), g.s.name)),
    choices: (g, c) => {
      const p = who(g, c);
      // you asked your spouse: you pick
      if (c.from === 'you') {
        return [
          { label: '⚡ A quick one', run: (gg) => (canBeIntimate(gg, p) ? toProtection(gg, c, 'quick') : passed) },
          { label: '🌙 All night (5 rounds)', hint: 'Energy −20', run: (gg) => (canBeIntimate(gg, p) ? toProtection(gg, c, 'rounds') : passed) },
          notTonight,
        ];
      }
      // the no-condom argument: you can always insist, and they accept it
      if (c.style === 'raw') {
        return [
          { label: 'Okay… no condom', hint: 'High pregnancy & STI risk', run: (gg) => (canBeIntimate(gg, p) ? `${encounter(gg, p!, 'none')}${styleAfter(gg, p, 'raw')}` : passed) },
          { label: '🛡️ Insist on a condom', run: (gg) => { if (!canBeIntimate(gg, p)) return passed; toProtection(gg, c); return say('{name} rolls {their} eyes, smiling: “Fine, fine.”', p, gg.s.name); } },
          notTonight,
        ];
      }
      return [
        { label: 'Yes 😏', hint: c.style === 'rounds' ? 'Energy −20' : '', run: (gg) => (canBeIntimate(gg, p) ? toProtection(gg, c, c.style) : passed) },
        notTonight,
      ];
    },
  },
];
