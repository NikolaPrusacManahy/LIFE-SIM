import type { Person } from '../types';

// Update 0.8 — a night out (saved while it lasts).

// Update 0.12 — 'house': a college house party
export type Venue = 'bar' | 'club' | 'roadhouse' | 'house';
export type VenueType = 'dive' | 'pub' | 'karaoke' | 'trivia' | 'techno' | 'eighteen' | 'gay' | 'rooftop' | 'country' | 'houseparty';
export type Zone = 'bar' | 'dance' | 'booths' | 'smoking' | 'restrooms' | 'vip';
export type Vibe = 'fun' | 'friends' | 'looking' | 'alone';

export interface NightNpc {
  /** a full NPC — only joins `s.people` if you swap numbers or leave together */
  p: Person;
  vibe: Vibe;
  zone: Zone;
  /** 0–100 */
  intox: number;
  /** connection 0–100: Stranger → Chatting → Friendly → Flirty → Connected */
  conn: number;
  /** already talked and moved on */
  done: boolean;
  /** an existing contact (ex, rival) who showed up */
  known?: boolean;
}

export interface Night {
  venue: Venue;
  type: VenueType;
  /** youngest person allowed in */
  minAge: number;
  /** under the drinking age on an 18+ night: no alcohol */
  wristband: boolean;
  /** actions left before closing */
  time: number;
  intox: number;
  confidence: number;
  spent: number;
  zone: Zone;
  vip: boolean;
  crowd: NightNpc[];
  /** index into crowd you're talking to */
  talking: number | null;
  log: string[];
  /** someone you're leaving with (person id, after promotion) */
  leftWith?: string;
  /** something happening right now that needs a choice */
  incident: Incident | null;
  /** Update 0.8 — the slot it started in ('night' → it ends next morning) */
  startPhase: string;
}

export interface Incident {
  kind: 'spike' | 'drama' | 'phone';
  /** crowd index involved */
  who: number;
}

export const ZONE_LABEL: Record<Zone, string> = { bar: '🍸 Bar', dance: '💃 Dance floor', booths: '🛋️ Booths', smoking: '🚬 Smoking area', restrooms: '🚻 Restrooms', vip: '👑 VIP' };
/** Update 0.12 — the same zones, inside a house. */
export const HOUSE_ZONE_LABEL: Record<Zone, string> = { bar: '🍺 Kitchen', dance: '💃 Living room', booths: '🛋️ The couch', smoking: '🌙 Backyard', restrooms: '🚻 Bathroom', vip: '🛏️ Upstairs' };
export const zoneLabel = (venue: Venue, z: Zone) => (venue === 'house' ? HOUSE_ZONE_LABEL[z] : ZONE_LABEL[z]);
export const VIBE_LABEL: Record<Vibe, string> = { fun: 'having fun', friends: 'waiting for friends', looking: 'looking for someone', alone: 'wants to be left alone' };
export const TYPE_LABEL: Record<VenueType, string> = {
  dive: 'Dive bar', pub: 'Pub night', karaoke: 'Karaoke night', trivia: 'Trivia night', techno: 'Techno night', eighteen: '18+ night', gay: 'Pride night', rooftop: 'Rooftop party', country: 'Honky-tonk', houseparty: 'House party',
};
export const STAGES = ['Stranger', 'Chatting', 'Friendly', 'Flirty', 'Connected'] as const;
export const stageOf = (conn: number) => STAGES[Math.min(4, Math.floor(conn / 20))];

/** Above this, nobody can consent to leaving together (both people). */
export const INTOX_LIMIT = 70;
export const NIGHT_ACTIONS = 12;
