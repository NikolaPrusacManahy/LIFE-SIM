import type { ActionResult, Game } from '../../state/Game';
import { Modal } from '../../components/Modal';
import { DeltaChips } from '../../components/DeltaChips';
import { PersonChip } from '../../components/PersonChip';

/** Update 0.8 — what just happened. Must be dismissed before any queued event or text shows. */
export function ResultCard({ game, result, onDone }: { game: Game; result: ActionResult; onDone: () => void }) {
  const who = result.pid ? game.personById(result.pid) : null;
  return (
    <Modal className="evt-card res-card" onClose={onDone}>
      <div className="evt-icon">{result.icon}</div>
      <h3 className="evt-title">{result.title}{result.monthPassed && <em className="res-month">New month</em>}</h3>
      {who && <div className="evt-who"><PersonChip game={game} p={who} /></div>}
      {result.text && <p className="evt-text">{result.text}</p>}
      <DeltaChips game={game} deltas={result.deltas} />
      <button className="btn btn-primary evt-continue" onClick={onDone} autoFocus>Continue</button>
    </Modal>
  );
}
