import type { Game } from '../Game';
import type { NightNpc } from './types';
import { INTOX_LIMIT, stageOf } from './types';
import { judgement, night, tick } from './night';
import { isRomanceEligible, say } from '../npc/identity';
import { hasTrait } from '../npc/traits';

// Update 0.8 — the conversation mini-game. Pick chips; their vibe, traits and how much everyone's had to drink shift the odds.

export type TalkChip = 'smalltalk' | 'joke' | 'compliment' | 'ask' | 'dance' | 'drink' | 'shot' | 'flirt' | 'deep' | 'leave';

export const CHIP_LABEL: Record<TalkChip, string> = {
  smalltalk: '💬 Small talk', joke: '😂 Joke', compliment: '🌟 Compliment', ask: '🗨️ Ask about them', dance: '💃 Dance with them',
  drink: '🍹 Buy them a drink', shot: '🥃 Take a shot together', flirt: '😏 Flirt', deep: '🌊 Talk deep', leave: '👋 Leave',
};

const BASE: Record<TalkChip, number> = { smalltalk: 0.75, joke: 0.6, compliment: 0.6, ask: 0.75, dance: 0.55, drink: 0.7, shot: 0.6, flirt: 0.45, deep: 0.5, leave: 1 };
const GAIN: Record<TalkChip, number> = { smalltalk: 10, joke: 14, compliment: 12, ask: 14, dance: 16, drink: 14, shot: 16, flirt: 18, deep: 16, leave: 0 };

export const current = (g: Game): NightNpc | null => {
  const n = g.s.night;
  return n && n.talking !== null ? n.crowd[n.talking] ?? null : null;
};

/** Walk up to someone. */
export function approach(g: Game, idx: number): string {
  const n = night(g);
  const c = n.crowd[idx];
  if (!c || c.done || n.time <= 0 || n.incident) return '';
  if (c.zone !== n.zone && !(c.zone === 'vip' && n.vip)) n.zone = c.zone;
  n.talking = idx;
  return c.vibe === 'alone' ? `${c.p.name} doesn’t look up.` : `You walk over to ${c.p.name}.`;
}

/** Chips you can use right now with this person. */
export function chipsFor(g: Game, c: NightNpc): { chip: TalkChip; reason: string | null; odds: number }[] {
  const n = night(g);
  const romance = isRomanceEligible(g, c.p);
  const out: TalkChip[] = ['smalltalk', 'joke', 'compliment', 'ask', 'dance', 'drink', 'shot'];
  if (romance) out.push('flirt');
  if (c.conn >= 40) out.push('deep');
  out.push('leave');
  return out.map((chip) => {
    let reason: string | null = null;
    if ((chip === 'drink' || chip === 'shot') && n.wristband && n.type === 'eighteen') reason = 'Wristband';
    if (chip === 'drink' && !g.canAfford(14)) reason = 'Need $14';
    if (chip === 'shot' && !g.canAfford(12)) reason = 'Need $12';
    if (chip === 'flirt' && c.conn < 30) reason = 'Get chatting first';
    return { chip, reason, odds: chip === 'leave' ? 1 : oddsOf(g, c, chip) };
  });
}

export function oddsOf(g: Game, c: NightNpc, chip: TalkChip): number {
  const n = night(g);
  let o = BASE[chip] + (g.s.stats.charm - 50) / 220 + (n.confidence - 50) / 300 - judgement(g);
  if (c.vibe === 'alone') o -= 0.45;
  if (c.vibe === 'fun' && (chip === 'joke' || chip === 'dance' || chip === 'shot')) o += 0.12;
  if (c.vibe === 'looking' && (chip === 'flirt' || chip === 'compliment')) o += 0.15;
  if (chip === 'joke' && hasTrait(c.p, 'funny')) o += 0.15;
  if (chip === 'deep' && hasTrait(c.p, 'smart')) o += 0.15;
  if (chip === 'dance') o += (g.s.stats.fitness + g.s.stats.looks - 100) / 300;
  if (chip === 'flirt') o += (g.s.stats.looks - 50) / 200 + c.conn / 400;
  if (c.p.rivalry >= 50) o -= 0.3;
  return Math.max(0.05, Math.min(0.95, o));
}

const OK: Record<TalkChip, string[]> = {
  smalltalk: ['“Great playlist tonight, right?” {name} agrees.', '{name} laughs. “I come here every week.”'],
  joke: ['{name} snorts into {their} drink.', 'That got a real laugh out of {name}.'],
  compliment: ['{name} smiles. “Stop it. Okay, don’t stop.”', '“That’s sweet,” {name} says, and means it.'],
  ask: ['{name} tells you about {their} job, {their} dog, {their} dream trip.', 'You learn {name} is way more interesting than expected.'],
  dance: ['You and {name} own the dance floor for one song.', '{name} has moves. So do you, apparently.'],
  drink: ['{name} raises the glass. “Cheers to strangers.”', '“You didn’t have to.” {name} looks pleased.'],
  shot: ['You both wince. Then laugh.', '“One more?” {name} grins.'],
  flirt: ['{name} holds eye contact a beat longer.', '“Smooth,” {name} says. “Annoyingly smooth.”'],
  deep: ['You end up talking about life for twenty minutes.', '{name} goes quiet, then tells you something real.'],
  leave: [''],
};
const NO: Record<TalkChip, string[]> = {
  smalltalk: ['{name} nods politely. Silence.', '“Mm-hm.” {name} checks {their} phone.'],
  joke: ['Crickets.', '{name} doesn’t get it.'],
  compliment: ['{name} looks uncomfortable.', '“…thanks.”'],
  ask: ['“I’d rather not talk about work.”', '{name} gives one-word answers.'],
  dance: ['You stepped on {name}’s foot. Twice.', '{name} drifts back to {their} friends.'],
  drink: ['“I’m good, thanks.”', '{name} hands it to a friend.'],
  shot: ['{name} passes.', 'You did the shot alone. Awkward.'],
  flirt: ['{name} laughs — not in a good way.', '“I’m flattered, but no.”'],
  deep: ['Too much, too soon. {name} changes the subject.', '“Whoa. Heavy.”'],
  leave: [''],
};

/** One turn of the conversation. Uses one of the night's actions. */
export function talk(g: Game, chip: TalkChip): string {
  const n = night(g);
  const c = current(g);
  if (!c) return '';
  const allowed = chipsFor(g, c).find((x) => x.chip === chip);
  if (!allowed || allowed.reason) return allowed?.reason ?? '';
  if (chip === 'leave') return endTalk(g);
  if (chip === 'drink') { g.money(-14); n.spent += 14; c.intox = Math.min(100, c.intox + 12); }
  if (chip === 'shot') { g.money(-12); n.spent += 12; c.intox = Math.min(100, c.intox + 18); n.intox = Math.min(100, n.intox + 18); }
  const ok = Math.random() < allowed.odds;
  const before = stageOf(c.conn);
  if (ok) {
    c.conn = Math.min(100, c.conn + GAIN[chip] + (chip === 'shot' || chip === 'drink' ? 4 : 0));
    n.confidence = Math.min(100, n.confidence + 4);
    if (chip === 'flirt' || chip === 'compliment') c.p.attraction = Math.min(100, c.p.attraction + 8);
  } else {
    c.conn = Math.max(0, c.conn - 5);
    n.confidence = Math.max(0, n.confidence - 6);
  }
  const line = say(g.pick(ok ? OK[chip] : NO[chip]), c.p, g.s.name);
  const after = stageOf(c.conn);
  const msg = `${line}${after !== before ? ` (${after})` : ''}`;
  tick(g, msg);
  return msg;
}

/** Walk away. What it leaves you with depends on how far you got. */
export function endTalk(g: Game): string {
  const n = night(g);
  const c = current(g);
  n.talking = null;
  if (!c) return '';
  c.done = true;
  if (c.vibe === 'alone' && c.conn < 20) {
    g.karma(1);
    return `You read the room and left ${c.p.name} alone. Classy.`;
  }
  if (c.conn >= 40) g.stat('mood', 4);
  return c.conn >= 20 ? `A fun chat with ${c.p.name}.` : `${c.p.name} went back to ${c.p.pronouns.poss} night.`;
}

/** Swap numbers: they become a real contact ("met at The Anchor"). */
export function swapNumbers(g: Game, where: string): string {
  const n = night(g);
  const c = current(g);
  if (!c || c.conn < 40 || (g.age < 18 && g.ageOf(c.p) >= 18)) return '';
  const p = promote(g, c, where);
  p.hasNumber = true;
  p.theyHaveNumber = true;
  tick(g, `You swapped numbers with ${p.name}.`);
  n.talking = null;
  c.done = true;
  return `You swapped numbers with ${p.name}.`;
}

/** A crowd NPC becomes a person you know. */
export function promote(g: Game, c: NightNpc, where: string) {
  if (c.known || g.s.people.includes(c.p)) return c.p;
  c.p.met = 'A night out';
  c.p.where = where;
  c.p.rel = Math.max(c.p.rel, Math.round(c.conn / 2));
  c.p.lastContact = g.s.clock;
  // how drunk they are stays visible to the consent gate
  if (c.intox >= INTOX_LIMIT && !c.p.tags.includes('intox:very')) c.p.tags.push('intox:very', `soberAt:${g.s.turn + 2}`);
  g.s.people.push(c.p);
  c.known = true;
  return c.p;
}
