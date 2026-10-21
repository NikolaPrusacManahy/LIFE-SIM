// Update 0.10 — a date as a scene: raise the spark with actions; moments unlock as it rises (saved while it lasts).

export type DateVenue = 'restaurant' | 'movie' | 'gala' | 'concert' | 'park' | 'arcade' | 'beach' | 'picnic' | 'minigolf' | 'home';
export type Moment = 'hands' | 'kiss' | 'french' | 'yours' | 'restroom';

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
}

export const DATE_ACTIONS = 8;
/** Spark needed for each moment. */
export const MOMENT_AT: Record<Moment, number> = { hands: 25, kiss: 45, french: 60, yours: 70, restroom: 80 };
/** At your place, "back to your place" becomes the bedroom. */
export const HOME_YOURS_LABEL = '🛏️ To the bedroom';
export const MOMENT_LABEL: Record<Moment, string> = {
  hands: '🤝 Hold hands', kiss: '💋 Kiss', french: '😘 French kiss', yours: '🌙 Back to your place?', restroom: '🚻 Sneak off to the restroom',
};
/** The restroom only happens if they really love you. */
export const RESTROOM_LOVE = 60;
