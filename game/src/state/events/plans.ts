import type { Ctx, EventDef } from './types';
import type { Game } from '../Game';
import { bump, interact } from '../npc/interactions';
import { say } from '../npc/identity';
import { PLAN_ICON, PLAN_LABEL, standUp } from '../phone/plans';
import { clearMad } from '../npc/mood';

// Update 0.8 — a plan's slot has come: go (it uses the slot) or stand them up.

const planOf = (g: Game, c: Ctx) => g.s.plans.find((p) => p.id === c.planId) ?? null;
const HANG: Record<string, string> = { movie: 'movies', food: 'food', game: 'gaming', hang: 'mall' };

function go(g: Game, c: Ctx): string {
  const plan = planOf(g, c);
  const p = g.personById(c.pid);
  if (!plan || !p) return 'The plan fell through.';
  plan.status = 'done';
  let text: string;
  if (plan.kind === 'date') text = interact(g, p.id, 'date', g.canAfford(60) ? 'restaurant' : 'park');
  else if (plan.kind === 'talk') {
    text = interact(g, p.id, 'deeptalk');
    bump(p, 'trust', 6);
    clearMad(g, p);
  } else if (plan.kind === 'party') {
    g.stat('mood', 8);
    g.stat('energy', -12);
    bump(p, 'rel', 6);
    g.burst('confetti');
    text = say(g.pick(['{name}’s place was packed. You danced on the kitchen floor.', 'Great party. {name} introduced you to everyone.', 'Music too loud, snacks too good. A perfect night with {name}.']), p, g.s.name);
  } else text = interact(g, p.id, 'hangout', HANG[plan.kind] ?? 'mall');
  if (!text) {
    bump(p, 'rel', 5);
    g.stat('mood', 5);
    text = say('A good time with {name}.', p, g.s.name);
  }
  p.lastContact = g.s.clock;
  g.takeSlot();
  return text;
}

export const PLAN_EVENTS: EventDef[] = [
  {
    id: 'plan_scene',
    title: (g, c) => { const pl = planOf(g, c); return pl ? `${PLAN_ICON[pl.kind]} ${PLAN_LABEL[pl.kind]}` : 'Plans'; },
    icon: '📅',
    who: (_g, c) => c.pid,
    text: (g, c) => say('It’s time — you made plans with {name}.', g.personById(c.pid), g.s.name),
    choices: [
      { label: 'Go', hint: 'Uses this time slot', run: (g, c) => go(g, c) },
      { label: 'Stand them up', hint: 'They’ll be hurt', run: (g, c) => { const pl = planOf(g, c); return pl ? standUp(g, pl) : 'You stayed home.'; } },
    ],
  },
];
