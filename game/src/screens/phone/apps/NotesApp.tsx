import type { AppProps } from './types';
import { upcomingPlans, PLAN_ICON, PLAN_LABEL, slotLabel } from '../../../state/phone/plans';

/** Update 0.8 — notification centre: missed texts, plan reminders, bills, news — plus your upcoming plans. */
export function NotesApp({ game, openChat }: AppProps) {
  const plans = upcomingPlans(game);
  const notes = game.s.notes.slice(0, 40);
  return (
    <div className="app-stack">
      <div className="ph-section">📅 Plans</div>
      {plans.length === 0 && <p className="app-empty">Nothing planned.</p>}
      {plans.map((pl) => {
        const p = game.personById(pl.pid);
        return (
          <div key={pl.id} className="ntc-row">
            <span>{PLAN_ICON[pl.kind]}</span>
            <span className="ntc-mid"><b>{PLAN_LABEL[pl.kind]} with {p?.name ?? '?'}</b><small>{slotLabel(game, pl.turn)}</small></span>
          </div>
        );
      })}
      <div className="ph-section">🔔 Notifications</div>
      {notes.length === 0 && <p className="app-empty">All caught up.</p>}
      {notes.map((n) => (
        <button
          key={n.id}
          className={`ntc-row ${n.read ? '' : 'unread'}`}
          onClick={() => {
            n.read = true;
            if (n.pid) openChat?.(n.pid);
          }}
        >
          <span>{n.icon}</span>
          <span className="ntc-mid"><b>{n.text}</b><small>{game.s.turn - n.turn <= 0 ? 'now' : `${game.s.turn - n.turn} slot${game.s.turn - n.turn > 1 ? 's' : ''} ago`}</small></span>
        </button>
      ))}
    </div>
  );
}
