import { useEffect, useReducer } from 'react';
import type { Game } from '../state/Game';

/** Re-render whenever the game notifies a change. */
export function useGame(game: Game | null) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => (game ? (game.subscribe(bump) as () => void) : undefined), [game]);
  return game;
}
