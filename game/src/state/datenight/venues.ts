import type { Game } from '../Game';
import type { DateVenue } from './types';
import { itemCount } from '../inventory/items';
import type { HousingId } from '../types';

// Update 0.10 — where a date can happen. Every venue has its own actions on top of the shared ones.

export interface DateAction {
  id: string;
  label: string;
  icon: string;
  /** base success odds */
  odds: number;
  /** spark gained on success */
  gain: number;
  /** the stat that helps */
  stat?: 'charm' | 'looks' | 'fitness' | 'smarts' | 'creativity';
  cost?: number;
  /** alcohol (needs the legal drinking age) */
  drink?: number;
}

export interface VenueDef {
  name: string;
  icon: string;
  /** cost to go, or why you can't */
  cost: number;
  lock?: (g: Game) => string | null;
  /** has a restroom you could sneak off to */
  restroom: boolean;
  actions: DateAction[];
}

const A = (id: string, label: string, icon: string, odds: number, gain: number, extra: Partial<DateAction> = {}): DateAction => ({ id, label, icon, odds, gain, ...extra });

export const SHARED_ACTIONS: DateAction[] = [
  A('talk', 'Small talk', '💬', 0.8, 6, { stat: 'charm' }),
  A('compliment', 'Compliment them', '🌟', 0.65, 9, { stat: 'charm' }),
  A('joke', 'Make them laugh', '😂', 0.6, 10, { stat: 'creativity' }),
  A('dreams', 'Ask about their dreams', '✨', 0.7, 10, { stat: 'smarts' }),
  A('gaze', 'Hold eye contact', '👀', 0.55, 12, { stat: 'looks' }),
];

export const VENUES: Record<DateVenue, VenueDef> = {
  restaurant: { name: 'Restaurant', icon: '🍝', cost: 60, restroom: true, actions: [
    A('wine', 'Order a bottle of wine', '🍷', 0.75, 10, { cost: 30, drink: 18 }),
    A('dessert', 'Share a dessert', '🍰', 0.8, 10),
    A('footsie', 'Footsie under the table', '🦶', 0.5, 15, { stat: 'charm' }),
    A('toast', 'A toast to them', '🥂', 0.7, 9, { stat: 'charm' }),
  ] },
  movie: { name: 'Movies', icon: '🎬', cost: 25, restroom: true, lock: (g) => (itemCount(g, 'movie_tix') || g.canAfford(25) ? null : 'Need tickets or $25'), actions: [
    A('popcorn', 'Share popcorn', '🍿', 0.85, 7),
    A('whisper', 'Whisper jokes', '🤫', 0.6, 10, { stat: 'creativity' }),
    A('arm', 'Arm around their shoulder', '🫶', 0.55, 14, { stat: 'looks' }),
    A('scare', 'Cuddle at the scary part', '😱', 0.65, 12),
  ] },
  gala: { name: 'Gala', icon: '🥂', cost: 200, restroom: true, lock: (g) => (g.age < 18 ? 'Must be 18' : g.canAfford(200) ? null : 'Need $200'), actions: [
    A('slowdance', 'Slow dance', '💃', 0.6, 15, { stat: 'fitness' }),
    A('champagne', 'Champagne', '🍾', 0.8, 9, { drink: 16 }),
    A('vips', 'Introduce them to VIPs', '🎩', 0.55, 12, { stat: 'charm' }),
    A('balcony', 'Stargaze on the balcony', '🌌', 0.65, 14),
  ] },
  concert: { name: 'Concert', icon: '🎤', cost: 60, restroom: true, lock: (g) => (itemCount(g, 'concert_tix') || g.canAfford(60) ? null : 'Need tickets or $60'), actions: [
    A('singalong', 'Sing along together', '🎶', 0.75, 9),
    A('sway', 'Sway to the slow song', '🫂', 0.6, 14),
    A('front', 'Push to the front', '🙌', 0.55, 11, { stat: 'fitness' }),
    A('merch', 'Buy them merch ($30)', '👕', 0.85, 8, { cost: 30 }),
  ] },
  park: { name: 'Park walk', icon: '🌳', cost: 0, restroom: false, actions: [
    A('walk', 'Walk and talk', '🚶', 0.8, 8),
    A('ducks', 'Feed the ducks', '🦆', 0.8, 7),
    A('fountain', 'Sit by the fountain', '⛲', 0.7, 10),
    A('flower', 'Pick them a flower', '🌼', 0.65, 12),
  ] },
  arcade: { name: 'Arcade', icon: '👾', cost: 15, restroom: true, actions: [
    A('plushie', 'Win them a plushie', '🧸', 0.45, 16, { stat: 'smarts' }),
    A('booth', 'Photo booth', '📸', 0.8, 10),
    A('hockey', 'Air hockey', '🏒', 0.6, 9, { stat: 'fitness' }),
    A('dancegame', 'Dance machine', '🕺', 0.5, 12, { stat: 'fitness' }),
  ] },
  beach: { name: 'Beach', icon: '🏖️', cost: 0, restroom: false, lock: (g) => (g.isSummer ? null : 'Summer only'), actions: [
    A('swim', 'Go for a swim', '🏊', 0.7, 10, { stat: 'fitness' }),
    A('sandcastle', 'Build a sandcastle', '🏰', 0.75, 9, { stat: 'creativity' }),
    A('splash', 'Splash fight', '💦', 0.65, 11),
    A('sunset', 'Watch the sunset', '🌅', 0.75, 14),
  ] },
  picnic: { name: 'Picnic', icon: '🧺', cost: 10, restroom: false, actions: [
    A('clouds', 'Cloud watching', '☁️', 0.75, 9),
    A('strawberries', 'Feed each other strawberries', '🍓', 0.6, 13),
    A('poem', 'Read them a poem', '📜', 0.5, 14, { stat: 'creativity' }),
  ] },
  minigolf: { name: 'Mini-golf', icon: '⛳', cost: 20, restroom: true, actions: [
    A('bet', 'Make a friendly bet', '🤝', 0.65, 10, { stat: 'charm' }),
    A('trick', 'Trick shot', '🎯', 0.45, 14, { stat: 'fitness' }),
    A('letwin', 'Let them win', '🏆', 0.8, 8),
  ] },
  // Update 0.10 — a date at your place (invite them over). Your home makes it better or worse (HOME_BONUS).
  home: { name: 'Your place', icon: '🏠', cost: 0, restroom: false, lock: (g) => hostLock(g), actions: [
    A('tour', 'Give them the tour', '🗝️', 0.75, 8),
    A('cook', 'Cook together ($15)', '🍳', 0.7, 10, { stat: 'creativity', cost: 15 }),
    A('takeout', 'Order takeout ($25)', '🥡', 0.85, 7, { cost: 25 }),
    A('couch', 'Movie on the couch', '🛋️', 0.8, 10),
    A('cuddle', 'Cuddle up', '🫂', 0.6, 13),
    A('boardgame', 'Play a board game', '🎲', 0.7, 9, { stat: 'smarts' }),
    A('kitchen', 'Slow dance in the kitchen', '💃', 0.6, 14),
    A('bottle', 'Open a bottle', '🍷', 0.8, 8, { drink: 16 }),
  ] },
};

/** Update 0.10 — how much your home helps a date there (odds + chance they suggest the bedroom). */
export const HOME_BONUS: Record<HousingId, number> = {
  homeless: 0, parents: -0.08, shared: -0.06, apartment: 0.03, farmhouse: 0.04, house: 0.07, loft: 0.09, ranch: 0.1, mansion: 0.14,
};
export const hostLock = (g: Game) => (g.s.housing === 'homeless' ? 'You have no place to invite them to' : null);
export const homeBonus = (g: Game) => HOME_BONUS[g.s.housing] ?? 0;

export const VENUE_ORDER: DateVenue[] = ['restaurant', 'movie', 'park', 'arcade', 'concert', 'picnic', 'beach', 'minigolf', 'home', 'gala'];
export const venueLock = (g: Game, v: DateVenue) => VENUES[v].lock?.(g) ?? (g.canAfford(VENUES[v].cost) ? null : `Need $${VENUES[v].cost}`);
