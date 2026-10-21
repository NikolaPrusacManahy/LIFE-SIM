import type { Game } from '../Game';
import type { Person, TextMessage } from '../types';
import { hasPhone } from '../systems/phone';
import { canBeIntimate, askNight } from '../systems/intimacy';
import { hasTrait } from '../npc/traits';
import { bump } from '../npc/interactions';
import { line } from '../npc/lines';
import { say } from '../npc/identity';
import { newId } from '../Game';
import { legalAge } from '../rules/us';

// Update 0.4 — texts arrive between time slots; replies are free (no slot).

export interface ReplyDef {
  label: string;
  req?: (g: Game, p: Person) => string | null;
  run: (g: Game, p: Person, m: TextMessage) => string;
}

const ROMANTIC = ['crush', 'talking', 'dating', 'partner', 'engaged', 'spouse', 'fling'];

export const REPLIES: Record<string, ReplyDef[]> = {
  invite: [
    { label: 'I’m in! 🙌', run: (g, p) => { bump(p, 'rel', 5); g.stat('mood', 4); g.stat('energy', -6); return say('You met up with {name}. Good times.', p); } },
    { label: 'Can’t, sorry', run: (_g, p) => { bump(p, 'rel', -1); return 'Maybe next time.'; } },
  ],
  meme: [
    { label: '😂😂😂', run: (_g, p) => { bump(p, 'rel', 2); return 'You sent back an even better one.'; } },
    { label: '👍', run: (_g, p) => { bump(p, 'rel', 0.5); return 'Thumbs up. Classic.'; } },
  ],
  drama: [
    { label: 'Support them ❤️', run: (_g, p) => { bump(p, 'rel', 5); bump(p, 'trust', 3); return say('{name}: "Thank you. Seriously."', p); } },
    { label: 'Stay out of it', run: (_g, p) => { bump(p, 'rel', -2); return 'You left it on read.'; } },
  ],
  money: [
    { label: 'Send $50', req: (g) => (g.canAfford(50) ? null : 'Need $50'), run: (g, p) => { g.money(-50); bump(p, 'rel', 6); return say('{name}: "Lifesaver! I owe you."', p); } },
    { label: 'Can’t right now', run: (_g, p) => { bump(p, 'rel', -2); return 'They understood. Mostly.'; } },
  ],
  news: [
    { label: 'Congrats!! 🎉', run: (_g, p) => { bump(p, 'rel', 3); return 'Your reply made their day.'; } },
  ],
  birthday: [
    { label: 'Happy birthday!! 🎉', run: (g, p) => { bump(p, 'rel', 5); p.tags.push(`bday:${g.year}`); return say('{name} sent a dozen hearts back.', p); } },
  ],
  date_ask: [
    { label: 'Yes! 😍', run: (g, p) => { bump(p, 'romance', 8); bump(p, 'rel', 3); g.stat('mood', 6); g.stat('energy', -8); return say('A cute evening with {name}.', p); } },
    { label: 'Not tonight', run: (_g, p) => { bump(p, 'romance', -2); return 'Rain check.'; } },
  ],
  uup: [
    { label: 'Come over 🌙', req: (g, p) => (canBeIntimate(g, p) ? null : 'Not available'), run: (g, p) => askNight(g, p) },
    { label: 'Going to sleep 😴', run: () => 'You put the phone face-down.' },
  ],
  appmatch: [
    { label: 'Let’s meet up', run: (g, p) => { g.queue('app_date', { pid: p.id }, true); return 'You picked a café.'; } },
    { label: 'Unmatch', run: (_g, p) => { p.status = 'moved'; return 'Unmatched.'; } },
  ],
  group: [{ label: 'lol', run: (_g, p) => { bump(p, 'rel', 1); return 'The group chat moved on.'; } }],
  // Update 0.5 — more incoming kinds
  goodmorning: [{ label: 'Good morning ☀️', run: (_g, p) => { bump(p, 'rel', 2); bump(p, 'romance', 2); return 'A good start to the day.'; } }],
  drunk: [
    { label: 'LOL go to sleep', run: (_g, p) => { bump(p, 'rel', 2); return 'They sent 14 more emojis.'; } },
    { label: 'Are you safe?', run: (_g, p) => { bump(p, 'trust', 4); return 'They said yes. You believe them. Mostly.'; } },
  ],
  ex2am: [
    { label: 'Leave it on read', run: () => 'Growth.' },
    { label: '“I miss you too”', run: (_g, p) => { bump(p, 'romance', 10); return 'You know this is a bad idea.'; } },
  ],
  crew: [{ label: '👍', run: (_g, p) => { p.loyalty = Math.min(100, (p.loyalty ?? 50) + 2); return 'Business as usual.'; } }],
  threat: [
    { label: 'Ignore it', run: () => 'You blocked the number. Then unblocked it. Then blocked it.' },
    { label: 'Threaten back', run: (_g, p) => { bump(p, 'rivalry', 10); return 'It’s escalating.'; } },
  ],
  detective: [{ label: '“Talk to my lawyer.”', run: () => 'No reply. That’s worse.' }],
};

export function sendText(g: Game, p: Person, kind: string, text: string, extra: Partial<TextMessage> = {}) {
  if (p.blocked || !p.theyHaveNumber || !hasPhone(g)) return;
  const id = newId();
  g.s.inbox.unshift({ id, pid: p.id, kind, text, turn: g.s.turn, read: false, replied: false, ...extra });
  // Update 0.5 — also lands in the chat thread, with reply chips
  (g.s.chats[p.id] ??= []).push({ id: newId(), from: p.id, text: text.replace(new RegExp(`^${p.name}: `), '').replace(/^"|"$/g, ''), turn: g.s.turn, read: false, branch: [id] });
  if (g.s.inbox.length > 80) g.s.inbox.length = 80;
}

export const unreadCount = (g: Game) => g.s.inbox.filter((m) => !m.read).length;

/** Each time slot: maybe a text arrives; stale texts expire and cost a little friendship. */
export function textsTick(g: Game) {
  if (!hasPhone(g)) return;
  for (const m of g.s.inbox) {
    if (!m.replied && g.s.turn - m.turn > 8 && REPLIES[m.kind]) {
      m.replied = true;
      const p = g.personById(m.pid);
      if (p) bump(p, 'rel', m.kind === 'birthday' ? -8 : -2);
      if (p && m.kind === 'birthday') p.memory.unshift({ clock: g.s.clock, text: 'You forgot their birthday', tone: 'bad' });
    }
  }
  if (!g.chance(0.22)) return;
  const contacts = g.s.people.filter((p) => p.alive && p.status === 'alive' && p.theyHaveNumber && !p.blocked && p.role !== 'teacher' && p.role !== 'professor' && (!p.tags.includes('detective') || g.s.underworld.cases.some((c) => c.suspect && c.status === 'open')));
  if (!contacts.length) return;
  const weighted = contacts.flatMap((p) => (hasTrait(p, 'clingy') || hasTrait(p, 'partyanimal') ? [p, p, p] : [p]));
  const p = weighted[Math.floor(Math.random() * weighted.length)];
  const roll = Math.random();
  // Update 0.5 — trait/role-driven incoming texts
  if (g.phase === 'morning' && (hasTrait(p, 'clingy') || hasTrait(p, 'romantic')) && ROMANTIC.includes(p.role) && roll < 0.5) {
    sendText(g, p, 'goodmorning', `${p.name}: "good morning ☀️ thinking of you"`);
    return;
  }
  if (g.phase === 'night' && hasTrait(p, 'partyanimal') && g.ageOf(p) >= legalAge(g, 'alcohol') && roll < 0.25) {
    sendText(g, p, 'drunk', `${p.name}: "heyyyy whre r u 🍻🍻 i love youuu"`);
    return;
  }
  if (g.phase === 'night' && p.role === 'ex' && g.age >= 18 && g.ageOf(p) >= 18 && roll < 0.2) {
    sendText(g, p, 'ex2am', `${p.name}: "you up? I miss us"`);
    return;
  }
  if (p.crewRole && roll < 0.4) {
    sendText(g, p, 'crew', `${p.name}: "${g.pick(['shipment came in', 'corner’s quiet tonight', 'cops drove by twice'])}"`);
    return;
  }
  if (p.rivalry >= 60 && roll < 0.3) {
    sendText(g, p, 'threat', `${p.name}: "watch your back."`);
    return;
  }
  if (p.tags.includes('detective') && roll < 0.5) {
    sendText(g, p, 'detective', `${p.name}: "We’d like to ask you a few more questions."`);
    return;
  }
  if (ROMANTIC.includes(p.role) && canBeIntimate(g, p) && g.phase === 'night' && roll < 0.35) {
    sendText(g, p, 'uup', line(g, 'uup', p, true), { mature: true });
  } else if (['dating', 'partner', 'talking'].includes(p.role) && roll < 0.5) {
    sendText(g, p, 'date_ask', `${p.name}: "Wanna do something tonight? 🥺"`);
  } else if (roll < 0.62 || hasTrait(p, 'partyanimal')) {
    sendText(g, p, 'invite', `${p.name}: "${g.pick(['party at mine tonight, u coming?', 'movie later?', 'wanna grab food?', 'come to the game with us!'])}"`);
  } else if (roll < 0.78) {
    sendText(g, p, 'meme', `${p.name}: ${g.pick(['[sends a cursed meme] 💀', '[a cat falling off a table]', '"this is literally you" [meme]'])}`);
  } else if (roll < 0.9) {
    sendText(g, p, 'drama', `${p.name}: "${g.pick(['ugh I need to vent', 'you will NOT believe what happened', 'can I tell you something? don’t tell anyone'])}"`);
  } else if (g.ageOf(p) >= 16) {
    sendText(g, p, 'money', `${p.name}: "hey… could you spot me $50? I’ll pay you back"`);
  }
}

export function reply(g: Game, msgId: string, idx: number): string {
  const m = g.s.inbox.find((x) => x.id === msgId);
  if (!m || m.replied) return '';
  const p = g.personById(m.pid);
  const r = REPLIES[m.kind]?.[idx];
  if (!p || !r) return '';
  const lock = r.req?.(g, p);
  if (lock) return lock;
  m.replied = true;
  m.read = true;
  p.lastContact = g.s.clock;
  return r.run(g, p, m);
}

/** Outbound "Say hi" — also how fake numbers get discovered. */
export function textHi(g: Game, pid: string): string {
  const p = g.personById(pid);
  if (!p || !p.hasNumber) return '';
  if (g.onCooldown(`hi:${p.id}`)) return 'You already texted them recently.';
  g.cooldown(`hi:${p.id}`, 4);
  if (p.fakeNumber) {
    p.hasNumber = false;
    p.fakeNumber = false;
    p.memory.unshift({ clock: g.s.clock, text: 'Gave you a fake number', tone: 'bad' });
    bump(p, 'rel', -5);
    return `Message failed: that number doesn’t exist. ${p.name} gave you a fake number. 😑`;
  }
  bump(p, 'rel', 1.5);
  p.lastContact = g.s.clock;
  return `${p.name} replied with a ${g.pick(['😊', '👋', '😂', '❤️'])}.`;
}
