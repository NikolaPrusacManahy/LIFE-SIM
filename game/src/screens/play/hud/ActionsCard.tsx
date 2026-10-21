import type { Game } from '../../../state/Game';
import { activitiesAt, type ActCategory, type ActivityDef } from '../../../state/activities';
import { LOC_BY_ID } from '../../../state/data/locations';
import { currentObligations } from '../../../state/systems/obligations';

const CAT_TILE: Record<ActCategory, string> = {
  rest: 'sky', study: 'violet', work: 'amber', social: 'pink', fitness: 'green', fun: 'yellow', money: 'amber',
  travel: 'teal', romance: 'pink', health: 'red', faith: 'sky', panel: 'slate', crime: 'crime',
};

/** Update 0.3 — bottom dock: what's due now, the latest story line, and action cards in a horizontal grid. */
export function ActionsCard({ game, tab, onAct, onGo, onStory }: { game: Game; tab: string; onAct: (d: ActivityDef) => void; onGo: (loc: string) => void; onStory: () => void }) {
  const obs = currentObligations(game);
  const loc = LOC_BY_ID[tab];
  const acts = activitiesAt(tab)
    .map((a) => ({ a, st: game.activityStatus(a) }))
    .filter((x) => x.st.visible)
    .sort((x, y) => Number(y.st.ok) - Number(x.st.ok));
  const locked = !game.canAct();
  const last = game.s.log[0];
  const scene = loc ? loc.scene(game) : 'home';
  const neon = scene === 'club' || scene === 'bar' || scene === 'roadhouse' || scene === 'casino';
  return (
    <section className={`hud-card act-card ${neon ? 'act-neon' : ''}`}>
      <div className="act-head">
        <span className="hud-label">ACTIONS · {loc ? loc.name(game).toUpperCase() : ''}</span>
        {obs.map((o) => (
          <button key={o.kind} className="act-due" onClick={() => onGo(o.loc)}>
            {o.icon} <b>{o.label}</b> <span>— anything else counts as a {o.kind === 'school' ? 'skip' : 'no-show'}</span>
          </button>
        ))}
        {last && (
          <button className="act-story" onClick={onStory} title="Life story">
            <span>{last.text}</span> <i>Story ›</i>
          </button>
        )}
      </div>
      <div className="act-grid">
        {acts.map(({ a, st }) => {
          const cost = game.costOf(a);
          const energy = game.energyCost(a);
          const risk = st.ok && a.risk ? a.risk(game) : null;
          const warn = st.ok && a.preview ? a.preview(game) : [];
          const duty = obs.some((o) => o.acts.includes(a.id));
          return (
            <button key={a.id} className={`act-tile ${duty ? 'duty' : ''} ${a.cat === 'crime' ? 'act-crime' : ''}`} disabled={!st.ok || locked} onClick={() => onAct(a)} title={st.reason ?? a.desc}>
              <span className="act-tile-top">
                <span className={`ico ico-${CAT_TILE[a.cat]}`}>{a.icon}</span>
                <b>{a.name}</b>
              </span>
              <small className={st.ok ? '' : 'act-why'}>{st.ok ? a.desc : st.reason}</small>
              <span className="act-meta">
                {a.panel ? <i className="act-open">Open</i> : energy > 0 ? <i className="act-en">⚡{energy}</i> : <i className="act-rest">+⚡</i>}
                {cost > 0 && <i className="act-cost">${cost.toLocaleString()}</i>}
                {risk && <i className="act-risk">🎲{risk}</i>}
                {warn.map((w) => <i key={w} className="act-warn">⚠ {w}</i>)}
              </span>
            </button>
          );
        })}
        {!acts.length && <p className="app-empty">Nothing to do here right now.</p>}
      </div>
    </section>
  );
}
