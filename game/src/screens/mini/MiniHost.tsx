import { useMemo, type ComponentType } from 'react';
import type { Game } from '../../state/Game';
import type { ActivityDef } from '../../state/activities/types';
import type { MiniResult } from '../../state/minigames/types';
import { MINI_THEMES, type Engine } from '../../state/minigames/themes';
import { Modal } from '../../components/Modal';
import { CodeGame } from './CodeGame';
import { CookGame } from './CookGame';
import { WriteGame } from './WriteGame';
import { GymGame } from './GymGame';
import type { EngineProps } from './engines/common';
import { Rhythm } from './engines/Rhythm';
import { Timing } from './engines/Timing';
import { Runner } from './engines/Runner';
import { Quiz } from './engines/Quiz';
import { Duel } from './engines/Duel';
import { Sort } from './engines/Sort';
import { Cards } from './engines/Cards';
import { Aim, Calm, Draw, Fish, Plant } from './engines/Skill';
import { Drive, Stealth } from './engines/Grid';

/** Update 0.13 — every engine except the gym (which keeps its own screen). */
const ENGINES: Record<Exclude<Engine, 'gym'>, ComponentType<EngineProps>> = {
  rhythm: Rhythm, timing: Timing, runner: Runner, quiz: Quiz, duel: Duel, sort: Sort, cards: Cards,
  aim: Aim, fish: Fish, plant: Plant, draw: Draw, stealth: Stealth, drive: Drive, calm: Calm,
};

/** Update 0.12 — plays an activity's minigame, then hands the result back (the activity then runs as usual).
 *  Update 0.13 — themed activities (MINI_THEMES) play one of the 14 engines; every one can be skipped. */
export function MiniHost({ game, def, onDone, onCancel }: { game: Game; def: ActivityDef; onDone: (r: MiniResult) => void; onCancel: () => void }) {
  const title = `${def.icon} ${def.name}`;
  const theme = MINI_THEMES[def.id];
  const seed = useMemo(() => Math.floor(Math.random() * 100000), []);
  if (theme) {
    const done = (score: number, note: string) => onDone({ kind: theme.engine, score, note });
    const E = theme.engine === 'gym' ? null : ENGINES[theme.engine];
    return (
      <Modal wide className={`mng-modal mng-${theme.engine}`} onClose={onCancel}>
        <div className="eng-head">
          <h3>{title}</h3>
          <span>{theme.prompt}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => onDone({ kind: theme.engine, score: 0.5, skipped: true })}>⏩ Skip</button>
        </div>
        {E ? <E theme={theme} seed={seed} onDone={done} /> : <GymGame title={title} onDone={onDone} />}
      </Modal>
    );
  }
  return (
    <Modal wide className={`mng-modal mng-${def.mini}`} onClose={onCancel}>
      {def.mini === 'code' && <CodeGame title={title} onDone={onDone} />}
      {def.mini === 'cook' && <CookGame title={title} onDone={onDone} />}
      {def.mini === 'write' && <WriteGame game={game} title={title} onDone={onDone} />}
      {def.mini === 'gym' && <GymGame title={title} onDone={onDone} />}
    </Modal>
  );
}
