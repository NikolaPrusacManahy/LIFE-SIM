import type { Game } from '../Game';

// Update 0.8 — parody websites. Update 0.12: site actions no longer use computer energy (`free` is kept for the label).

export interface WebAction {
  id: string;
  label: string;
  icon: string;
  desc: string;
  lock?: (g: Game) => string | null;
  run: (g: Game, arg?: string) => string;
  free?: boolean;
}

export type SiteView = 'actions' | 'jobs' | 'shop' | 'partpicker' | 'onion' | 'discorb' | 'news' | 'weather' | 'dating' | 'bank' | 'spicy';

export interface SiteDef {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  /** brand colour */
  color: string;
  /** null = can open; otherwise why not */
  gate?: (g: Game) => string | null;
  view: SiteView;
  actions: WebAction[];
}
