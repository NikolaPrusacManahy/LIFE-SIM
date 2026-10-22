import type { ActionResult, Game } from '../../state/Game';
import { Modal } from '../../components/Modal';
import { DeltaChips } from '../../components/DeltaChips';
import { PersonChip } from '../../components/PersonChip';

interface Props {
  game: Game;
  result: ActionResult | null;
  onChoose: (i: number) => void;
  onContinue: () => void;
}

/** Story event card: choices first, then the outcome with stat changes. */
export function EventModal({ game, result, onChoose, onContinue }: Props) {
  if (result) {
    return (
      <Modal className="evt-card">
        <div className="evt-icon">{result.icon}</div>
        <h3 className="evt-title">{result.title}</h3>
        {result.text && <p className="evt-text">{result.text}</p>}
        <DeltaChips game={game} deltas={result.deltas} />
        <button className="btn btn-primary evt-continue" onClick={onContinue} autoFocus>Continue</button>
      </Modal>
    );
  }
  const ev = game.currentEvent;
  if (!ev) return null;
  const choices = game.choicesFor(ev);
  const who = game.eventPerson(ev);
  return (
    <Modal className="evt-card" key={`${ev.id}-${game.s.turn}`}>
      <div className="evt-icon">{game.eventIcon(ev)}</div>
      <h3 className="evt-title">{game.eventTitle(ev)}</h3>
      {who && <div className="evt-who"><PersonChip game={game} p={who} /></div>}
      <p className="evt-text">{game.eventText(ev)}</p>
      <div className="evt-choices">
        {choices.map((c, i) => {
          const hint = typeof c.choice.hint === 'function' ? c.choice.hint(game, ev.ctx) : c.choice.hint;
          return (
            <button key={i} className={`evt-choice ${c.choice.tone === 'risk' ? 'evt-risk' : ''}`} disabled={!!c.disabled} onClick={() => onChoose(i)}>
              <span>{c.choice.label}</span>
              {(c.disabled || hint) && <small>{c.disabled ?? hint}</small>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
