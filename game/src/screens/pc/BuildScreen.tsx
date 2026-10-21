import { useState } from 'react';
import type { ActionResult, Game } from '../../state/Game';
import { Modal } from '../../components/Modal';
import { BUILD_ORDER, PARTS, SLOT_ICON, SLOT_LABEL, type PartSlot } from '../../state/pc/parts';
import { assemble, bagParts, canBuild, compatibility, installPart, missingParts } from '../../state/pc/build';
import { itemCount } from '../../state/inventory/items';

/** Update 0.8 — assembly mini-game: drag parts into the case in a sensible order (or click them). */
export function BuildScreen({ game, onClose, onResult }: { game: Game; onClose: () => void; onResult: (r: ActionResult, card?: boolean) => void }) {
  const parts = bagParts(game);
  const [order, setOrder] = useState<PartSlot[]>([]);
  const [paste, setPaste] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const missing = missingParts(parts);
  const issues = compatibility(parts);
  const left = BUILD_ORDER.filter((s) => !order.includes(s));
  const add = (s: PartSlot) => !order.includes(s) && setOrder((o) => [...o, s]);
  const build = () => {
    const r = game.spendTurn('Build a PC', '🔧', () => assemble(game, order, paste).steps.join(' '));
    if (r) {
      onClose();
      onResult(r);
    }
  };
  const spare = PARTS.filter((p) => itemCount(game, p.id) > 0);
  return (
    <Modal onClose={onClose} className="bld-card" wide>
      <h3 className="evt-title">🔧 Build a PC</h3>
      {game.has('pc') && spare.length > 0 && (
        <div className="bld-upgrade">
          <div className="ph-section">Install new parts (free)</div>
          {spare.map((p) => (
            <button key={p.id} className="btn btn-sm" onClick={() => { setMsg(installPart(game, p.id)); onResult(game.flush('', '', ''), false); }}>{SLOT_ICON[p.slot]} {p.name}</button>
          ))}
          {msg && <p className="app-note">{msg}</p>}
        </div>
      )}
      {canBuild(game) && (
        <>
          {issues.length > 0 && <p className="bld-warn">PartPicker would warn you: {issues.join(' · ')}</p>}
          <div className="bld-area">
            <div className="bld-tray">
              <div className="ph-section">Parts</div>
              {left.map((s) => (
                <button key={s} className="bld-part" draggable onDragStart={(e) => e.dataTransfer.setData('slot', s)} onClick={() => add(s)}>
                  {SLOT_ICON[s]} {parts[s]?.name ?? SLOT_LABEL[s]}
                </button>
              ))}
              {!paste && order.includes('cpu') && (
                <button className="bld-part paste" draggable onDragStart={(e) => e.dataTransfer.setData('slot', 'paste')} onClick={() => setPaste(true)}>🧴 Thermal paste</button>
              )}
            </div>
            <div
              className="bld-case"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const s = e.dataTransfer.getData('slot');
                if (s === 'paste') setPaste(true);
                else if (s) add(s as PartSlot);
              }}
            >
              <div className="ph-section">Inside the case</div>
              {order.length === 0 && <p className="app-empty">Drag parts here — motherboard first.</p>}
              {order.map((s, i) => <div key={s} className="bld-step">{i + 1}. {SLOT_ICON[s]} {SLOT_LABEL[s]}{s === 'cpu' && paste ? ' + 🧴' : ''}</div>)}
              {order.length > 0 && <button className="btn btn-sm btn-ghost" onClick={() => { setOrder([]); setPaste(false); }}>Start over</button>}
            </div>
          </div>
          <button className="btn btn-primary" disabled={left.length > 0 || !game.canAct()} onClick={build}>
            {left.length ? `Place ${left.length} more part${left.length > 1 ? 's' : ''}` : 'Power on (uses this time slot)'}
          </button>
          <small className="app-note">Tip: the “How to build a PC” guide on ViewTube helps every step.</small>
        </>
      )}
      {!canBuild(game) && !game.has('pc') && <p className="app-empty">Missing: {missing.map((s) => SLOT_LABEL[s]).join(', ')}. Order them on Nile.</p>}
    </Modal>
  );
}
