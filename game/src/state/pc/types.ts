import type { PartSlot } from './parts';

// Update 0.8 — computers & the web (saved).

export type Device = 'library' | 'laptop' | 'pc';

export interface Session {
  device: Device;
  /** actions left this sitting */
  left: number;
  max: number;
  /** what happened (shown on the result card when you shut down) */
  log: string[];
}

export interface PcState {
  /** installed parts by slot (part ids) */
  parts: Partial<Record<PartSlot, string>>;
  score: number;
  /** clock month it was built (parts age) */
  built: number;
  /** forgot thermal paste → overheating */
  noPaste: boolean;
  /** messy cables → worse airflow */
  mess: boolean;
  mining: boolean;
}

export interface Order {
  id: string;
  item: string;
  price: number;
  /** turn it arrives */
  arrive: number;
  express: boolean;
  status: 'transit' | 'delivered' | 'stolen' | 'wrong' | 'damaged' | 'returned' | 'seized';
  /** bought on Onionmarket */
  dark?: boolean;
}

export interface WebState {
  channel: { subs: number; videos: number } | null;
  stream: { followers: number; lives: number } | null;
  chirp: { followers: number; posts: number; cancelledUntil: number };
  otaku: number;
  /** downloaded games and tools ('tor', 'flappy', …) */
  installed: string[];
  /** LearnHub course progress (sessions done) */
  courses: Record<string, number>;
  /** watched guides: 'pc', 'games', 'cooking', … */
  guides: string[];
  wallpaper: number;
}

export const blankPc = (): PcState => ({ parts: {}, score: 0, built: 0, noPaste: false, mess: false, mining: false });
export const blankWeb = (): WebState => ({ channel: null, stream: null, chirp: { followers: 0, posts: 0, cancelledUntil: 0 }, otaku: 0, installed: [], courses: {}, guides: [], wallpaper: 0 });
