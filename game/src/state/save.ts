import type { GameState } from './types';
import { MONTHS } from './types';
import { blankState, SAVE_VERSION } from './newGame';
import { fitHairStyle, migrateNpc } from './npc/generator';
import { pronounsFor } from './npc/identity';


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
  // Update 0.7 — NPC hairstyles match their body (idempotent; the player's own look is untouched)
  for (const p of s.people) if (p.look) fitHairStyle(p.look, p.id);
  // Update 0.8 — older chat messages get their kind (from the inbox) so they offer contextual replies
  for (const list of Object.values(s.chats ?? {})) {
    for (const m of list) {
      if (m.kind || !m.branch?.length) continue;
      const t = s.inbox.find((x) => x.id === m.branch![0]);
      if (!t) continue;
      m.kind = t.kind;
      m.answered = t.replied;
      m.free = true;
    }
  }
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

// Update 0.9 — five save slots, autosaved as before. The old single save becomes slot 1 on first load.
export const SLOT_COUNT = 5;
const LEGACY_KEY = 'lifesim.save';
export const slotKey = (slot: number) => `lifesim.save.${slot}`;

/** Storage is injectable so tests can run without a browser. */
let store: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null;
export function setStorage(s: typeof store) {
  store = s;
}

function migrateLegacy() {
  try {
    const old = store?.getItem(LEGACY_KEY);
    if (old && !store?.getItem(slotKey(0))) store?.setItem(slotKey(0), old);
    if (old) store?.removeItem(LEGACY_KEY);
  } catch {
    /* storage blocked */
  }
}

export function saveGame(s: GameState, slot: number) {
  try {
    store?.setItem(slotKey(slot), JSON.stringify(s));
  } catch {
    /* storage full or blocked — the game keeps running */
  }
}

export function loadGame(slot: number): GameState | null {
  migrateLegacy();
  try {
    const txt = store?.getItem(slotKey(slot));
    return txt ? hydrate(JSON.parse(txt)) : null;
  } catch {
    return null;
  }
}

export function clearSave(slot: number) {
  try {
    store?.removeItem(slotKey(slot));
  } catch {
    /* ignore */
  }
}

export interface SlotInfo {
  slot: number;
  state: GameState | null;
  age: number;
  date: string;
}

/** What's in each slot (for the Continue / New Life pickers). */
export function listSlots(): SlotInfo[] {
  return Array.from({ length: SLOT_COUNT }, (_, slot) => {
    const st = loadGame(slot);
    const age = st ? Math.floor((st.clock - st.bornAt) / 12) : 0;
    const date = st ? `${MONTHS[st.clock % 12]} ${st.startYear + Math.floor(st.clock / 12)}` : '';
    return { slot, state: st, age, date };
  });
}

export const anySave = () => listSlots().some((x) => x.state);
