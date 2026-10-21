import type { Game } from '../../state/Game';
import type { ActivityDef } from '../../state/activities/types';
import type { MiniResult } from '../../state/minigames/types';
import { Modal } from '../../components/Modal';
import { CodeGame } from './CodeGame';
import { CookGame } from './CookGame';
import { WriteGame } from './WriteGame';
import { GymGame } from './GymGame';

/** Update 0.12 — plays an activity's minigame, then hands the result back (the activity then runs as usual). */
export function MiniHost({ game, def, onDone, onCancel }: { game: Game; def: ActivityDef; onDone: (r: MiniResult) => void; onCancel: () => void }) {
  const title = `${def.icon} ${def.name}`;
  return (
    <Modal wide className={`mng-modal mng-${def.mini}`} onClose={onCancel}>
      {def.mini === 'code' && <CodeGame title={title} onDone={onDone} />}
      {def.mini === 'cook' && <CookGame title={title} onDone={onDone} />}
      {def.mini === 'write' && <WriteGame game={game} title={title} onDone={onDone} />}
      {def.mini === 'gym' && <GymGame title={title} onDone={onDone} />}
    </Modal>
  );
}
