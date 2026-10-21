import type { Game } from '../Game';
import type { Ctx, EventDef } from './types';
import { say } from '../npc/identity';
import { acceptStalker, refuseStalker } from '../systems/stalker';
import { acceptShy, refuseShy } from '../systems/shy';

// Update 0.12 — persona events: a yandere's handiwork, the stalker's reveal, a shy confession.

const who = (g: Game, c: Ctx) => g.personById(c.pid);

export const PERSONA_EVENTS: EventDef[] = [
  {
    id: 'yandere_news', icon: '🕯️', who: (_g, c) => c.pid,
    title: (_g, c) => (c.dark ? 'Found Dead' : 'Gone'),
    text: (g, c) => {
      const p = who(g, c);
      const y = g.personById(c.yid);
      return c.dark
        ? `${p?.name ?? 'Someone you texted'} was found dead this morning. No witnesses, no suspects. ${y?.name ?? 'Your partner'} sends you a heart. ♡`
        : `${p?.name ?? 'Someone you texted'} packed up and left town overnight. Nobody knows why. ${y?.name ?? 'Your partner'} sends you a heart. ♡`;
    },
    choices: [
      { label: '…', run: (g) => { g.stat('mood', -6); return 'You put your phone down. Your hands are shaking.'; } },
      { label: 'Ask your partner about it', run: (g, c) => { const y = g.personById(c.yid); return say('{name} tilts {their} head. “About what? ♡”', y, g.s.name); } },
    ],
  },
  {
    id: 'stalker_reveal', icon: '📵', who: (_g, c) => c.pid,
    title: 'The Unknown Number',
    text: (g, c) => say(c.surrender
      ? 'You go where the message said. {name} is waiting — perfect hair, perfect smile, eyes that never leave you. “It was me. It was always me. Will you be mine?”'
      : 'There’s a knock at your door. It’s {name} — stunning, smiling, holding your photo. “It was me. It was always me. Will you be mine?”', who(g, c), g.s.name),
    choices: [
      { label: '♡ Accept their love', run: (g) => acceptStalker(g) },
      { label: 'Refuse', hint: 'It won’t end well', run: (g) => refuseStalker(g) },
    ],
  },
  {
    id: 'shy_confess', icon: '🙈', who: (_g, c) => c.pid,
    title: (g, c) => `${who(g, c)?.name ?? 'Someone'} Has Something to Say`,
    text: (g, c) => say('{name} grabs your sleeve, bright red. “I-I… I l-l-love you!” …and faints on the spot.', who(g, c), g.s.name),
    choices: [
      { label: '❤️ Say yes (when they wake up)', run: (g, c) => { const p = who(g, c); return p ? acceptShy(g, p) : 'They’re gone.'; } },
      { label: 'Let them down gently', run: (g, c) => { const p = who(g, c); return p ? refuseShy(g, p) : 'They’re gone.'; } },
    ],
  },
];
