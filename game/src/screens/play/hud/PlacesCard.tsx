import type { Game } from '../../../state/Game';
import { visibleLocations } from '../../../state/systems/world';
import { currentObligations } from '../../../state/systems/obligations';
import { PLAN_ICON, PLAN_LABEL, slotLabel, upcomingPlans } from '../../../state/phone/plans';

const TILE: Record<string, string> = {
  home: 'pink', school: 'violet', campus: 'violet', work: 'amber', downtown: 'teal', mainstreet: 'teal', park: 'green', gym: 'green',
  library: 'violet', hospital: 'red', club: 'pink', bar: 'amber', roadhouse: 'amber', farm: 'green', woods: 'green', lake: 'teal',
  church: 'sky', station: 'sky',
};

/** Right-hand list of places, like rooms in a house. */
export function PlacesCard({ game, tab, setTab }: { game: Game; tab: string; setTab: (id: string) => void }) {
  const locs = visibleLocations(game);
  const obs = currentObligations(game);
  const plans = upcomingPlans(game);
  return (
    <section className="hud-card plc-card">
      {/* Update 0.8 — upcoming plans */}
      {plans.length > 0 && (
        <div className="pln-strip">
          {plans.slice(0, 2).map((pl) => (
            <span key={pl.id} className="pln-item" title={`${PLAN_LABEL[pl.kind]} with ${game.personById(pl.pid)?.name}`}>
              {PLAN_ICON[pl.kind]} <b>{game.personById(pl.pid)?.name}</b> <small>{slotLabel(game, pl.turn)}</small>
            </span>
          ))}
        </div>
      )}
      <div className="hud-label">{game.s.region === 'city' ? 'THE CITY' : 'THE COUNTRYSIDE'}</div>
      <div className="plc-list">
        {locs.map((l) => {
          const duty = obs.find((o) => o.loc === l.id);
          return (
            <button key={l.id} className={`plc-row ${l.id === tab ? 'on' : ''}`} onClick={() => setTab(l.id)}>
              <span className={`ico ico-${TILE[l.id] ?? 'sky'}`}>{l.icon}</span>
              <span className="plc-name">{l.name(game)}</span>
              {duty && <span className="plc-duty" title={duty.label}>{duty.kind === 'school' ? 'class' : 'shift'}</span>}
              {!duty && game.s.location === l.id && <span className="plc-here" title="You are here">●</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
