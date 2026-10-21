import { Modal } from '../../components/Modal';
import { HoldButton } from '../../components/HoldButton';
import { Portrait } from '../../components/Portrait';
import { listSlots } from '../../state/save';
import { moneyFor } from '../../ui/currency';

/**
 * Update 0.9 — five save slots. "continue" lists your saved lives; "new" picks where the new life goes
 * (an empty slot, or hold to overwrite an old one). Saving stays automatic.
 */
export function SlotPicker({ mode, onPick, onClose }: { mode: 'continue' | 'new'; onPick: (slot: number) => void; onClose: () => void }) {
  const slots = listSlots();
  return (
    <Modal onClose={onClose} className="slt-card">
      <h3 className="evt-title">{mode === 'continue' ? 'Continue a life' : 'Choose a save slot'}</h3>
      <div className="slt-list">
        {slots.map(({ slot, state, age, date }) => {
          if (!state) {
            return (
              <button key={slot} className="slt-row empty" disabled={mode === 'continue'} onClick={() => onPick(slot)}>
                <span className="slt-num">{slot + 1}</span>
                <span className="slt-mid"><b>Empty slot</b><small>{mode === 'new' ? 'Start a new life here' : '—'}</small></span>
              </button>
            );
          }
          const info = (
            <>
              <span className="slt-num">{slot + 1}</span>
              <Portrait look={state.look} age={age} size={46} seed="me" mood={state.stats.mood} />
              <span className="slt-mid">
                <b>{state.name} {state.familyName}{state.god ? ' ⚡' : ''}</b>
                <small data-cur="fixed">
                  {state.dead ? `💀 Died at ${state.dead.age}` : `Age ${age}`} · {date}
                  {state.generation > 1 ? ` · Gen ${state.generation}` : ''} · {moneyFor(state.money, state.rules)}
                </small>
              </span>
            </>
          );
          if (mode === 'continue') {
            return <button key={slot} className="slt-row" onClick={() => onPick(slot)}>{info}<span className="slt-go">▶</span></button>;
          }
          return (
            <div key={slot} className="slt-row taken">
              {info}
              <HoldButton className="btn-sm slt-over" onConfirm={() => onPick(slot)}>Hold to overwrite</HoldButton>
            </div>
          );
        })}
      </div>
      <small className="app-note">Your life saves automatically after every action.</small>
    </Modal>
  );
}
