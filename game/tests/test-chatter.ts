// Update 0.14 — the expanded message library: lots of varied openers and reactions, every kind answerable,
// personas have their own topics, and random texts stay role-appropriate.
import { check, done, resolveAll } from './harness';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import { CONTEXT } from '../src/state/phone/convo';
import { EXTRA_CONTEXT, EXTRA_REACT, STARTERS } from '../src/state/phone/chatter';
import { VOICE } from '../src/state/phone/voice';
import { textsTick } from '../src/state/phone/texts';
import { pendingMessage, contextReplies } from '../src/state/phone/convo';

const mk = (): Game => {
  const g = createLife({ name: 'C', familyName: 'H', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23 });
  g.give('phone');
  resolveAll(g);
  return g;
};

{
  const starterLines = Object.values(STARTERS).reduce((n, s) => n + s.lines.length, 0);
  const reactLines = Object.values(EXTRA_REACT).reduce((n, a) => n + a.length, 0);
  check(`100+ new messages and reactions (got ${starterLines} openers + ${reactLines} reactions)`, starterLines + reactLines >= 100);
  check('every starter pool points at a real, answerable message kind', Object.values(STARTERS).every((s) => CONTEXT[s.kind] && CONTEXT[s.kind].replies.length > 0), Object.values(STARTERS).filter((s) => !CONTEXT[s.kind]).map((s) => s.kind).join(', '));
  check('the extra message kinds are merged into CONTEXT', Object.keys(EXTRA_CONTEXT).every((k) => CONTEXT[k]));
  check('every extra kind has at least two replies, each with an intent', Object.values(EXTRA_CONTEXT).every((c) => c.replies.length >= 2 && c.replies.every((r) => r.intent && r.label)));
  check('no empty openers', Object.values(STARTERS).every((s) => s.lines.length > 0 && s.lines.every((l) => l.trim())));
}

{
  // personas have their own topics (otaku powerscaling/manga/cosplay; book nerds ask for recommendations)
  const otaku = VOICE.otaku.open.concat(VOICE.otaku.talk).join(' ').toLowerCase();
  check('otaku talk about powerscaling, manga and conventions', /powerscal/.test(otaku) && /manga/.test(otaku) && /cosplay|conv/.test(otaku));
  const book = VOICE.booknerd.open.join(' ').toLowerCase();
  check('book nerds ask for book recommendations', /recommend/.test(book) && VOICE.booknerd.open.length >= 6);
  check('every persona still has openers', Object.values(VOICE).every((v) => v.open.length > 0 && v.greet.length > 0));
}

{
  // a random text to a friend lands as an answerable message
  const g = mk();
  const f = g.addPerson('friend', { age: 24, gender: 'female', met: 'x', where: 'x' });
  f.hasNumber = true;
  f.theyHaveNumber = true;
  f.rel = 70;
  let answerable = 0;
  for (let i = 0; i < 400; i++) {
    g.s.chats[f.id] = [];
    g.s.flags[`msgm:${f.id}:${g.s.clock}`] = 0;
    g.s.flags[`inboxsent:${g.s.clock}`] = 0; // reset the monthly cap so each try can send
    g.s.flags[`inboxbudget:${g.s.clock}`] = 4;
    textsTick(g);
    const pend = pendingMessage(g, f.id);
    if (pend && contextReplies(g, f, pend).length > 0) answerable++;
  }
  check('random texts arrive and can be answered with contextual replies', answerable > 15, `${answerable}/400 produced an answerable text`);
}

{
  // the monthly cap keeps the inbox sane (0–3 casual texts a month)
  const g = mk();
  for (let i = 0; i < 6; i++) {
    const f = g.addPerson('friend', { age: 24, gender: 'female', met: 'x', where: 'x' });
    f.hasNumber = true;
    f.theyHaveNumber = true;
    f.rel = 60;
  }
  let maxInMonth = 0;
  for (let month = 0; month < 40; month++) {
    g.s.clock = 100 + month;
    const before = Object.values(g.s.chats).reduce((n, c) => n + c.filter((m) => m.from !== 'me').length, 0);
    for (let slot = 0; slot < 4; slot++) textsTick(g);
    const after = Object.values(g.s.chats).reduce((n, c) => n + c.filter((m) => m.from !== 'me').length, 0);
    maxInMonth = Math.max(maxInMonth, after - before);
  }
  check('no more than 3 casual texts land in a month (was 6+ birthday spam)', maxInMonth <= 3, `most in one month: ${maxInMonth}`);
}

done();
