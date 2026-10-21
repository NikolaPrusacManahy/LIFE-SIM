import type { Game } from '../Game';
import type { Person } from '../types';
import type { Plan, PlanKind, PlanSource } from './types';
import { newId } from '../Game';
import { PHASES } from '../types';
import { bump } from '../npc/interactions';
import { setMad } from '../npc/mood';
import { pushNote } from './notify';

// Update 0.8 — accepted invitations become plans; when the slot comes, the plan plays as a scene.

export const PLAN_LABEL: Record<PlanKind, string> = {
  party: 'Party', movie: 'Movie night', food: 'Food', date: 'Date', game: 'Game night', talk: 'Serious talk', hang: 'Hang out',
};
export const PLAN_ICON: Record<PlanKind, string> = { party: '🎉', movie: '🍿', food: '🍜', date: '🕯️', game: '🎮', talk: '💬', hang: '🛋️' };

/** Phase index a future turn falls on. */
export const phaseAt = (g: Game, turn: number) => (g.s.phase + (turn - g.s.turn)) % PHASES.length;

/** The next evening (or night) slot after now — "tonight" if it hasn't started yet. */
export function nextSlot(g: Game, want: 2 | 3 = 2, after = 1): number {
  for (let t = g.s.turn + after; t < g.s.turn + 12; t++) if (phaseAt(g, t) === want) return t;
  return g.s.turn + after;
}

export function slotLabel(g: Game, turn: number) {
  const d = turn - g.s.turn;
  const ph = PHASES[phaseAt(g, turn)];
  if (d <= 0) return 'now';
  const sameMonth = Math.floor((g.s.phase + d) / PHASES.length) === 0;
  return `${sameMonth ? (ph === 'evening' || ph === 'night' ? 'tonight' : `this ${ph}`) : `next month, ${ph}`}`;
}

export function createPlan(g: Game, p: Person, kind: PlanKind, source: PlanSource, turn = nextSlot(g)): Plan {
  // one plan per slot: a newer plan replaces nothing — it moves to the next free evening
  while (g.s.plans.some((x) => x.status === 'set' && x.turn === turn)) turn = nextSlot(g, 2, turn - g.s.turn + 1);
  const plan: Plan = { id: newId(), pid: p.id, kind, turn, status: 'set', source };
  g.s.plans.push(plan);
  if (g.s.plans.length > 40) g.s.plans.splice(0, g.s.plans.length - 40);
  return plan;
}

export const upcomingPlans = (g: Game) => g.s.plans.filter((x) => x.status === 'set' && x.turn >= g.s.turn).sort((a, b) => a.turn - b.turn);

/** Each slot (before random events): start today's plan, remind about the next one, drop impossible ones. */
export function plansTick(g: Game) {
  for (const plan of g.s.plans) {
    if (plan.status !== 'set') continue;
    const p = g.personById(plan.pid);
    if (!p || !p.alive || p.status !== 'alive' || g.jailed) {
      plan.status = 'cancelled';
      continue;
    }
    if (plan.turn < g.s.turn) plan.status = 'missed';
    else if (plan.turn === g.s.turn && !g.queued('plan_scene')) g.queue('plan_scene', { planId: plan.id, pid: p.id }, true);
    else if (plan.turn === g.s.turn + 1) pushNote(g, 'plan', `${PLAN_ICON[plan.kind]} ${PLAN_LABEL[plan.kind]} with ${p.name} — next slot`, p.id, '📅');
  }
}

/** You didn't show up. */
export function standUp(g: Game, plan: Plan) {
  const p = g.personById(plan.pid);
  plan.status = 'missed';
  if (!p) return 'You stayed home.';
  bump(p, 'rel', -10);
  if (['dating', 'partner', 'engaged', 'spouse'].includes(p.role)) bump(p, 'romance', -8);
  p.memory.unshift({ clock: g.s.clock, text: 'You stood them up', tone: 'bad' });
  setMad(g, p, 'stood them up');
  return `You didn’t go. ${p.name} waited.`;
}
