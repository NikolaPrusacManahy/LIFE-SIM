import type { Game } from '../Game';
import type { Person } from '../types';
import { owns } from './properties';
import { addGuilt } from './guilt';
import { openCase } from './investigation';
import { fmt } from '../systems/finance';
import { knowsTrait } from '../npc/traits';

// Update 0.5 — holding a captive, and blackmail.
// HARD RULE: blackmail demands are money, favours, silence, information, a job, or dropping charges — never anything sexual.

export const captives = (g: Game) => g.s.people.filter((p) => p.status === 'captive');

export function captiveMonth(g: Game) {
  for (const p of captives(g)) {
    const months = g.s.clock - g.flag(`captiveSince:${p.id}`);
    p.mood = Math.max(0, p.mood - 8);
    p.rel = Math.max(0, p.rel - 5);
    g.s.flags[`captiveHealth:${p.id}`] = Math.max(0, (g.s.flags[`captiveHealth:${p.id}`] ?? 100) - g.rand(5, 15));
    addGuilt(g, 3);
    // missing-person case grows
    let c = g.s.underworld.cases.find((x) => x.victimId === p.id && x.crimeId === 'kidnap' && x.status === 'open');
    if (!c) c = openCase(g, 'kidnap', null, p.id, ['motive', 'digital']);
    c.progress = Math.min(100, c.progress + 4);
    // the people who love them come asking
    const asker = g.s.people.find((x) => x.alive && x.id !== p.id && (x.role === 'mother' || x.role === 'father' || x.role === 'sibling' || x.role === 'friend') && x.hasNumber);
    if (asker && g.chance(0.4)) g.queue('missing_flyer', { pid: p.id });
    // escape
    const prop = g.s.underworld.properties.find((x) => ['basement', 'warehouse', 'cabin'].includes(x.kind));
    const secure = (prop?.upgrades.includes('door') ? 0.5 : 1) * (prop?.upgrades.includes('soundproof') ? 0.7 : 1);
    if (g.chance(0.08 * secure + months * 0.005)) {
      g.queue('captive_escaped', { pid: p.id });
      continue;
    }
    if ((g.s.flags[`captiveHealth:${p.id}`] ?? 100) <= 0) g.queue('captive_crisis', { pid: p.id });
    else if (months >= 3 && !p.tags.includes('stockholm') && g.chance(0.1)) {
      p.tags.push('stockholm');
      g.queue('stockholm', { pid: p.id });
    }
  }
}

export function freeCaptive(p: Person) {
  p.status = 'alive';
  p.tags = p.tags.filter((t) => t !== 'captive' && t !== 'sedated');
}

export const canHold = (g: Game) => owns(g, 'basement') || owns(g, 'warehouse') || owns(g, 'cabin');

/** Ransom from their family. */
export function ransom(g: Game, p: Person): string {
  const rich = p.archetype === 'richkid' || p.tags.includes('secretrich') ? 3 : 1;
  const amount = g.rand(15000, 60000) * rich;
  if (g.chance(0.45)) {
    g.s.underworld.dirty += amount;
    g.heat(20);
    return `The family paid ${fmt(amount)}. The police were listening on the line.`;
  }
  g.heat(30);
  const c = g.s.underworld.cases.find((x) => x.victimId === p.id && x.status === 'open');
  if (c && !c.found.includes('digital')) c.found.push('digital');
  return 'The family went straight to the police. The call was traced.';
}

/** Release: they may go to the police (trust/fear). */
export function release(g: Game, p: Person): string {
  freeCaptive(p);
  g.karma(5);
  const c = g.s.underworld.cases.find((x) => x.victimId === p.id && x.status === 'open');
  if (g.chance(p.tags.includes('stockholm') ? 0.25 : 0.7)) {
    if (c) { c.suspect = true; c.found.push('witness'); c.progress = Math.min(100, c.progress + 40); }
    return `${p.name} walked out — and straight into a police station.`;
  }
  if (c) c.status = 'cold';
  return `${p.name} walked out and never said a word. You don’t know why.`;
}

/** Let them go somewhere far: they vanish from your life. */
export function sendAway(g: Game, p: Person): string {
  freeCaptive(p);
  p.status = 'moved';
  const c = g.s.underworld.cases.find((x) => x.victimId === p.id && x.status === 'open');
  if (c) c.status = 'cold';
  return `${p.name} is gone — another city, another name. The flyers fade.`;
}

// ---------------- blackmail
export interface Demand {
  id: string;
  label: string;
}
/** The complete list of blackmail demands. Tested to contain nothing sexual. */
export const DEMANDS: Demand[] = [
  { id: 'cash', label: 'Pay me $5,000' },
  { id: 'monthly', label: 'Pay me $500 a month' },
  { id: 'promotion', label: 'Get me a promotion' },
  { id: 'silence', label: 'Keep quiet about what you know' },
  { id: 'info', label: 'Tell me what you know' },
  { id: 'ruin', label: 'Ruin my rival' },
  { id: 'drop', label: 'Drop the charges' },
  { id: 'quit', label: 'Quit your job' },
];

/** What you hold over someone: secrets, affairs, crimes, photos. */
export function leverageOn(g: Game, p: Person): string[] {
  const out = [...(g.s.underworld.leverage[p.id] ?? [])];
  if (knowsTrait(p, 'hassecret')) out.push('Their secret');
  if (p.labels.includes('affair')) out.push('Their affair');
  if (p.status === 'jail' || p.memory.some((m) => m.text.includes('crime'))) out.push('Their criminal past');
  if (p.tags.includes('photos')) out.push('Photos');
  return [...new Set(out)];
}

export function blackmail(g: Game, p: Person, demandId: string): string {
  const d = DEMANDS.find((x) => x.id === demandId);
  if (!d || !leverageOn(g, p).length) return '';
  g.karma(-8);
  addGuilt(g, 4);
  p.rel = Math.max(0, p.rel - 40);
  p.rivalry = Math.min(100, p.rivalry + 40);
  p.tags.push('fear');
  const r = Math.random();
  if (r < 0.15) {
    openCase(g, 'scam', null, p.id, ['digital', 'motive', 'witness']).suspect = true;
    return `${p.name} went to the police with your messages.`;
  }
  if (r < 0.25) {
    g.s.underworld.leverage[`__counter:${p.id}`] = ['They have something on you too'];
    return `${p.name} smiled. "Go ahead. I still have the photos." Counter-leverage.`;
  }
  switch (demandId) {
    case 'cash':
      g.money(5000);
      return `${p.name} paid $5,000. Their hands were shaking.`;
    case 'monthly':
      g.s.underworld.blackmail.push({ pid: p.id, demand: d.label, monthly: 500, since: g.s.clock });
      return `${p.name} agreed to $500 a month.`;
    case 'promotion':
      if (g.s.job) g.s.job.perf = 100;
      return `${p.name} pulled strings. Your next review will be glowing.`;
    case 'ruin': {
      const rival = g.s.people.find((x) => x.labels.includes('rival') && x.alive);
      if (rival) { rival.status = 'moved'; return `${rival.name} lost everything and left town. ${p.name} made sure of it.`; }
      return `${p.name} has nobody to ruin for you.`;
    }
    case 'drop':
      for (const c of g.s.underworld.cases) if (c.victimId === p.id) c.status = 'closed';
      return `${p.name} withdrew their statement.`;
    default:
      return `${p.name} agreed. You own them now.`;
  }
}

export function blackmailMonth(g: Game) {
  const u = g.s.underworld;
  for (const b of [...u.blackmail]) {
    const p = g.personById(b.pid);
    if (!p || !p.alive || p.status !== 'alive') { u.blackmail = u.blackmail.filter((x) => x !== b); continue; }
    g.money(b.monthly);
    if (g.chance(0.06)) {
      u.blackmail = u.blackmail.filter((x) => x !== b);
      g.queue('blackmail_breaks', { pid: p.id });
    }
  }
}
