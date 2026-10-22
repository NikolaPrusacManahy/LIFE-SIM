import type { Game } from '../Game';
import type { Person, TextMessage } from '../types';
import { hasPhone } from '../systems/phone';
import { canBeIntimate } from '../systems/intimacy';
import { hasTrait } from '../npc/traits';
import { bump } from '../npc/interactions';
import { line } from '../npc/lines';
import { newId } from '../Game';
import { isRomanceEligible, say } from '../npc/identity';
import { YANDERE_MORNING, YANDERE_OUTFITS, isYandere } from '../datenight/yandere';
import { expireInvites, pushMsg } from './convo';
import { STARTERS } from './chatter';
import { todaySlot } from './plans';
import { personaOpener } from './voice';
import { pushNote } from './notify';
import { soberUp } from '../nightlife/night';
import { legalAge } from '../rules/us';

// Update 0.4 — texts arrive between time slots; replies are free (no slot).

const ROMANTIC = ['crush', 'talking', 'dating', 'partner', 'engaged', 'spouse', 'fling'];
const COMMITTED = ['dating', 'partner', 'engaged', 'spouse'];
const FAMILY = ['mother', 'father', 'sibling', 'child', 'grandparent'];
/** Update 0.8 — kinds that invite you to a slot (they expire when it passes). */
const INVITE_KINDS = ['invite', 'date_ask', 'surprise', 'checkin', 'appmatch'];

/** Banner sound bucket: partner / family / everyone else (unknown numbers included). */
export const senderTone = (p: Person) => (ROMANTIC.includes(p.role) ? 'partner' : FAMILY.includes(p.role) ? 'family' : 'other');

export function sendText(g: Game, p: Person, kind: string, text: string, extra: Partial<TextMessage> = {}) {
  if (p.blocked || !p.theyHaveNumber || !hasPhone(g)) return;
  const id = newId();
  g.s.inbox.unshift({ id, pid: p.id, kind, text, turn: g.s.turn, read: false, replied: false, ...extra });
  // Update 0.5 — also lands in the chat thread. Update 0.8 — typed, with a free reply and an expiry for invitations.
  const body = text.replace(new RegExp(`^${p.name}: `), '').replace(/^"|"$/g, '');
  // invitations are for today: they lapse when the day's evening/night slot passes
  const expires = INVITE_KINDS.includes(kind) ? todaySlot(g) : undefined;
  pushMsg(g, p.id, { from: p.id, text: body, turn: g.s.turn, branch: [id], kind, free: true, expires });
  pushNote(g, 'text', `${p.name}: ${body.slice(0, 60)}`, p.id, kind === 'birthday' ? '🎂' : '💬');
  if (g.s.inbox.length > 80) g.s.inbox.length = 80;
}


// Update 0.14 — cap casual incoming texts to 0–3 a month so the inbox doesn't spam (birthdays included).
// Story-critical texts (detective, threats, crew, the stalker) bypass the cap.
const MONTH_BUDGET_KEY = (g: Game) => `inboxbudget:${g.s.clock}`;
const MONTH_SENT_KEY = (g: Game) => `inboxsent:${g.s.clock}`;
/** 0–3 casual texts this month, fixed per month. */
export function monthlyTextBudget(g: Game): number {
  const k = MONTH_BUDGET_KEY(g);
  if (!g.s.flags[k]) g.s.flags[k] = ((g.s.clock * 2654435761) >>> 0) % 4 + 1; // store 1..4, read as 0..3
  return g.s.flags[k] - 1;
}
/** True (and counts one) if there's room for another casual text this month. */
export function allowCasualText(g: Game): boolean {
  if (g.flag(MONTH_SENT_KEY(g)) >= monthlyTextBudget(g)) return false;
  g.inc(MONTH_SENT_KEY(g));
  return true;
}

/** Update 0.14 — send a varied, role-appropriate opener from the big STARTERS library. */
function sendStarter(g: Game, p: Person): boolean {
  const pools: string[] = [];
  const role = p.role;
  if (['partner', 'spouse', 'engaged'].includes(role)) pools.push('partner_sweet', 'partner_miss', 'partner_worry');
  else if (['dating', 'talking', 'crush', 'fling'].includes(role)) pools.push('partner_sweet', 'partner_miss', 'friend_check');
  else if (role === 'ex' && g.age >= 18 && g.ageOf(p) >= 18) pools.push('ex_closure');
  else if (FAMILY.includes(role)) pools.push('family_warm');
  else if (role === 'coworker' || p.labels.includes('coworker')) pools.push('coworker_vent', 'friend_check');
  else if (p.labels.includes('rival') || p.rivalry >= 50) pools.push('rival_jab');
  else {
    pools.push('friend_check', 'friend_hang', 'friend_meme', 'friend_rant', 'friend_good', 'friend_fav');
    if (p.rel >= 60) pools.push('bestie_deep');
    if (isRomanceEligible(g, p) && p.attraction >= 45 && !ROMANTIC.includes(role)) pools.push('admirer_hint');
  }
  if (!pools.length) return false;
  const s = STARTERS[g.pick(pools)];
  sendText(g, p, s.kind, `${p.name}: "${g.pick(s.lines)}"`);
  return true;
}

/** Each time slot: maybe a text arrives; stale texts expire and cost a little friendship. */
export function textsTick(g: Game) {
  soberUp(g);
  if (!hasPhone(g)) return;
  expireInvites(g);
  for (const m of g.s.inbox) {
    if (!m.replied && g.s.turn - m.turn > 8 && m.kind === 'birthday') {
      m.replied = true;
      const p = g.personById(m.pid);
      if (p) {
        bump(p, 'rel', -8);
        p.memory.unshift({ clock: g.s.clock, text: 'You forgot their birthday', tone: 'bad' });
      }
    }
  }
  if (partnerTick(g)) return;
  if (!g.chance(0.45)) return;
  const contacts = g.s.people.filter((p) => p.alive && p.status === 'alive' && p.theyHaveNumber && !p.blocked && p.role !== 'teacher' && p.role !== 'professor' && (!p.tags.includes('detective') || g.s.underworld.cases.some((c) => c.suspect && c.status === 'open')));
  if (!contacts.length) return;
  // Update 0.14 — story-critical senders (threat, detective, crew) bypass the cap; everyone else respects it
  const p0 = contacts[Math.floor(Math.random() * contacts.length)];
  const isCritical = p0.tags.includes('detective') || p0.rivalry >= 60 || !!p0.crewRole;
  if (!isCritical && !allowCasualText(g)) return;
  const weighted = contacts.flatMap((p) => (hasTrait(p, 'clingy') || hasTrait(p, 'partyanimal') ? [p, p, p] : [p]));
  const p = weighted[Math.floor(Math.random() * weighted.length)];
  const roll = Math.random();
  // Update 0.12 — personas text like who they are
  if (p.persona && roll < 0.4) {
    sendText(g, p, `p_${p.persona}`, `${p.name}: "${personaOpener(g, p)}"`);
    return;
  }
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
  // Update 0.14 — a big varied pool of role-appropriate openers
  if (roll < 0.55 && sendStarter(g, p)) return;
  if (ROMANTIC.includes(p.role) && canBeIntimate(g, p) && g.phase === 'night' && roll < 0.35) {
    sendText(g, p, 'uup', line(g, 'uup', p, true), { mature: true });
  } else if (['dating', 'partner', 'talking'].includes(p.role) && roll < 0.5) {
    sendText(g, p, 'date_ask', `${p.name}: "Wanna do something tonight? 🥺"`);
  } else if (roll < 0.62 || hasTrait(p, 'partyanimal')) {
    sendText(g, p, 'invite', `${p.name}: "${g.pick(['party at mine tonight, u coming?', 'movie later?', 'wanna grab food?', 'come to the game with us!'])}"`);
  } else if (roll < 0.68 && isRomanceEligible(g, p) && p.attraction >= 40) {
    sendText(g, p, 'flirt', `${p.name}: "${g.pick(['you looked cute today', 'can’t stop thinking about our talk 😳', 'ok who gave you permission to be this funny'])}"`);
  } else if (roll < 0.72) {
    sendText(g, p, 'question', `${p.name}: "${g.pick(['how was your day?', g.s.education.current ? 'how was the exam??' : 'how’s work going?', 'what are you up to?'])}"`);
  } else if (roll < 0.78) {
    sendText(g, p, 'meme', `${p.name}: ${g.pick(['[sends a cursed meme] 💀', '[a cat falling off a table]', '"this is literally you" [meme]'])}`);
  } else if (roll < 0.9) {
    sendText(g, p, 'drama', `${p.name}: "${g.pick(['ugh I need to vent', 'you will NOT believe what happened', 'can I tell you something? don’t tell anyone'])}"`);
  } else if (g.ageOf(p) >= 16) {
    sendText(g, p, 'money', `${p.name}: "hey… could you spot me $50? I’ll pay you back"`);
  }
}

/** Update 0.8 — partners and close friends ask you out on their own; neglect shows up as fewer asks, then a hard question. */
function partnerTick(g: Game): boolean {
  if (!g.chance(0.12)) return false;
  const close = g.s.people.filter((p) => p.alive && p.status === 'alive' && p.theyHaveNumber && !p.blocked && (COMMITTED.includes(p.role) || (p.tags.includes('bestie') && p.rel >= 60)));
  if (!close.length) return false;
  const p = close[Math.floor(Math.random() * close.length)];
  if (g.s.plans.some((x) => x.pid === p.id && x.status === 'set')) return false;
  const neglected = g.s.clock - (p.lastContact ?? g.s.clock) >= 3;
  if (COMMITTED.includes(p.role) && neglected) {
    if (g.chance(0.5)) sendText(g, p, 'neglect', `${p.name}: "do you even want to be with me?"`);
    return true;
  }
  const keen = (hasTrait(p, 'romantic') || hasTrait(p, 'clingy') ? 1.6 : 1) * (hasTrait(p, 'homebody') ? 0.6 : 1) * (p.romance >= 60 || p.rel >= 70 ? 1.2 : 0.8);
  if (!g.chance(Math.min(0.9, 0.5 * keen))) return false;
  // Update 0.14 — a partner's casual message counts against the monthly cap (neglect above always goes)
  if (!allowCasualText(g)) return false;
  // Update 0.12 — a yandere partner's morning selfie
  if (COMMITTED.includes(p.role) && isYandere(p) && g.phase === 'morning' && g.chance(0.6)) {
    sendText(g, p, 'goodmorning', `${p.name}: "${YANDERE_MORNING}"`);
    if (hasPhone(g) && p.theyHaveNumber && !p.blocked) pushMsg(g, p.id, { from: p.id, text: '', photo: say(g.pick(YANDERE_OUTFITS), p), turn: g.s.turn });
    return true;
  }
  if (COMMITTED.includes(p.role)) {
    const r = Math.random();
    if (r < 0.15 && p.trust < 45) sendText(g, p, 'checkin', `${p.name}: "can we talk tonight?"`);
    else if (r < 0.35) sendText(g, p, 'surprise', `${p.name}: "I booked us something 👀 keep tonight free"`);
    else {
      // Update 0.11 — partners ask for movies and to come over (yours or theirs)
      const [msg, plan] = g.pick<[string, string]>([
        ['date night tonight? 🕯️', 'date'], ['let’s try that new place', 'date'],
        ['movie tonight? 🎬 I’ll get the popcorn', 'movie'], ['there’s a horror movie out 👀 come with me', 'movie'],
        ...(g.s.housing !== 'homeless' ? ([['can I come over tonight? 🥺', 'over'], ['your place tonight? I’ll bring wine 🍷', 'over']] as [string, string][]) : []),
        ['come over to mine tonight? 🏡', 'theirs'], ['my place is empty tonight 😏', 'theirs'],
      ]);
      sendText(g, p, 'date_ask', `${p.name}: "${msg}"`, { ctx: { plan } });
    }
  } else {
    sendText(g, p, 'invite', `${p.name}: "${g.pick(['wanna hang tonight?', 'come over later? 🎮', 'food? I’m starving'])}"`, { ctx: { plan: g.pick(['hang', 'game', 'food']) } });
  }
  return true;
}
