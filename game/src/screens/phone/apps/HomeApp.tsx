import type { HousingId } from '../../../state/types';
import { HOUSING } from '../../../state/data/locations';
import { fmt, housingStatus, moveInto } from '../../../state/systems/finance';
import { HoldButton } from '../../../components/HoldButton';
import type { AppProps } from './types';

const ORDER: HousingId[] = ['parents', 'shared', 'apartment', 'loft', 'house', 'farmhouse', 'ranch', 'mansion'];

export function HomeApp({ game, done }: AppProps) {
  const cur = HOUSING[game.s.housing];
  return (
    <div>
      <div className="car-current">
        <div>
          <h3>{cur.icon} {cur.name}</h3>
          <p className="ph-sub">{cur.owned ? `Owned · upkeep ${fmt(cur.rent[game.s.region])}/mo` : cur.rent[game.s.region] ? `Rent ${fmt(cur.rent[game.s.region])}/mo` : 'No rent'}</p>
        </div>
      </div>
      <div className="ph-cards">
        {ORDER.filter((id) => id !== game.s.housing).map((id) => {
          const h = HOUSING[id];
          const st = housingStatus(game, id);
          if (st.reason === 'Countryside only' || st.reason === 'City only') return null;
          return (
            <div key={id} className={`ph-row ${st.ok ? '' : 'dim'}`}>
              <span className="ph-row-icon">{h.icon}</span>
              <span className="ph-row-main">
                <b>{h.name}</b>
                <small>{h.owned ? `Buy ${fmt(st.price)} · upkeep ${fmt(st.rent)}/mo` : id === 'parents' ? 'Free, if they’ll have you' : `Rent ${fmt(st.rent)}/mo · deposit ${fmt(st.rent * 2)}`}</small>
              </span>
              {st.ok ? (
                h.owned ? (
                  <HoldButton className="btn-sm" onConfirm={() => done(moveInto(game, id), 'Moving day', h.icon)}>Hold · Buy</HoldButton>
                ) : (
                  <button className="btn btn-sm" onClick={() => done(moveInto(game, id), 'Moving day', h.icon)}>Move in</button>
                )
              ) : (
                <span className="ph-why">{st.reason}</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="ph-note">To move between city and countryside, use the station.</p>
    </div>
  );
}
