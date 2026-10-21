import type { Game } from '../../state/Game';
import type { AppHostProps } from '../phone/apps';
import type { GameId } from '../../state/games/catalog';

// Update 0.8 — the Doors desktop: shared window/app props.

export type DeskApp = 'browser' | 'bitstore' | 'files' | 'settings' | 'trash' | 'game' | 'startup';

export interface DeskProps {
  game: Game;
  host: AppHostProps;
  /** show a short line in the desktop's toast and refresh */
  notify: (text: string) => void;
  open: (app: DeskApp, arg?: string) => void;
}

export interface GameProps {
  game: Game;
  id: GameId;
  /** called once with the raw score when the run ends */
  onEnd: (raw: number) => void;
}

/** Doors wallpapers (Settings app). */
export const WALLPAPERS = [
  'linear-gradient(135deg, #2b1a4f, #5b3a9e 45%, #ff7aa2)',
  'linear-gradient(160deg, #0f2a3d, #1e6a8a 50%, #7fdcd9)',
  'radial-gradient(circle at 30% 30%, #ffd36b, #ff7a3d 45%, #3a1520)',
  'linear-gradient(180deg, #0b0b18, #1d1d3a 60%, #3c2a6e)',
];
