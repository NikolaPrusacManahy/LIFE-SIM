// Update 0.10 — a date as a scene: raise the spark with actions; moments unlock as it rises (saved while it lasts).

export type DateVenue = 'restaurant' | 'movie' | 'gala' | 'concert' | 'park' | 'arcade' | 'beach' | 'picnic' | 'minigolf' | 'home' | 'gym' | 'theirs';
// Update 0.11 — 'spot': right there (the back row at the movies), the movies' version of the restroom
export type Moment = 'hands' | 'kiss' | 'french' | 'yours' | 'restroom' | 'spot';

export interface DateScene {
  pid: string;
  venue: DateVenue;
  /** actions left */
  time: number;
  /** 0–100: how well it's going */
  spark: number;
  /** shared drinks, 0–100 */
  intox: number;
  moments: Moment[];
  log: string[];
  /** they suggested going back to yours */
  offer: boolean;
  /** what they just said (speech bubble) */
  quote?: string;
  /** Update 0.11 — a friend you're making a move on (harder) */
  friend?: boolean;
}

export const DATE_ACTIONS = 8;
/** Spark needed for each moment. */
export const MOMENT_AT: Record<Moment, number> = { hands: 25, kiss: 45, french: 60, yours: 70, restroom: 80, spot: 80 };
/** Update 0.11 — with a friend every moment needs this much more spark. */
export const FRIEND_EXTRA = 10;
/** At your place, "back to your place" becomes the bedroom. */
export const HOME_YOURS_LABEL = '🛏️ To the bedroom';
/** Update 0.11 — at their place it's their bedroom. */
export const THEIRS_YOURS_LABEL = '🛏️ Stay the night';
export const MOMENT_LABEL: Record<Moment, string> = {
  hands: '🤝 Hold hands', kiss: '💋 Kiss', french: '😘 French kiss', yours: '🌙 Back to your place?', restroom: '🚻 Sneak off to the restroom',
  spot: '🎬 Right here in the back row',
};
/** The restroom only happens if they really love you. */
export const RESTROOM_LOVE = 60;
