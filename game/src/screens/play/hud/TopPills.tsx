import type { Game } from '../../../state/Game';
import { PHASES, PHASE_ICON, PHASE_LABEL } from '../../../state/types';
import { fmt } from '../../../state/systems/finance';
import { hasPhone, phoneConfiscated } from '../../../state/systems/phone';
import { badgeCount } from '../../../state/phone/notify';

const MONTH_FULL = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

interface Props {
  game: Game;
  onDevice: () => void;
  onPeople: () => void;
  onAutopilot: () => void;
  onPause: () => void;
}

/** Top-right pills: time of day, date, money, phone/journal, next month, menu. */
export function TopPills({ game, onDevice, onPeople, onAutopilot, onPause }: Props) {
  const unread = badgeCount(game);
  const s = game.s;
  const phone = hasPhone(game);
  return (
    <div className="pil-row">
      <div className="pil pil-phase">
        <span className="pil-phase-icon">{PHASE_ICON[game.phase]}</span>
        <b>{PHASE_LABEL[game.phase]}</b>
        <span className="pil-dots">
          {PHASES.map((p, i) => <i key={p} className={i === s.phase ? 'now' : i < s.phase ? 'past' : ''} />)}
        </span>
      </div>
      <div className="pil pil-date">
        <small>{MONTH_FULL[game.month]}</small>
        <b>{game.year}</b>
      </div>
      <div className="pil pil-money">
        <span className="pil-coin">$</span>
        <b>{fmt(s.money).replace('$', '')}</b>
        {s.debt > 0 && <small className="pil-debt">−{fmt(s.debt)}</small>}
      </div>
      <button className="pil pil-btn" onClick={onPeople} title="People">👥</button>
      <button className="pil pil-btn pil-badged" onClick={onDevice} title={phone ? 'Phone' : phoneConfiscated(game) ? 'Phone confiscated — journal only' : 'Journal (no phone yet)'}>
        {phone ? '📱' : '📓'}
        {phone && unread > 0 && <i className="pil-badge">{unread > 9 ? '9+' : unread}</i>}
      </button>
      <button className="pil pil-next" onClick={onAutopilot} disabled={!game.canAct()} title="Play your routine for the rest of the month">
        ⏩ Next month
      </button>
      <button className="pil pil-btn" onClick={onPause} title="Menu (Esc)">☰</button>
    </div>
  );
}
