import type { Game } from '../Game';
import type { SiteDef, WebAction } from './types';
import { settings } from '../settings';
import { isPublic, spendAction } from '../pc/session';
import { VIEWTUBE, TWITCHY } from './media';
import { CHIRP, GAMEHUB, JOBHUNT_EXTRA, LEARNHUB, OTAKU, SPICY, WEATHER } from './social';
import { DISCORB, FRIEND_ACTIONS } from './discorb';
import { onionLock } from './nile';
import { GAME_BY_ID, rewardRun, type GameId } from '../games/catalog';

// Update 0.8 — the browser's site list and the gates. Library PCs are public: no 18+, no darknet, no downloads.

export const SITES: SiteDef[] = [
  { id: 'jobhunt', name: 'JobHunt', icon: '💼', tagline: 'Find work. Get found.', color: '#2f6fd6', view: 'jobs', actions: JOBHUNT_EXTRA },
  { id: 'viewtube', name: 'ViewTube', icon: '▶️', tagline: 'Broadcast yourself-ish.', color: '#e0363c', view: 'actions', actions: VIEWTUBE },
  { id: 'twitchy', name: 'Twitchy', icon: '🟣', tagline: 'Watch people play games.', color: '#8a4bdc', view: 'actions', actions: TWITCHY },
  { id: 'chirp', name: 'Chirp', icon: '🐤', tagline: 'Everyone is mad here.', color: '#1d9bd8', view: 'actions', actions: CHIRP, gate: (g) => (g.age < 13 ? 'Must be 13' : null) },
  { id: 'otakupit', name: 'OtakuPit', icon: '🌸', tagline: 'You haven’t seen it? Filtered.', color: '#d6478f', view: 'actions', actions: OTAKU },
  { id: 'weathernerds', name: 'WeatherNerds', icon: '🌦️', tagline: 'Clouds, but with love.', color: '#3aa8e6', view: 'weather', actions: WEATHER },
  { id: 'gamehub', name: 'GameHub Forums', icon: '🎮', tagline: 'Guides, drama, LFG.', color: '#4a4f6a', view: 'actions', actions: GAMEHUB },
  { id: 'discorb', name: 'Discorb', icon: '💬', tagline: 'Rooms full of strangers.', color: '#5865d8', view: 'discorb', actions: DISCORB, gate: (g) => (g.age < 13 ? 'Must be 13' : null) },
  { id: 'nile', name: 'Nile', icon: '📦', tagline: 'Everything, delivered. Eventually.', color: '#ff9d3c', view: 'shop', actions: [] },
  { id: 'partpicker', name: 'PartPicker', icon: '🧩', tagline: 'Will it fit? Find out.', color: '#3fbf74', view: 'partpicker', actions: [] },
  { id: 'newsnow', name: 'NewsNow', icon: '📰', tagline: 'All the news you didn’t want.', color: '#262e33', view: 'news', actions: [] },
  { id: 'sparkweb', name: 'Spark Web', icon: '💘', tagline: 'Dating, on a bigger screen.', color: '#ff4f8b', view: 'dating', actions: [], gate: (g) => (g.age < 18 ? 'Must be 18' : null) },
  { id: 'bank', name: 'Bank Online', icon: '🏦', tagline: 'Your money, logged in.', color: '#3fbf74', view: 'bank', actions: [] },
  { id: 'learnhub', name: 'LearnHub', icon: '🎓', tagline: 'Certificates that open doors.', color: '#8b72f5', view: 'actions', actions: LEARNHUB },
  {
    id: 'spicyhub', name: 'SpicyHub', icon: '🌶️', tagline: '18+ only.', color: '#2a0f1a', view: 'spicy', actions: SPICY,
    gate: (g) => (g.age < 18 ? 'Must be 18' : !settings.mature ? 'Mature Content is off' : isPublic(g) ? 'Not on a library PC' : null),
  },
  { id: 'onion', name: 'Onionmarket', icon: '🧅', tagline: '…', color: '#16161e', view: 'onion', actions: [], gate: (g) => onionLock(g) },
];
export const SITE_BY_ID: Record<string, SiteDef> = Object.fromEntries(SITES.map((s) => [s.id, s]));

/** Hidden entirely (not just locked) on a public PC or for minors — 18+ and darknet sites. */
export function siteVisible(g: Game, s: SiteDef): boolean {
  if (s.id === 'spicyhub') return g.age >= 18 && settings.mature && !isPublic(g);
  if (s.id === 'onion') return g.age >= 18 && !isPublic(g) && g.s.web.installed.includes('tor');
  return true;
}
export const siteLock = (g: Game, s: SiteDef) => (siteVisible(g, s) ? s.gate?.(g) ?? null : 'Not available');

export function actionLock(g: Game, a: WebAction): string | null {
  if (!g.s.session) return 'Not at a computer';
  if (!a.free && g.s.session.left <= 0) return 'Session over — shut down';
  return a.lock?.(g) ?? null;
}

/** Do something on a site. Uses one session action (unless free). */
export function webAct(g: Game, siteId: string, actionId: string, arg?: string): string {
  const site = SITE_BY_ID[siteId];
  const a = site?.actions.find((x) => x.id === actionId) ?? (siteId === 'discorb' ? FRIEND_ACTIONS.find((x) => x.id === actionId) : undefined);
  if (!site || !a || siteLock(g, site)) return '';
  const lock = actionLock(g, a);
  if (lock) return lock;
  const text = a.run(g, arg);
  if (!a.free) spendAction(g, text);
  return text;
}

/** A session action spent outside a site's action list (applying to a job, ordering, a game run). */
export function sessionDo(g: Game, run: () => string): string {
  if (!g.s.session || g.s.session.left <= 0) return 'Session over — shut down';
  const text = run();
  if (text) spendAction(g, text);
  return text;
}

// ---------------- Bitstore & Files (downloads)

export const downloadLock = (g: Game) => (isPublic(g) ? 'No downloads on a library PC' : null);

export function download(g: Game, id: string): string {
  const lock = downloadLock(g);
  if (lock) return lock;
  if (g.s.web.installed.includes(id)) return 'Already installed.';
  if (id === 'tor') {
    if (g.age < 18) return 'Must be 18';
    g.s.web.installed.push('tor');
    return 'Tor-ish Browser installed. The onion is… somewhere.';
  }
  const def = GAME_BY_ID[id as GameId];
  if (!def) return '';
  if (!g.canAfford(def.price)) return `Need $${def.price}`;
  g.money(-def.price);
  g.s.web.installed.push(id);
  return `${def.name} installed.`;
}

/** Library PCs have a few browser games; your own machines need downloads. */
export const BROWSER_GAMES: GameId[] = ['mines', 'golf', 'snek'];
export const canPlay = (g: Game, id: GameId) => (isPublic(g) ? BROWSER_GAMES.includes(id) : BROWSER_GAMES.includes(id) || g.s.web.installed.includes(id));

/** A finished run: uses one session action. */
export function finishRun(g: Game, id: GameId, raw: number, tournament = false): string {
  if (!canPlay(g, id)) return 'Not installed';
  if (tournament && !g.canAfford(20)) return 'Need $20 for the entry fee';
  return sessionDo(g, () => rewardRun(g, id, raw, tournament).text);
}
