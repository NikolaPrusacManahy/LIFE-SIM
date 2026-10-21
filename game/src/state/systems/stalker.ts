import type { Game } from '../Game';
import type { Person } from '../types';
import { YANDERE_HOLD, oppositeOf, personaOk, setPersona } from '../npc/persona';
import { settings } from '../settings';
import { darkCrimeOn } from '../crime/consent';
import { newId } from '../Game';
import { fmt } from './finance';

// Update 0.12 — stalked by a yandere (adults only, always the opposite sex). An unknown number sends photos of you,
// what you did today, things only you know. You can try to escape — or surrender to their… way of showing love.
// Refuse them at the reveal and it's 50/50: they kill you, or they end their own life (Dark Crime on).
// With Dark Crime off, a refusal means they vanish from your life. Nobody is ever caught.

export interface StalkerMsg { id: string; from: 'anon' | 'me'; text: string; photo?: string; turn: number }
export interface Stalker {
  pid: string;
  /** escalation 0–4; 4 = the reveal */
  stage: number;
  msgs: StalkerMsg[];
  /** replies you sent this month (3 max) */
  month: number;
  sent: number;
  read: boolean;
}

export const STALK_REVEAL = 4;
export const ANON_REPLIES_PER_MONTH = 3;

export const stalker = (g: Game) => g.s.stalker;
export const stalkerPerson = (g: Game) => (g.s.stalker ? g.personById(g.s.stalker.pid) : null);

/** A yandere who wants you but doesn't have you (yet). One you rejected comes first. */
export function stalkCandidate(g: Game): Person | null {
  if (g.age < 18) return null;
  const ok = (p: Person) => p.persona === 'yandere' && p.alive && p.status === 'alive' && g.ageOf(p) >= 18 && p.gender === genderFor(g, p) && !YANDERE_HOLD.includes(p.role);
  return g.s.people.find((p) => ok(p) && p.tags.includes('rejected')) ?? g.s.people.find((p) => p.persona === 'yandere' && p.alive && p.status === 'alive' && g.ageOf(p) >= 18 && p.gender === genderFor(g, p) && !YANDERE_HOLD.includes(p.role) && p.attraction >= 60) ?? null;
}
const genderFor = (g: Game, p: Person) => (g.s.gender === 'nonbinary' ? p.gender : oppositeOf(g));

const push = (g: Game, from: 'anon' | 'me', text: string, photo?: string) => {
  const s = g.s.stalker!;
  s.msgs.push({ id: newId(), from, text, photo, turn: g.s.turn });
  if (s.msgs.length > 60) s.msgs.splice(0, s.msgs.length - 60);
  if (from === 'anon') s.read = false;
};

export function startStalking(g: Game, p: Person): boolean {
  if (g.s.stalker || g.age < 18 || g.ageOf(p) < 18 || p.persona !== 'yandere') return false;
  g.s.stalker = { pid: p.id, stage: 0, msgs: [], month: g.s.clock, sent: 0, read: false };
  push(g, 'anon', p.tags.includes('rejected') ? g.pick(['you walked away from me. nobody walks away from me ♡', 'you said no. you didn’t mean it. I’ll show you ♡']) : 'hi ♡ you don’t know me. but I know you.');
  g.log('📵 An unknown number texted you.', 'bad');
  return true;
}

/** Things only you would know (or that they watched you do). */
export function secretsAbout(g: Game): string[] {
  const out: string[] = [];
  const recent = g.s.log.filter((l) => !l.text.startsWith('📵')).slice(0, 6);
  for (const l of recent) out.push(`I saw you today. “${l.text.replace(/\s+/g, ' ').slice(0, 70)}” ♡`);
  if (g.s.crime.record.length) out.push(`I know about the ${g.s.crime.record[0].toLowerCase()}. don’t worry. your secret is safe with me ♡`);
  out.push(`you have ${fmt(g.s.money)} in the bank. I could take care of you, you know ♡`);
  const ex = g.s.people.find((p) => p.role === 'ex');
  if (ex) out.push(`${ex.name} never deserved you. I made sure of that ♡`);
  // Update 0.12 — the obsession (any yandere, rejected or not)
  out.push('I kept a few strands of your hair. they’re in a jar next to my bed ♡ I say goodnight to them.');
  out.push('your toothbrush went missing, right? sorry ♡ I use it every night. it’s like kissing you.');
  out.push('I sleep in the shirt you lost at the gym. it still smells like you ♡');
  if (settings.mature) {
    out.push('I think about you every time I touch myself ♡ every single time.');
    out.push('last night I whispered your name when I… you know ♡ I wish you’d heard.');
  }
  const partner = g.partner;
  if (partner) out.push(`${partner.name} doesn’t look at you the way I do.`);
  if (g.flag('drunkTurn')) out.push('you were so cute drunk last time. you should be more careful who sees ♡');
  return out;
}

/** Monthly: maybe begin; otherwise the anonymous messages get closer and closer. */
export function stalkerMonth(g: Game) {
  const s = g.s.stalker;
  if (!s) {
    const c = stalkCandidate(g);
    // a rejected yandere starts the very next month
    if (c && (c.tags.includes('rejected') || g.chance(0.08))) startStalking(g, c);
    return;
  }
  const p = stalkerPerson(g);
  if (!p || !p.alive || p.status !== 'alive') {
    g.s.stalker = null;
    return;
  }
  s.month = g.s.clock;
  s.sent = 0;
  s.stage++;
  const lines = secretsAbout(g);
  push(g, 'anon', g.pick(lines), g.chance(0.6) ? g.pick(['📷 A photo of you, taken from across the street', '📷 You, asleep. Taken through your window', '📷 You at work, from behind a car', '📷 You, smiling at someone else. Their face is scratched out', '📷 A jar of hair. The label has your name on it', '📷 Your toothbrush, in someone else’s bathroom']) : undefined);
  if (s.stage >= 2) push(g, 'anon', g.pick(['soon ♡', 'we’re meant to be. you’ll see.', 'I’m closer than you think.']));
  if (s.stage >= STALK_REVEAL && !g.queued('stalker_reveal')) g.queue('stalker_reveal', { pid: p.id });
}

/** Update 0.12 — you rejected (or ignored) someone who's into you. A yandere stays and starts texting next month;
 *  a normal admirer has a 50% chance to turn yandere over it (adults of the opposite sex only). */
export const REJECT_TURN = 0.5;
export function rejectAdmirer(g: Game, p: Person): boolean {
  const turns = p.persona !== 'yandere' && personaOk(g, 'yandere', g.ageOf(p), p.gender) && g.chance(REJECT_TURN);
  if (p.persona !== 'yandere' && !turns) return false;
  setPersona(p, 'yandere');
  p.attraction = Math.max(p.attraction, 90);
  p.tags = p.tags.filter((t) => t !== 'stranger');
  if (!p.tags.includes('rejected')) p.tags.push('rejected');
  p.memory.unshift({ clock: g.s.clock, text: 'You rejected them', tone: 'bad' });
  return true;
}

export type AnonReply = 'who' | 'leave' | 'block' | 'police' | 'move' | 'listen';
export const ANON_REPLIES: { id: AnonReply; label: string; hint: string }[] = [
  { id: 'who', label: 'Who is this?', hint: 'They won’t say' },
  { id: 'leave', label: 'Leave me alone.', hint: 'They don’t like that' },
  { id: 'block', label: '🚫 Block the number', hint: '40% · or a new number' },
  { id: 'police', label: '🚓 Report it to the police', hint: '35% they back off' },
  { id: 'move', label: '📦 Move apartments ($3,000)', hint: '60% they lose you' },
  { id: 'listen', label: '…I’m listening ♡', hint: 'Surrender' },
];

export function anonLock(g: Game, r: AnonReply): string | null {
  const s = g.s.stalker;
  if (!s) return 'Gone';
  if (s.month === g.s.clock && s.sent >= ANON_REPLIES_PER_MONTH) return 'They stopped answering this month';
  if (r === 'move' && !g.canAfford(3000)) return 'Need $3,000';
  return null;
}

/** You escaped: they move on (they're never caught). */
function escaped(g: Game, text: string): string {
  const p = stalkerPerson(g);
  if (p) {
    p.status = 'moved';
    p.memory.unshift({ clock: g.s.clock, text: 'Stalked you. Gave up.', tone: 'bad' });
  }
  g.s.stalker = null;
  g.stat('mood', 10);
  g.log('🕊️ The unknown number stopped texting.', 'good');
  return text;
}

/** Answer the unknown number. */
export function anonReply(g: Game, r: AnonReply): string {
  const s = g.s.stalker;
  if (!s || anonLock(g, r)) return '';
  if (s.month !== g.s.clock) {
    s.month = g.s.clock;
    s.sent = 0;
  }
  s.sent++;
  s.read = true;
  push(g, 'me', ANON_REPLIES.find((x) => x.id === r)!.label);
  g.stat('mood', -2);
  switch (r) {
    case 'who':
      push(g, 'anon', g.pick(['someone who loves you ♡', 'you’ll know when you’re ready ♡', 'look behind you. kidding~ or am I']));
      return 'They won’t say.';
    case 'leave':
      s.stage = Math.min(STALK_REVEAL - 1, s.stage + 1);
      push(g, 'anon', g.pick(['never ♡', 'you don’t mean that.', 'that hurt. I’ll forgive you. this time.']));
      return 'That made it worse.';
    case 'block':
      if (g.chance(0.4)) return escaped(g, '🚫 Blocked. The messages stopped. For good.');
      push(g, 'anon', 'new number ♡ you can’t block love.');
      s.stage = Math.min(STALK_REVEAL - 1, s.stage + 1);
      return 'A new number. Same person.';
    case 'police':
      if (g.chance(0.35)) return escaped(g, '🚓 The police took a report. Whoever it was backed off.');
      push(g, 'anon', 'the police? really? ♡ they can’t help you. only I can.');
      return 'The police took a report. Nothing came of it.';
    case 'move':
      g.money(-3000);
      if (g.chance(0.6)) return escaped(g, '📦 New apartment, new routine. They lost you.');
      push(g, 'anon', 'nice new place ♡ the view from across the street is lovely.');
      s.stage = Math.min(STALK_REVEAL - 1, s.stage + 1);
      return 'They found you.';
    case 'listen':
      push(g, 'anon', 'I knew you’d understand ♡ meet me. tonight.');
      if (!g.queued('stalker_reveal')) g.queue('stalker_reveal', { pid: s.pid, surrender: 1 });
      return 'You stopped running.';
  }
}

/** The reveal: accept their love — or refuse. */
export function acceptStalker(g: Game): string {
  const p = stalkerPerson(g);
  g.s.stalker = null;
  if (!p) return 'Nobody came.';
  p.role = 'dating';
  p.romance = Math.max(p.romance, 85);
  p.rel = Math.max(p.rel, 60);
  p.hasNumber = true;
  p.theyHaveNumber = true;
  p.tags = p.tags.filter((t) => t !== 'stranger');
  p.memory.unshift({ clock: g.s.clock, text: 'Stalked you. You said yes.', tone: 'neutral' });
  g.burst('hearts');
  g.milestone(`Gave in to ${p.name}`);
  return `It was ${p.name} all along. You said yes. ${p.name} cried, laughed and held you like you might disappear. You’re together now. ♡`;
}

export function refuseStalker(g: Game): string {
  const p = stalkerPerson(g);
  g.s.stalker = null;
  if (!p) return 'Nobody came.';
  if (!darkCrimeOn()) {
    p.status = 'moved';
    return `“No.” ${p.name} stared at you for a long time, then walked away. You never heard from them again.`;
  }
  // 50 / 50, and nobody is ever caught
  if (g.chance(0.5)) {
    g.die(`Killed by ${p.name}, an obsessed admirer`);
    return `“No.” ${p.name} smiled. “Then nobody gets you.”`;
  }
  p.alive = false;
  p.status = 'dead';
  g.stat('mood', -25);
  p.memory.unshift({ clock: g.s.clock, text: 'Ended their own life after you refused them', tone: 'bad' });
  g.log(`🕯️ ${p.name} is gone.`, 'bad', p.id);
  return `“No.” ${p.name} left without a word. The next morning, the news said ${p.name} was gone. They left a note with only your name on it.`;
}
