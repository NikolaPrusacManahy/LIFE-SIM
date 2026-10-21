import type { ActionResult, Game } from '../../../state/Game';

export interface AppProps {
  game: Game;
  /** report an instant (no-time) change so the stage can play its effects */
  done: (msg: string, title?: string, icon?: string) => void;
  /** an action that spends a time slot; the device closes */
  spend: (r: ActionResult | null) => void;
  onTitle: () => void;
  onRestart: () => void;
  /** Update 0.4 — open the People screen (optionally on someone) */
  openPeople?: (pid?: string) => void;
}

export type AppId = 'god' | 'people' | 'dating' | 'bag' | 'crime' | 'blackmarket' | 'jobs' | 'school' | 'shop' | 'homes' | 'bank' | 'stats' | 'diary' | 'trophies' | 'settings';

export interface AppMeta {
  name: string;
  icon: string;
  /** gradient for the home-screen tile */
  color: [string, string];
  /** only available on a phone (remote access) */
  phoneOnly: boolean;
}

export const APPS: Record<AppId, AppMeta> = {
  god: { name: 'Become God', icon: '⚡', color: ['#ffe58a', '#ff9d3c'], phoneOnly: false },
  people: { name: 'Messages', icon: '💬', color: ['#ff8fb1', '#ff5c8a'], phoneOnly: false },
  dating: { name: 'Spark', icon: '💘', color: ['#ff9ec4', '#ff4f8b'], phoneOnly: true },
  bag: { name: 'Bag', icon: '🎒', color: ['#c9a6ff', '#9b6bff'], phoneOnly: false },
  crime: { name: 'Crime', icon: '🗡️', color: ['#5a2a3a', '#2a0f1a'], phoneOnly: true },
  blackmarket: { name: 'Back Room', icon: '🕶️', color: ['#3a3a4a', '#16161e'], phoneOnly: true },
  jobs: { name: 'Jobs', icon: '💼', color: ['#ffc46b', '#ff9d3c'], phoneOnly: true },
  school: { name: 'School', icon: '🎓', color: ['#b9a6ff', '#8b72f5'], phoneOnly: true },
  shop: { name: 'Shop', icon: '🛍️', color: ['#ffd36b', '#ffb238'], phoneOnly: true },
  homes: { name: 'Homes', icon: '🏡', color: ['#7fdcd9', '#3cbfc4'], phoneOnly: true },
  bank: { name: 'Bank', icon: '🏦', color: ['#8fe0a6', '#3fbf74'], phoneOnly: true },
  stats: { name: 'Stats', icon: '📊', color: ['#7fd0f5', '#3aa8e6'], phoneOnly: false },
  diary: { name: 'Diary', icon: '📔', color: ['#ffa7c4', '#f070a0'], phoneOnly: false },
  trophies: { name: 'Trophies', icon: '🏆', color: ['#ffd98a', '#f5b53a'], phoneOnly: false },
  settings: { name: 'Settings', icon: '⚙️', color: ['#c9cbd8', '#9a9db3'], phoneOnly: false },
};

export const APP_ORDER: AppId[] = ['god', 'people', 'dating', 'crime', 'bag', 'jobs', 'school', 'shop', 'homes', 'bank', 'stats', 'diary', 'trophies', 'settings'];
