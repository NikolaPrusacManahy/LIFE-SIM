import type { GameState } from './types';
import { blankState, SAVE_VERSION } from './newGame';
import { migrateNpc } from './npc/generator';
import { pronounsFor } from './npc/identity';

export const SAVE_KEY = 'lifesim.save';

/**
 * Fill any missing fields from blankState() so new save fields never wipe old progress.
 * Nested objects are merged one level deep; arrays and primitives come from the save when present.
 */
export function hydrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const base = blankState() as unknown as Record<string, unknown>;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base };
  for (const [k, def] of Object.entries(base)) {
    const v = src[k];
    if (v === undefined) continue;
    if (def && typeof def === 'object' && !Array.isArray(def) && v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = { ...(def as object), ...(v as object) };
    } else {
      out[k] = v;
    }
  }
  const s = out as unknown as GameState;
  const oldVersion = typeof src.v === 'number' ? (src.v as number) : 1;
  if (oldVersion < 4) migrate04(s, src);
  s.v = SAVE_VERSION;
  return s;
}

/** Update 0.4 — older saves: complete every NPC, move condoms/fake IDs into the bag, ask about identity. */
function migrate04(s: GameState, src: Record<string, unknown>) {
  s.people = s.people.map((p) => migrateNpc(p as Parameters<typeof migrateNpc>[0], s.clock));
  if (!(src.look as Record<string, unknown> | undefined)?.body) s.look.body = s.gender === 'female' ? 'female' : 'male';
  if (!src.pronouns) s.pronouns = pronounsFor(s.gender);
  if (s.flags.condoms) {
    s.inventory.condoms = (s.inventory.condoms ?? 0) + s.flags.condoms;
    s.flags.condoms = 0;
  }
  if (s.assets.includes('fakeid')) {
    s.assets = s.assets.filter((a) => a !== 'fakeid');
    s.inventory.fakeid = 1;
  }
  if (!s.flags.identitySet && !s.dead) s.events.unshift({ id: 'identity_prompt', ctx: {} });
}

export function saveGame(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked — the game keeps running */
  }
}

export function loadGame(): GameState | null {
  try {
    const txt = localStorage.getItem(SAVE_KEY);
    return txt ? hydrate(JSON.parse(txt)) : null;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
