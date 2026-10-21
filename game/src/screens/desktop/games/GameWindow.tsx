import { useState } from 'react';
import type { DeskProps } from '../types';
import { GAME_BY_ID, TOURNAMENT_FEE, TOURNAMENT_PRIZE, type GameId } from '../../../state/games/catalog';
import { finishRun } from '../../../state/web/sites';
import { Flappy } from './Flappy';
import { Fowl } from './Fowl';
import { Snek } from './Snek';
import { Mines } from './Mines';
import { Blocks } from './Blocks';
import { Words } from './Words';
import { Golf } from './Golf';

const VIEW = { flappy: Flappy, fowl: Fowl, snek: Snek, mines: Mines, blocks: Blocks, words: Words, golf: Golf } as const;

/** Update 0.8 — game runs (free since 0.12: computer energy is only for Hackr and START-UP). Tournaments cost an entry fee; a great run wins the pot. */
export function GameWindow({ game, notify, id, onClose }: DeskProps & { id: GameId; onClose: () => void }) {
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [tour, setTour] = useState(false);
  const def = GAME_BY_ID[id];
  const View = VIEW[id];
  const end = (raw: number) => {
    const text = finishRun(game, id, raw, tour);
    setResult(text);
    notify(text);
  };
  if (result !== null) {
    return (
      <div className="gm-end">
        <b>{result}</b>
        <div className="gm-btns">
          <button className="btn btn-sm btn-primary" onClick={() => { setResult(null); setRun((n) => n + 1); }}>Play again</button>
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  return (
    <div className="gm-wrap">
      <label className="gm-tour">
        <input type="checkbox" checked={tour} disabled={!game.canAfford(TOURNAMENT_FEE)} onChange={(e) => setTour(e.target.checked)} /> 🏆 Tournament (${TOURNAMENT_FEE} entry · win ${TOURNAMENT_PRIZE} with {def.great}+)
      </label>
      <View key={run} game={game} id={id} onEnd={end} />
    </div>
  );
}
