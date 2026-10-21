import { say } from '../npc/identity';
import { hasTrait } from '../npc/traits';
import { activeCases, recomputeWanted } from '../crime/investigation';
import { checkHint, type EventDef } from './types';

// Update 0.5 — consequences of texting: leaks, wrong chats, group drama, snooping, phone warrants.

export const CHAT_EVENTS: EventDef[] = [
  {
    id: 'photo_leak', title: 'Screenshots', icon: '📲', who: (_g, c) => c.pid, mature: true,
    text: (g, c) => say('Your private messages with {name} are going around. People are whispering.', g.personById(c.pid)),
    choices: [
      { label: 'Report it — sharing without consent is a crime', run: (g, c) => { const p = g.personById(c.pid); if (p && g.chance(0.6)) { p.status = 'jail'; p.labels.push('enemy'); return 'Charges were filed. The case went to court — and you won.'; } return 'The police took a statement. It’s slow.'; } },
      { label: 'Ride it out', run: (g) => { g.stat('mood', -12); g.fame(-1); const partner = g.partner; if (partner) partner.trust = Math.max(0, partner.trust - 10); return 'It blew over. Mostly.'; } },
    ],
  },
  {
    id: 'wrong_chat_family', title: 'WRONG CHAT', icon: '😱', who: (_g, c) => c.pid,
    text: (g, c) => say('You sent something private to {name}. Family. It’s a family legend now.', g.personById(c.pid)),
    choices: [{ label: 'Move to another country', run: (g, c) => { const p = g.personById(c.pid); if (p) p.rel = Math.max(0, p.rel - 15); g.stat('mood', -20); return 'Every holiday dinner, someone brings it up.'; } }],
  },
  {
    id: 'group_drama', title: 'Group Chat Drama', icon: '📣',
    text: (g) => g.pick(['Someone posted an embarrassing old photo of you in the group chat.', 'A fight broke out in the group chat. Everyone is taking sides.', 'The group chat is planning a birthday — and you’re in charge.']),
    random: { when: (g) => g.s.groups.length > 0, cooldown: 24 },
    choices: [
      { label: 'Laugh it off', hint: checkHint('charm', 45), run: (g) => { if (g.check('charm', 45)) { g.stat('charm', 1); return 'Everyone loved your reaction.'; } g.stat('mood', -5); return 'It got worse before it got better.'; } },
      { label: 'Mute the chat', run: (g) => { for (const p of g.peopleBy('friend')) if (g.chance(0.3)) p.rel = Math.max(0, p.rel - 3); return 'Peace and quiet. Some people noticed.'; } },
    ],
  },
  {
    id: 'phone_snoop', title: 'They Checked Your Phone', icon: '🔍', who: (g) => g.partner?.id ?? null,
    text: (g) => say('{name} went through your phone while you slept.', g.partner),
    random: { when: (g) => !!g.partner && hasTrait(g.partner, 'jealous') && Object.keys(g.s.chats).length > 2, cooldown: 36 },
    choices: [
      { label: 'Explain everything', hint: checkHint('charm', 55), run: (g) => { const p = g.partner; if (!p) return ''; if (g.check('charm', 55)) { p.trust = Math.max(0, p.trust - 5); return 'It took all night, but they believe you.'; } p.romance = Math.max(0, p.romance - 20); p.trust = Math.max(0, p.trust - 20); return 'They found a message they didn’t like. A huge fight.'; } },
      { label: 'Get angry they snooped', run: (g) => { const p = g.partner; if (p) { p.trust = Math.max(0, p.trust - 10); p.romance = Math.max(0, p.romance - 8); } return 'Two people furious at each other for different reasons.'; } },
    ],
  },
  {
    id: 'phone_warrant', title: 'Warrant for Your Phone', icon: '📱',
    text: () => 'Investigators served a warrant on your phone records.',
    random: { when: (g) => g.age >= 18 && activeCases(g).some((c) => c.suspect) && g.flag('digitalTrail') > 0, cooldown: 48 },
    choices: [{ label: 'Hope you deleted enough', run: (g) => { for (const c of activeCases(g)) if (c.suspect && !c.found.includes('digital')) c.found.push('digital'); recomputeWanted(g); return 'Every message you sent without a burner is now evidence.'; } }],
  },
];
