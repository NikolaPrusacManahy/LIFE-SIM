// Update 0.8 — Connected: conversations, plans, the action pipeline, notifications and profile cleanup.
import { readFileSync } from 'node:fs';
import { check, done } from './harness';
import { simulateLife } from './sim';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import { Game } from '../src/state/Game';
import { CONTEXT, NO_REPLY, MAX_PER_MONTH, answer, contextReplies, pendingMessage, expireInvites } from '../src/state/phone/convo';
import { sendText } from '../src/state/phone/texts';
import { CHIPS, CHAT_POOLS, chipsFor, isGamble, sendChip, tabsFor } from '../src/state/phone/chat';
import { badgeCount, readThread, unreadThreads } from '../src/state/phone/notify';
import { setMad, npcState } from '../src/state/npc/mood';
import { INTERACTION_BY_ID, doInteraction, interact, interactionsFor, usesSlot } from '../src/state/npc/interactions';
import { IDLE, canShowBanners, canShowEvents, pipelineReducer } from '../src/state/pipeline';
import type { Person } from '../src/state/types';

applySettings({ ageConfirmed: true, isAdult: true, mature: true, darkCrime: false });

const mk = () => {
  const g = createLife({ name: 'C', familyName: 'N', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23 });
  g.give('phone');
  // evening: nobody is busy at work/school
  g.s.phase = 2;
  return g;
};
const friend = (g: Game, role: Person['role'] = 'friend', age = 24) => {
  const p = g.addPerson(role, { age });
  p.hasNumber = true;
  p.theyHaveNumber = true;
  p.rel = 60;
  p.mood = 70;
  return p;
};
const last = (g: Game, pid: string) => (g.s.chats[pid] ?? []).slice(-1)[0];

// ---------- every NPC-initiated kind has contextual replies
const seen = new Set<string>();
for (let i = 0; i < 120; i++) {
  const life = simulateLife(i % 2 ? 'middle' : 'rich', i % 3 ? 'city' : 'country', { maxTurns: 160, ageOffset: 4 + (i % 8), social: 0.3, chat: 0.3, start: { startAge: 23 } });
  for (const list of Object.values(life.s.chats)) for (const m of list) if (m.from !== 'me' && m.kind) seen.add(m.kind);
}
const orphan = [...seen].filter((k) => !CONTEXT[k] && !NO_REPLY.has(k));
check('NPC messages were exercised', seen.size >= 6, [...seen].join(','));
check('every NPC-initiated message kind has contextual replies', orphan.length === 0, orphan.join(','));
check('every context has at least one reply', Object.values(CONTEXT).every((c) => c.replies.length > 0));

// ---------- every reply: your bubble + their reaction bubble (except leaving it on read)
let missingBubble = 0;
for (const [kind, ctx] of Object.entries(CONTEXT)) {
  for (const r of ctx.replies) {
    const g = mk();
    const p = friend(g, kind === 'date_ask' || kind === 'surprise' || kind === 'checkin' || kind === 'neglect' ? 'partner' : 'friend');
    sendText(g, p, kind, `${p.name}: "test ${kind}"`);
    const m = pendingMessage(g, p.id);
    if (!m) { missingBubble++; continue; }
    const avail = contextReplies(g, p, m).find((x) => x.reply.id === r.id);
    if (!avail || avail.reason) continue;
    const before = g.s.chats[p.id].length;
    const res = answer(g, p.id, m.id, r.id);
    const added = g.s.chats[p.id].slice(before);
    const mine = added.some((x) => x.from === 'me');
    const theirs = added.some((x) => x.from === p.id);
    if (res.error || !mine || (r.intent !== 'read' && !theirs)) missingBubble++;
  }
}
check('every contextual reply makes your bubble and their reaction', missingBubble === 0, `${missingBubble}`);

// ---------- invitations: accept → plan · decline → reaction · ignore → expiry
{
  const g = mk();
  const p = friend(g);
  sendText(g, p, 'invite', `${p.name}: "party at mine tonight, u coming?"`);
  const m = pendingMessage(g, p.id)!;
  answer(g, p.id, m.id, 'inv_yes');
  check('accepting an invitation creates a plan', g.s.plans.some((x) => x.pid === p.id && x.status === 'set'));
  const g2 = mk();
  const q = friend(g2);
  sendText(g2, q, 'invite', `${q.name}: "movie later?"`);
  answer(g2, q.id, pendingMessage(g2, q.id)!.id, 'inv_no');
  check('declining gets a reaction message', last(g2, q.id).from === q.id && !g2.s.plans.length);
  const g3 = mk();
  const r = friend(g3);
  sendText(g3, r, 'invite', `${r.name}: "wanna grab food?"`);
  g3.s.turn += 8;
  expireInvites(g3);
  check('unanswered invitations expire with a message', last(g3, r.id).kind === 'expired' && !pendingMessage(g3, r.id));
}

// ---------- 0.10: "tonight" means today — at night it starts right away; in the morning it's this evening
{
  const g = mk();
  g.s.phase = 3;
  const p = friend(g);
  sendText(g, p, 'invite', `${p.name}: "movie tonight?"`);
  answer(g, p.id, pendingMessage(g, p.id)!.id, 'inv_yes');
  const plan = g.s.plans[0];
  check('accepted at Night: the plan is right now (same slot)', plan.turn === g.s.turn && g.currentEvent?.id === 'plan_scene');
  const t0 = g.s.turn;
  g.resolveChoice(0);
  check('…and going uses this slot', plan.status === 'done' && g.s.turn === t0 + 1);
  const m = mk();
  m.s.phase = 0;
  const q = friend(m);
  const clock = m.s.clock;
  sendText(m, q, 'invite', `${q.name}: "come over later?"`);
  answer(m, q.id, pendingMessage(m, q.id)!.id, 'inv_yes');
  const pl = m.s.plans[0];
  check('accepted in the Morning: it’s this evening, same day', pl.turn === m.s.turn + 2 && Math.floor((m.s.phase + 2) / 4) === 0 && m.s.clock === clock && !m.currentEvent);
  const n = mk();
  n.s.phase = 2;
  const r = friend(n);
  sendChip(n, r.id, 'hangplan');
  check('your own “Hang out?” in the evening also starts right away (if they say yes)', n.s.plans.length === 0 || (n.s.plans[0].turn === n.s.turn && n.queued('plan_scene')));
}

// ---------- plans play as a scene in their slot
{
  const g = mk();
  const p = friend(g);
  sendText(g, p, 'invite', `${p.name}: "come over later? 🎮"`);
  answer(g, p.id, pendingMessage(g, p.id)!.id, 'inv_yes');
  const plan = g.s.plans[0];
  let guard = 0;
  while (!g.queued('plan_scene') && guard++ < 12) {
    if (g.currentEvent) { const i = g.choicesFor(g.currentEvent).findIndex((c) => !c.disabled); g.resolveChoice(Math.max(0, i)); continue; }
    g.autopilot();
  }
  check('the plan scene starts in its slot', g.queued('plan_scene') && g.s.turn === plan.turn, `turn ${g.s.turn} plan ${plan.turn}`);
  while (g.currentEvent && g.currentEvent.id !== 'plan_scene') g.resolveChoice(0);
  const t0 = g.s.turn;
  g.resolveChoice(0);
  check('going uses the slot and completes the plan', plan.status === 'done' && g.s.turn === t0 + 1);
  const h = mk();
  const q = friend(h);
  sendText(h, q, 'invite', `${q.name}: "party?"`);
  answer(h, q.id, pendingMessage(h, q.id)!.id, 'inv_yes');
  const pl = h.s.plans[0];
  guard = 0;
  while (!h.queued('plan_scene') && guard++ < 12) {
    if (h.currentEvent) { h.resolveChoice(0); continue; }
    h.autopilot();
  }
  while (h.currentEvent && h.currentEvent.id !== 'plan_scene') h.resolveChoice(0);
  h.resolveChoice(1);
  check('standing someone up hurts and makes them upset', pl.status === 'missed' && npcState(h, q).mood === 'mad');
}

// ---------- kind messages land kindly unless they're upset
{
  let hostile = 0;
  let tries = 0;
  for (let i = 0; i < 60; i++) {
    const g = mk();
    const p = friend(g);
    p.rel = 5 + (i % 90);
    p.mood = 5 + (i % 90);
    for (const tab of tabsFor(g, p)) {
      for (const c of chipsFor(g, p, tab)) {
        if (isGamble(c.chip) || c.reason || c.chip.tab === 'conflict' || c.chip.tab === 'underworld' || c.chip.photo) continue;
        const gg = new Game(JSON.parse(JSON.stringify(g.s)));
        const res = sendChip(gg, p.id, c.chip.id);
        if (res.error || res.reply === null) continue;
        tries++;
        if (!CHAT_POOLS[c.chip.pool].ok.some((l) => res.reply === l || res.reply!.startsWith(l.split('{')[0]))) hostile++;
      }
    }
  }
  check('kind messages never get a hostile reply when they’re not upset', tries > 50 && hostile === 0, `${hostile}/${tries}`);
  const g = mk();
  const p = friend(g);
  setMad(g, p, 'insulted them');
  const res = sendChip(g, p.id, 'greet0');
  check('upset people say why', !!res.reply && res.reply.includes('insulted them'), res.reply ?? '');
  check('odds are only for real gambles', CHIPS.filter((c) => c.tab === 'greet' || c.tab === 'support').every((c) => !isGamble(c) || c.id === 'missyou'));
}

// ---------- 10 per contact per month, +1 free reply to their messages
{
  const g = mk();
  const p = friend(g);
  let ok = 0;
  for (let i = 0; i < 14; i++) if (!sendChip(g, p.id, 'greet0').error) ok++;
  check(`${MAX_PER_MONTH} messages per contact per month`, ok === MAX_PER_MONTH, `${ok}`);
  sendText(g, p, 'meme', `${p.name}: [meme]`);
  const m = pendingMessage(g, p.id)!;
  check('their message still gets a free reply at the limit', !answer(g, p.id, m.id, 'meme_lol').error);
  g.s.clock++;
  check('the limit resets next month', !sendChip(g, p.id, 'greet0').error);
}

// ---------- badges = unread threads
{
  const g = mk();
  const a = friend(g);
  const b = friend(g);
  sendText(g, a, 'meme', `${a.name}: [meme]`);
  sendText(g, a, 'question', `${a.name}: "how was your day?"`);
  sendText(g, b, 'goodmorning', `${b.name}: "good morning ☀️"`);
  check('badge counts threads, not messages', badgeCount(g) === 2 && unreadThreads(g).length === 2);
  readThread(g, a.id);
  check('opening a thread clears its badge', badgeCount(g) === 1);
}

// ---------- profiles: no texting, every interaction has a result
{
  const src = readFileSync('src/screens/people/PeopleScreen.tsx', 'utf8');
  check('profile has no "Text hi" action, only Open chat', !src.includes('textHi') && !src.includes('Text "hi"') && src.includes('Open chat'));
  let empty = 0;
  const bad: string[] = [];
  for (let i = 0; i < 6; i++) {
    const g = mk();
    const people = [friend(g, 'friend'), friend(g, 'partner', 25), friend(g, 'rival'), friend(g, 'mother', 52), friend(g, 'crush', 23)];
    g.s.money = 5000;
    for (const p of people) {
      for (const ri of interactionsFor(g, p)) {
        if (!ri.ok) continue;
        const opt = ri.options?.find((o) => !o.reason)?.id;
        if (ri.options && !opt) continue;
        const gg = new Game(JSON.parse(JSON.stringify(g.s)));
        const text = interact(gg, p.id, ri.def.id, opt);
        if (!text.trim()) { empty++; bad.push(ri.def.id); }
      }
    }
  }
  check('every in-person interaction produces a result', empty === 0, [...new Set(bad)].join(','));
}

// ---------- your correction: profile actions take no time, once per time of day; outings still use the slot
{
  const g = mk();
  const p = friend(g);
  const t0 = g.s.turn;
  const r1 = doInteraction(g, p.id, 'compliment');
  check('a profile action (compliment) takes no time', !!r1 && g.s.turn === t0 && !!r1.text);
  check('…and can only be used once per time of day', interactionsFor(g, p).find((x) => x.def.id === 'compliment')?.reason === 'Once per time of day' && doInteraction(g, p.id, 'compliment')?.text === '');
  check('other free actions still work this slot', !!doInteraction(g, p.id, 'joke')?.text && g.s.turn === t0);
  const q = friend(g);
  check('the limit is per person', !!doInteraction(g, q.id, 'compliment')?.text);
  doInteraction(g, p.id, 'hangout', 'mall');
  check('an outing (hang out) uses the slot', g.s.turn === t0 + 1);
  check('next slot the compliment is available again', interactionsFor(g, p).find((x) => x.def.id === 'compliment')?.reason !== 'Once per time of day');
  check('ask for money, flirt, chat, compliment are all free', ['askmoney', 'flirt', 'chat', 'compliment'].every((id) => !usesSlot(INTERACTION_BY_ID[id])));
}

// ---------- the pipeline: nothing between "chosen" and "dismissed"
{
  const r = { title: 'Flirt', icon: '💘', text: 'ok', deltas: {}, fx: [], monthPassed: false };
  let p = pipelineReducer(IDLE, { type: 'result', result: r });
  check('no event while a result card is open', !canShowEvents(p) && !canShowBanners(p, false));
  p = pipelineReducer(p, { type: 'dismiss' });
  check('events flush after the card is dismissed', canShowEvents(p));
  check('banners wait for queued events', !canShowBanners(p, true) && canShowBanners(p, false));
  p = pipelineReducer(p, { type: 'lock' });
  check('a mini-game holds the queue', !canShowEvents(p) && !canShowBanners(p, false));
  p = pipelineReducer(p, { type: 'unlock', result: r });
  check('the mini-game ends on its own result card', p.stage === 'result' && !canShowEvents(p));
}

done();
