import type { Game } from '../Game';
import type { Person } from '../types';
import { isRomanceEligible } from '../npc/identity';

// Update 0.12 — a shy person who loves you finally says it… and faints. Say yes: they spend 2 months in hospital
// (happily). Say no: they're depressed until they recover (3 months).

export const SHY_HOSPITAL = 2;
export const SHY_DEPRESSED = 3;
const COMMITTED = ['dating', 'partner', 'engaged', 'spouse'];

/** In hospital: no in-person plans with them. */
export const inHospital = (g: Game, p: Person) => g.flag(`hosp:${p.id}`) > g.s.clock;
export const isDepressed = (g: Game, p: Person) => g.flag(`blue:${p.id}`) > g.s.clock;

export const shyReady = (g: Game, p: Person) =>
  p.persona === 'shy' && p.alive && p.status === 'alive' && !COMMITTED.includes(p.role) && isRomanceEligible(g, p) && (p.attraction >= 70 || p.romance >= 50) && p.rel >= 35 && !g.flag(`confessed:${p.id}`);

export function shyMonth(g: Game) {
  // depressed people slowly come back
  for (const p of g.s.people) {
    if (g.flag(`blue:${p.id}`) && !isDepressed(g, p)) {
      g.s.flags[`blue:${p.id}`] = 0;
      p.mood = Math.max(p.mood, 55);
      g.log(`🌤️ ${p.name} seems to be doing better.`, 'love', p.id);
    } else if (isDepressed(g, p)) p.mood = Math.min(p.mood, 15);
  }
  if (g.queued('shy_confess')) return;
  const p = g.s.people.find((x) => shyReady(g, x));
  if (p && g.chance(0.3)) {
    g.setFlag(`confessed:${p.id}`);
    g.queue('shy_confess', { pid: p.id });
  }
}

export function acceptShy(g: Game, p: Person): string {
  p.role = 'dating';
  p.romance = Math.max(p.romance, 70);
  p.rel = Math.min(100, p.rel + 10);
  g.setFlag(`hosp:${p.id}`, g.s.clock + SHY_HOSPITAL);
  p.memory.unshift({ clock: g.s.clock, text: 'Confessed and fainted. You said yes.', tone: 'good' });
  g.burst('hearts');
  g.milestone(`Started dating ${p.name}`);
  return `You said yes. ${p.name} made a tiny noise and fainted. Again. The doctors are keeping ${p.name} in hospital for ${SHY_HOSPITAL} months — ${p.name} hasn’t stopped smiling.`;
}

export function refuseShy(g: Game, p: Person): string {
  g.setFlag(`blue:${p.id}`, g.s.clock + SHY_DEPRESSED);
  p.mood = 10;
  p.romance = Math.max(0, p.romance - 20);
  p.memory.unshift({ clock: g.s.clock, text: 'Confessed. You said no.', tone: 'bad' });
  g.stat('mood', -3);
  return `You let ${p.name} down gently. ${p.name} nodded, came to, and went home without a word. They’ll be sad for a while.`;
}
