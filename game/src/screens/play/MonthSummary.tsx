import type { Game } from '../../state/Game';
import type { LogEntry } from '../../state/types';
import { Modal } from '../../components/Modal';
import { DeltaChips } from '../../components/DeltaChips';
import { fmt } from '../../state/systems/finance';

export interface MonthReport {
  label: string;
  deltas: Record<string, number>;
  entries: LogEntry[];
}

/** Update 0.3 — what changed after "Next month". */
export function MonthSummary({ game, report, onClose }: { game: Game; report: MonthReport; onClose: () => void }) {
  const money = report.deltas.money ?? 0;
  const rest = Object.fromEntries(Object.entries(report.deltas).filter(([k]) => k !== 'money'));
  const warnings = report.entries.filter((e) => e.kind === 'bad' || e.text.includes('⚠️'));
  const notable = report.entries.filter((e) => !warnings.includes(e)).slice(0, 6);
  return (
    <Modal onClose={onClose} className="mon-card">
      <div className="hud-label">MONTH SUMMARY</div>
      <h3 className="evt-title">{report.label}</h3>
      <div className={`mon-money ${money >= 0 ? 'up' : 'down'}`}>
        <small>Money</small>
        <b>{money >= 0 ? '+' : '−'}{fmt(Math.abs(money))}</b>
        <span>Balance {fmt(game.s.money)}</span>
      </div>
      <DeltaChips game={game} deltas={rest} />
      {warnings.length > 0 && (
        <div className="mon-list mon-warn">
          {warnings.map((w, i) => <div key={i}>⚠️ {w.text.replace('⚠️ ', '')}</div>)}
        </div>
      )}
      {notable.length > 0 && (
        <div className="mon-list">
          {notable.map((w, i) => <div key={i}>{w.text}</div>)}
        </div>
      )}
      <button className="btn btn-primary evt-continue" onClick={onClose} autoFocus>Continue</button>
    </Modal>
  );
}
