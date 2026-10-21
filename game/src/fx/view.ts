import type { Game } from '../state/Game';
import { LOC_BY_ID } from '../state/data/locations';
import type { StageView } from './stage/Stage';
import type { AvatarLook, Outfit } from './stage/avatar';
import type { WeatherKind } from './stage/weather';
import { weatherAt } from '../state/systems/weather';

const OUTFIT_BY_CAREER: Record<string, Outfit> = {
  doctor: 'coat', nurse: 'coat', scientist: 'coat', professor: 'suit',
  police: 'uniform', deputy: 'uniform', security: 'uniform', firefighter: 'uniform', fbi: 'suit',
  army: 'army', farmer: 'farm', farmhand: 'farm', fisher: 'farm',
  chef: 'chef', burger: 'chef',
  finance: 'suit', lawyer: 'suit', marketing: 'suit', founder: 'suit', software: 'casual',
};

export function outfitFor(g: Game): Outfit {
  if (g.s.housing === 'homeless') return 'ragged';
  if (g.s.job && OUTFIT_BY_CAREER[g.s.job.careerId]) return OUTFIT_BY_CAREER[g.s.job.careerId];
  if (g.s.education.current && g.age < 24) return 'student';
  return 'casual';
}

export function weatherFor(g: Game): WeatherKind {
  return weatherAt(g.year, g.month);
}

/** Update 0.4 — the person in the current event stands next to you. */
function npcLook(g: Game): AvatarLook | null {
  const ev = g.currentEvent;
  const p = ev ? g.eventPerson(ev) : null;
  if (!p || !p.alive) return null;
  const outfit: Outfit = p.role === 'teacher' || p.role === 'professor' ? 'suit' : g.ageOf(p) < 22 ? 'student' : 'casual';
  return { ...p.look, gender: p.gender, age: g.ageOf(p), mood: p.mood, outfit };
}

/** Translate game state + the browsed location into what the Pixi stage should show.
 *  Update 0.12 — `eventOpen`: the event person only stands beside you while their card is open (not behind a result card). */
export function stageViewFor(g: Game, locId: string, eventOpen = true): StageView {
  const loc = LOC_BY_ID[locId] ?? LOC_BY_ID.home;
  return {
    npc: eventOpen ? npcLook(g) : null,
    prison: g.jailed,
    ruins: g.s.region === 'city' && g.flag('ruinsUntil') > g.s.clock,
    region: g.s.region,
    scene: loc.scene(g),
    phase: g.phase,
    month: g.month,
    weather: weatherFor(g),
    look: g.s.dead
      ? null
      : {
          ...g.s.look,
          gender: g.s.gender,
          age: g.age,
          mood: g.s.stats.mood,
          outfit: outfitFor(g),
        },
  };
}
