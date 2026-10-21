import type { Game } from '../Game';
import type { Person } from '../types';
import type { ChatMsg } from '../crime/types';
import type { PlanKind } from './types';
import { newId } from '../Game';
import { bump } from '../npc/interactions';
import { hasTrait } from '../npc/traits';
import { say } from '../npc/identity';
import { npcState, setMad, clearMad, type NpcState } from '../npc/mood';
import { canBeIntimate, askNight } from '../systems/intimacy';
import { createPlan, nextSlot, slotLabel, PLAN_LABEL } from './plans';

// Update 0.8 — conversations as threads of turns. Every NPC message has a kind; the composer offers
// contextual replies to the latest unanswered one. Each reply → your bubble → their reaction bubble with an effect chip.

export type MsgType = 'greeting' | 'question' | 'invitation' | 'date' | 'request' | 'meme' | 'flirt' | 'badnews' | 'goodnews' | 'night' | 'serious' | 'other';
export type Intent = 'kind' | 'accept' | 'decline' | 'defer' | 'ask' | 'money' | 'react' | 'flirt' | 'shutdown' | 'read' | 'apology' | 'night' | 'cold';

export interface CtxReply {
  id: string;
  label: string;
  intent: Intent;
  /** shown only when this is true */
  when?: (g: Game, p: Person) => boolean;
  /** disabled with this reason */
  req?: (g: Game, p: Person) => string | null;
  /** a real gamble: odds are shown and rolled */
  odds?: (g: Game, p: Person) => number;
  run?: (g: Game, p: Person, ok: boolean) => void;
}

const romantic = (p: Person) => ['crush', 'talking', 'dating', 'partner', 'engaged', 'spouse', 'fling'].includes(p.role);
const committed = (p: Person) => ['dating', 'partner', 'engaged', 'spouse'].includes(p.role);
const INVITES = ['invite', 'date_ask', 'surprise', 'checkin', 'appmatch'];

/** Contextual replies for every kind of NPC-initiated message (tested: none is empty). */
export const CONTEXT: Record<string, { type: MsgType; replies: CtxReply[] }> = {
  goodmorning: { type: 'greeting', replies: [
    { id: 'gm', label: 'Morning! ☀️', intent: 'kind', run: (_g, p) => bump(p, 'rel', 2) },
    { id: 'gm_love', label: 'Thinking of you too ❤️', intent: 'kind', when: (_g, p) => romantic(p), run: (_g, p) => { bump(p, 'romance', 3); bump(p, 'rel', 1); } },
    { id: 'gm_who', label: 'Who’s this?', intent: 'cold', when: (_g, p) => p.rel < 30, run: (_g, p) => bump(p, 'rel', -2) },
    { id: 'gm_read', label: 'Leave on read', intent: 'read', run: (_g, p) => bump(p, 'rel', -1) },
  ] },
  question: { type: 'question', replies: [
    { id: 'q_good', label: 'Pretty good actually!', intent: 'kind', run: (_g, p) => bump(p, 'rel', 2) },
    { id: 'q_bad', label: 'Honestly? Rough.', intent: 'kind', run: (g, p) => { bump(p, 'trust', 2); g.stat('mood', 2); } },
    { id: 'q_joke', label: 'I’ll tell you when I’m famous', intent: 'kind', run: (_g, p) => bump(p, 'rel', 3) },
    { id: 'q_read', label: 'Leave on read', intent: 'read', run: (_g, p) => bump(p, 'rel', -1) },
  ] },
  invite: { type: 'invitation', replies: [
    { id: 'inv_yes', label: 'I’m in 🙌', intent: 'accept', run: (_g, p) => bump(p, 'rel', 3) },
    { id: 'inv_no', label: 'Can’t, sorry', intent: 'decline' },
    { id: 'inv_later', label: 'Another time?', intent: 'defer' },
    { id: 'inv_who', label: 'Who’s going?', intent: 'ask' },
  ] },
  date_ask: { type: 'date', replies: [
    { id: 'date_yes', label: 'Yes! 😍', intent: 'accept', run: (_g, p) => { bump(p, 'romance', 4); bump(p, 'rel', 2); } },
    { id: 'date_no', label: 'Not this time', intent: 'decline' },
    { id: 'date_other', label: 'Let’s do something else?', intent: 'defer' },
  ] },
  surprise: { type: 'date', replies: [
    { id: 'sur_yes', label: 'Ooh, I’m intrigued 👀', intent: 'accept', run: (_g, p) => bump(p, 'romance', 5) },
    { id: 'sur_no', label: 'I can’t that night…', intent: 'decline' },
  ] },
  checkin: { type: 'serious', replies: [
    { id: 'chk_yes', label: 'Of course. Tonight.', intent: 'accept', run: (_g, p) => bump(p, 'trust', 3) },
    { id: 'chk_what', label: 'Is everything okay?', intent: 'kind', run: (_g, p) => bump(p, 'trust', 2) },
    { id: 'chk_no', label: 'Can it wait?', intent: 'decline' },
  ] },
  neglect: { type: 'serious', replies: [
    { id: 'neg_yes', label: 'Of course I do. I’m sorry ❤️', intent: 'apology', run: (_g, p) => { bump(p, 'romance', 6); bump(p, 'trust', 3); } },
    { id: 'neg_busy', label: 'I’ve just been busy', intent: 'cold', run: (_g, p) => bump(p, 'romance', -3) },
    { id: 'neg_read', label: 'Leave on read', intent: 'read', run: (_g, p) => { bump(p, 'romance', -8); bump(p, 'trust', -5); } },
  ] },
  // Update 0.9 — after trying to take them home drunk
  furious: { type: 'serious', replies: [
    { id: 'fu_sorry', label: 'You’re right. I’m really sorry.', intent: 'apology', run: (_g, p) => bump(p, 'trust', 4) },
    { id: 'fu_drunk', label: 'I was drunk too…', intent: 'cold', run: (_g, p) => bump(p, 'rel', -3) },
    { id: 'fu_read', label: 'Leave on read', intent: 'read', run: (_g, p) => bump(p, 'rel', -6) },
  ] },
  standup: { type: 'serious', replies: [
    { id: 'st_sorry', label: 'I’m so sorry, something came up', intent: 'apology', run: (_g, p) => { bump(p, 'rel', 4); } },
    { id: 'st_forgot', label: 'I forgot 😬', intent: 'cold', run: (_g, p) => bump(p, 'rel', -3) },
  ] },
  money: { type: 'request', replies: [
    { id: 'm_send', label: 'Send $50', intent: 'money', req: (g) => (g.canAfford(50) ? null : 'Need $50'), run: (g, p) => { g.money(-50); bump(p, 'rel', 6); p.memory.unshift({ clock: g.s.clock, text: 'You lent them $50', tone: 'good' }); } },
    { id: 'm_send200', label: 'Send $200', intent: 'money', req: (g) => (g.canAfford(200) ? null : 'Need $200'), run: (g, p) => { g.money(-200); bump(p, 'rel', 10); p.memory.unshift({ clock: g.s.clock, text: 'You lent them $200', tone: 'good' }); } },
    { id: 'm_broke', label: 'I’m broke too', intent: 'decline' },
    { id: 'm_why', label: 'What for?', intent: 'ask' },
  ] },
  meme: { type: 'meme', replies: [
    { id: 'meme_lol', label: '😂', intent: 'react', run: (_g, p) => bump(p, 'rel', 2) },
    { id: 'meme_skull', label: '💀', intent: 'react', run: (_g, p) => bump(p, 'rel', 2) },
    { id: 'meme_thumb', label: '👍', intent: 'react', run: (_g, p) => bump(p, 'rel', 1) },
    { id: 'meme_lmao', label: 'LMAO', intent: 'react', run: (_g, p) => bump(p, 'rel', 3) },
    { id: 'meme_why', label: 'why are you like this', intent: 'react', run: (_g, p) => bump(p, 'rel', 2) },
  ] },
  flirt: { type: 'flirt', replies: [
    { id: 'fl_back', label: 'Flirt back 😏', intent: 'flirt', odds: (_g, p) => Math.min(0.95, 0.45 + p.attraction / 200 + p.romance / 300), run: (_g, p, ok) => { bump(p, 'attraction', ok ? 6 : 0); bump(p, 'romance', ok ? 4 : 0); } },
    { id: 'fl_thanks', label: 'Aw, thank you 😊', intent: 'kind', run: (_g, p) => bump(p, 'rel', 2) },
    { id: 'fl_stop', label: 'Let’s keep it friends', intent: 'shutdown', run: (_g, p) => { bump(p, 'attraction', -10); bump(p, 'romance', -5); } },
  ] },
  drama: { type: 'badnews', replies: [
    { id: 'dr_listen', label: 'Tell me everything', intent: 'kind', run: (_g, p) => { bump(p, 'rel', 4); bump(p, 'trust', 3); } },
    { id: 'dr_here', label: 'I’m here for you ❤️', intent: 'kind', run: (_g, p) => { bump(p, 'rel', 4); bump(p, 'trust', 2); } },
    { id: 'dr_out', label: 'Stay out of it', intent: 'read', run: (_g, p) => bump(p, 'rel', -2) },
  ] },
  badnews: { type: 'badnews', replies: [
    { id: 'bn_sorry', label: 'Oh no — I’m so sorry', intent: 'kind', run: (_g, p) => { bump(p, 'rel', 4); bump(p, 'trust', 2); } },
    { id: 'bn_help', label: 'Anything I can do?', intent: 'kind', run: (_g, p) => { bump(p, 'rel', 5); bump(p, 'trust', 3); } },
    { id: 'bn_read', label: 'Leave on read', intent: 'read', run: (_g, p) => bump(p, 'rel', -4) },
  ] },
  news: { type: 'goodnews', replies: [
    { id: 'gn_congrats', label: 'Congrats!! 🎉', intent: 'kind', run: (_g, p) => bump(p, 'rel', 3) },
    { id: 'gn_proud', label: 'So proud of you', intent: 'kind', run: (_g, p) => { bump(p, 'rel', 3); bump(p, 'trust', 1); } },
  ] },
  birthday: { type: 'goodnews', replies: [
    { id: 'bd_hb', label: 'Happy birthday!! 🎉', intent: 'kind', run: (g, p) => { bump(p, 'rel', 5); p.tags.push(`bday:${g.year}`); } },
  ] },
  uup: { type: 'night', replies: [
    { id: 'uup_come', label: 'Come over 🌙', intent: 'night', req: (g, p) => (canBeIntimate(g, p) ? null : 'Not available') },
    { id: 'uup_sleep', label: 'Going to sleep 😴', intent: 'kind' },
  ] },
  appmatch: { type: 'invitation', replies: [
    { id: 'am_meet', label: 'Let’s meet up', intent: 'accept' },
    { id: 'am_un', label: 'Unmatch', intent: 'shutdown', run: (_g, p) => { p.status = 'moved'; } },
  ] },
  drunk: { type: 'meme', replies: [
    { id: 'dk_lol', label: 'LOL go to sleep', intent: 'react', run: (_g, p) => bump(p, 'rel', 2) },
    { id: 'dk_safe', label: 'Are you safe?', intent: 'kind', run: (_g, p) => bump(p, 'trust', 4) },
  ] },
  ex2am: { type: 'flirt', replies: [
    { id: 'ex_read', label: 'Leave on read', intent: 'read' },
    { id: 'ex_miss', label: '“I miss you too”', intent: 'flirt', odds: () => 0.85, run: (_g, p, ok) => bump(p, 'romance', ok ? 10 : 0) },
  ] },
  crew: { type: 'other', replies: [{ id: 'cr_ok', label: '👍', intent: 'react', run: (_g, p) => { p.loyalty = Math.min(100, (p.loyalty ?? 50) + 2); } }] },
  threat: { type: 'other', replies: [
    { id: 'th_ign', label: 'Ignore it', intent: 'read' },
    { id: 'th_back', label: 'Threaten back', intent: 'cold', run: (_g, p) => bump(p, 'rivalry', 10) },
  ] },
  detective: { type: 'other', replies: [{ id: 'det_law', label: '“Talk to my lawyer.”', intent: 'cold' }] },
  group: { type: 'meme', replies: [{ id: 'grp_lol', label: 'lol', intent: 'react', run: (_g, p) => bump(p, 'rel', 1) }] },
};

/** NPC kinds that don't expect an answer. */
export const NO_REPLY = new Set(['closing', 'expired', 'reaction', 'system']);

// ------------------------------------------------------------ reaction lines

const REACT: Record<Intent, string[]> = {
  kind: ['😊😊', 'you’re the best', 'haha same', 'aww ❤️', 'that made my day', 'okay good 😌'],
  accept: ['yesss see u at 8 🎉', 'perfect!! can’t wait', 'ok it’s a plan 🙌', 'yay!! see you {slot}'],
  decline: [],
  defer: [],
  ask: [],
  money: ['omg THANK YOU, I owe you big', 'lifesaver 🙏 paying you back friday', 'you’re an angel'],
  react: ['😂😂', 'I KNEW you’d like it', 'right??', 'sending you another one'],
  flirt: ['stop 😳', 'okay that one worked', 'you’re trouble 😏'],
  shutdown: ['oh… yeah, totally. friends 🙂', 'got it. no worries', 'okay. sorry'],
  read: [],
  apology: ['…okay. thank you for saying that ❤️', 'I needed to hear that', 'okay. we’re okay.'],
  night: ['omw 😏', 'see you soon 🌙'],
  cold: ['…okay.', 'k.', 'right.', 'wow okay'],
};
const MAD = ['still mad about {reason}.', 'not really in the mood to talk.', '…', 'oh NOW you text me?'];
const AWKWARD = ['haha… ok 😅', 'oh! um. thanks?', 'that’s… sweet I guess'];
const FLIRT_FAIL = ['lol', 'cheesy 😂', 'did you google that'];
const DECLINE: Record<'understanding' | 'disappointed' | 'jealous', string[]> = {
  understanding: ['np, next time!', 'all good, another day 😊', 'no worries!'],
  disappointed: ['you always say that', 'oh… ok', 'fine. whatever.'],
  jealous: ['are you seeing someone else?', 'who are you hanging out with instead?', 'hm. ok. busy with who?'],
};
const CLOSING = ['gtg, see u tmrw 👋', 'ok I’m heading to bed, night!', 'talk later!', 'gotta run 🏃'];
const FOLLOWUP = ['what are you up to today?', 'how’s everything going btw?', 'did you hear about the thing at school/work??'];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// ------------------------------------------------------------ effect chip

type Snap = { rel: number; romance: number; trust: number; attraction: number; mood: number; money: number };
const snap = (g: Game, p: Person): Snap => ({ rel: p.rel, romance: p.romance, trust: p.trust, attraction: p.attraction, mood: g.s.stats.mood, money: g.s.money });
export function effectChip(g: Game, p: Person, before: Snap): string {
  const now = snap(g, p);
  const parts: string[] = [];
  const add = (label: string, d: number) => {
    const r = Math.round(d);
    if (r) parts.push(`${label} ${r > 0 ? '+' : '−'}${Math.abs(r)}`);
  };
  add('🤝', now.rel - before.rel);
  add('❤', now.romance - before.romance);
  add('Trust', now.trust - before.trust);
  add('✨', now.attraction - before.attraction);
  add('😊', now.mood - before.mood);
  if (now.money !== before.money) parts.push(`${now.money > before.money ? '+' : '−'}$${Math.abs(now.money - before.money).toLocaleString()}`);
  return parts.join(' · ');
}

// ------------------------------------------------------------ threads

const MONTHLY_KEY = (g: Game, id: string) => `msgm:${id}:${g.s.clock}`;
export const MAX_PER_MONTH = 10;
export const sentThisMonth = (g: Game, threadId: string) => g.flag(MONTHLY_KEY(g, threadId));
export const countMessage = (g: Game, threadId: string) => g.inc(MONTHLY_KEY(g, threadId));

export function pushMsg(g: Game, threadId: string, m: Omit<ChatMsg, 'id' | 'read'> & { read?: boolean }): ChatMsg {
  const list = (g.s.chats[threadId] ??= []);
  const msg: ChatMsg = { id: newId(), read: false, ...m };
  list.push(msg);
  if (list.length > 80) list.splice(0, list.length - 80);
  return msg;
}

/** The newest NPC message still waiting for an answer (contextual chips are offered for it). */
export function pendingMessage(g: Game, pid: string): ChatMsg | null {
  const list = g.s.chats[pid] ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    if (m.from === 'me') return null;
    if (m.turn > g.s.turn) continue;
    if (m.kind && CONTEXT[m.kind] && !m.answered) return m;
    if (m.kind && !NO_REPLY.has(m.kind) && !CONTEXT[m.kind]) return null;
  }
  return null;
}

export function contextReplies(g: Game, p: Person, m: ChatMsg): { reply: CtxReply; reason: string | null; odds: number | null }[] {
  const ctx = CONTEXT[m.kind ?? ''];
  if (!ctx) return [];
  return ctx.replies.filter((r) => !r.when || r.when(g, p)).map((r) => ({ reply: r, reason: r.req?.(g, p) ?? null, odds: r.odds ? r.odds(g, p) : null }));
}

export interface AnswerResult {
  error?: string;
  /** what they said (null = nothing, e.g. left on read) */
  reply: string | null;
  /** ms of typing before the reaction shows */
  delay: number;
  /** a longer outcome line for the log (e.g. a night together) */
  note?: string;
}

function declineLine(g: Game, p: Person): string {
  if ((hasTrait(p, 'jealous') || hasTrait(p, 'clingy')) && romantic(p)) return pick(DECLINE.jealous);
  const n = g.inc(`declined:${p.id}`);
  if (n >= 3 || p.rel < 35) return pick(DECLINE.disappointed);
  return pick(DECLINE.understanding);
}

const KIND_PLAN: Record<string, PlanKind> = { invite: 'party', date_ask: 'date', surprise: 'date', checkin: 'talk', appmatch: 'date' };

/** Answer the pending NPC message with one of its contextual replies. */
export function answer(g: Game, pid: string, msgId: string, replyId: string): AnswerResult {
  const p = g.personById(pid);
  const list = g.s.chats[pid] ?? [];
  const m = list.find((x) => x.id === msgId);
  if (!p || !m || m.answered) return { error: 'Nothing to answer', reply: null, delay: 0 };
  const ctx = CONTEXT[m.kind ?? ''];
  const r = ctx?.replies.find((x) => x.id === replyId);
  if (!r) return { error: 'Not available', reply: null, delay: 0 };
  if (r.when && !r.when(g, p)) return { error: 'Not available', reply: null, delay: 0 };
  const lock = r.req?.(g, p);
  if (lock) return { error: lock, reply: null, delay: 0 };
  if (!m.free && sentThisMonth(g, pid) >= MAX_PER_MONTH) return { error: `Limit reached — ${MAX_PER_MONTH} messages this month`, reply: null, delay: 0 };
  if (!m.free) countMessage(g, pid);

  const state = npcState(g, p);
  const before = snap(g, p);
  m.read = true;
  p.lastContact = g.s.clock;
  for (const x of g.s.inbox) if (m.branch?.includes(x.id)) { x.replied = true; x.read = true; }

  // "Who's going?" / "What for?" keep the thread open: same chips stay on their next message
  if (r.intent === 'ask') {
    m.answered = true;
    pushMsg(g, pid, { from: 'me', text: r.label, turn: g.s.turn, read: true });
    const line = m.kind === 'money' ? pick(['rent’s due and I’m short 😩', 'car broke down again', 'long story, I swear I’ll pay you back']) : pick(['just a few of us 🙂', 'the usual crew + some people from work', 'you, me, and whoever shows up lol']);
    pushMsg(g, pid, { from: p.id, text: line, turn: g.s.turn, kind: m.kind, expires: m.expires, free: true, branch: m.branch });
    return { reply: line, delay: 700 };
  }

  pushMsg(g, pid, { from: 'me', text: r.label, turn: g.s.turn, read: true });
  m.answered = true;

  if (r.intent === 'read') {
    r.run?.(g, p, true);
    return { reply: null, delay: 0 };
  }

  let line: string;
  let note: string | undefined;
  let ok = true;
  if (r.odds) ok = Math.random() < r.odds(g, p);

  if (state.mood === 'mad' && ['kind', 'react', 'flirt', 'accept', 'money'].includes(r.intent)) {
    // still upset: no gains, a cold line with the reason
    line = say(pick(MAD), p, g.s.name).replace('{reason}', (state.reason ?? 'that').split(',')[0]);
    if (r.intent === 'money') r.run?.(g, p, true);
  } else if (r.intent === 'apology') {
    r.run?.(g, p, true);
    clearMad(g, p);
    line = pick(REACT.apology);
  } else if (r.intent === 'accept') {
    r.run?.(g, p, true);
    const kind: PlanKind = (m.kind === 'invite' && (g.s.inbox.find((x) => m.branch?.includes(x.id))?.ctx?.plan as PlanKind)) || KIND_PLAN[m.kind ?? ''] || 'hang';
    const plan = createPlan(g, p, kind, m.kind === 'invite' ? 'invite' : m.kind === 'checkin' ? 'checkin' : m.kind === 'surprise' ? 'surprise' : 'date', m.expires ?? nextSlot(g));
    line = pick(REACT.accept).replace('{slot}', slotLabel(g, plan.turn));
    note = `📅 Plan: ${PLAN_LABEL[plan.kind]} with ${p.name}, ${slotLabel(g, plan.turn)}`;
  } else if (r.intent === 'decline') {
    r.run?.(g, p, true);
    line = declineLine(g, p);
    bump(p, committed(p) ? 'romance' : 'rel', g.flag(`declined:${p.id}`) >= 3 ? -4 : -1);
  } else if (r.intent === 'defer') {
    line = 'how about another day then?';
    const later = nextSlot(g, 2, 5);
    pushMsg(g, pid, { from: p.id, text: line, turn: g.s.turn, read: false });
    const ask = `${slotLabel(g, later)} work for you? 🙂`;
    pushMsg(g, pid, { from: p.id, text: ask, turn: g.s.turn, kind: m.kind, expires: later, free: true });
    return { reply: ask, delay: 900, note: undefined };
  } else if (r.intent === 'night') {
    note = askNight(g, p);
    line = canBeIntimate(g, p) ? pick(REACT.night) : 'maybe another time';
  } else if (r.intent === 'flirt' && !ok) {
    r.run?.(g, p, false);
    line = pick(FLIRT_FAIL);
  } else if (r.intent === 'kind' && romantic(p) === false && m.kind === 'flirt' && p.rel < 20) {
    r.run?.(g, p, true);
    line = pick(AWKWARD);
  } else {
    r.run?.(g, p, ok);
    line = pick(REACT[r.intent].length ? REACT[r.intent] : REACT.kind);
  }

  const effects = effectChip(g, p, before) || undefined;
  // busy people answer next slot (the bubble stays hidden until then)
  const turn = state.mood === 'busy' ? g.s.turn + 1 : g.s.turn;
  pushMsg(g, pid, { from: p.id, text: say(line, p, g.s.name), turn, kind: 'reaction', effects });
  // the conversation goes on (a follow-up question) or winds down
  if (state.mood === 'ok' && r.intent === 'kind' && Math.random() < 0.3) pushMsg(g, pid, { from: p.id, text: pick(FOLLOWUP), turn, kind: 'question', free: true });
  else if (state.mood !== 'mad' && Math.random() < 0.35) pushMsg(g, pid, { from: p.id, text: pick(CLOSING), turn, kind: 'closing' });
  return { reply: state.mood === 'busy' ? null : line, delay: state.mood === 'busy' ? 0 : 800, note };
}

/** Each slot: unanswered invitations expire with a small sting. */
export function expireInvites(g: Game) {
  for (const [pid, list] of Object.entries(g.s.chats)) {
    for (const m of list) {
      if (m.from === 'me' || m.answered || !m.kind || !INVITES.includes(m.kind) || m.expires === undefined || m.expires > g.s.turn) continue;
      m.answered = true;
      const p = g.personById(pid);
      if (!p) continue;
      bump(p, committed(p) ? 'romance' : 'rel', -2);
      if (committed(p)) setMad(g, p, 'ignored their invite');
      pushMsg(g, pid, { from: p.id, text: pick(['guess you’re busy 🙃', 'ok then 🙃', 'nvm lol']), turn: g.s.turn, kind: 'expired' });
    }
  }
}

export const stateOf = (g: Game, p: Person): NpcState => npcState(g, p);
