import type { Game } from '../Game';
import { LOCATIONS, LOC_BY_ID, type LocationDef } from '../data/locations';
import { activitiesAt } from '../activities';

/** Locations the player can browse right now. Places with no activities yet stay hidden. */
export function visibleLocations(g: Game): LocationDef[] {
  if (g.jailed) return [LOC_BY_ID.jail];
  // Update 0.5 — on the run: you can't go home, use the bank, or be where you're known
  if (g.s.underworld.pursuit && !g.s.underworld.pursuit.settled) return [LOC_BY_ID.onrun];
  return LOCATIONS.filter(
    (l) =>
      l.id !== 'jail' &&
      (!l.region || l.region === g.s.region) &&
      (!l.when || l.when(g)) &&
      activitiesAt(l.id).some((a) => g.activityStatus(a).visible),
  );
}
