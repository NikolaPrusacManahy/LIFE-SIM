import { useState } from 'react';
import type { Game } from '../../state/Game';
import { HOME_YOURS_LABEL, MOMENT_AT, MOMENT_LABEL, type Moment } from '../../state/datenight/types';
import { actionLock, actionsFor, answerOffer, calmNight, dateAct, doMoment, endDate, momentLock, oddsOf, partner } from '../../state/datenight/date';
import { HOUSING } from '../../state/data/locations';
import { VENUES, homeBonus } from '../../state/datenight/venues';
import { INTOX_LIMIT } from '../../state/nightlife/types';
import { PersonChip } from '../../components/PersonChip';
import { Portrait } from '../../components/Portrait';

const MOMENTS: Moment[] = ['hands', 'kiss', 'french', 'yours', 'restroom'];

/** Update 0.10 — the date scene: raise the spark; moments unlock as it rises. The queue waits until it ends. */
export function DateScreen({ game, onEnd, onChange }: { game: Game; onEnd: (summary: string) => void; onChange: () => void }) {
  const [line, setLine] = useState<string | null>(null);
  const [, bump] = useState(0);
  const d = game.s.date!;
  const p = partner(game);
  const v = VENUES[d.venue];
  const say = (t: string) => {
    if (t) setLine(t);
    onChange();
    bump((x) => x + 1);
    if (!game.s.date) onEnd(t);
  };
  if (!p) return null;
  const over = d.time <= 0;
  const atHome = d.venue === 'home';
  const bonus = homeBonus(game);
  const label = (m: Moment) => (atHome && m === 'yours' ? HOME_YOURS_LABEL : MOMENT_LABEL[m]);
  return (
    <div className={`dts-screen dts-${d.venue}`} data-sfx="none">
      <div className="dts-glow" />
      <div className="dts-hud">
        <b>{v.icon} {v.name}</b>
        <span title="Actions left">⏳ {d.time}/8</span>
        {d.intox > 0 && <span className="dts-meter" title="Drinks">🍷 <i><em style={{ width: `${d.intox}%`, background: d.intox >= INTOX_LIMIT ? '#ff3b4f' : '#ff9d3c' }} /></i></span>}
        {atHome && <span className="dts-home" title="Your home changes the odds">{HOUSING[game.s.housing].icon} {HOUSING[game.s.housing].name} {bonus >= 0 ? '+' : ''}{Math.round(bonus * 100)}%</span>}
        {atHome && <button className="btn btn-sm" onClick={() => onEnd(calmNight(game))}>🛋️ Calm night in</button>}
        <button className="btn btn-sm" onClick={() => onEnd(endDate(game))}>{over ? '🌙 Say goodnight' : '🚪 End the date'}</button>
      </div>

      <div className="dts-stage">
        <div className="dts-partner">
          <Portrait look={p.look} age={game.ageOf(p)} size={150} seed={p.id} mood={Math.min(100, 40 + d.spark)} />
          <PersonChip game={game} p={p} />
        </div>
        <div className="dts-spark">
          <span>✨ Spark</span>
          <div className="dts-bar">
            <i style={{ width: `${d.spark}%` }} />
            {MOMENTS.map((m) => <em key={m} style={{ left: `${MOMENT_AT[m]}%` }} title={label(m)} />)}
          </div>
          <small>{d.spark >= 80 ? 'Sparks flying' : d.spark >= 60 ? 'Electric' : d.spark >= 40 ? 'Going well' : d.spark >= 20 ? 'Warming up' : 'A little awkward'}</small>
        </div>
      </div>

      {line && <div className="dts-line">{line}</div>}

      {d.offer ? (
        <div className="dts-offer">
          <b>{atHome ? '“Show me the bedroom?”' : '“Want to get out of here? Your place?”'}</b>
          <button className="btn btn-primary" onClick={() => say(answerOffer(game, true))}>🌙 Yes</button>
          <button className="btn" onClick={() => say(answerOffer(game, false))}>Not tonight</button>
        </div>
      ) : (
        <>
          <div className="dts-moments">
            {MOMENTS.map((m) => {
              const lock = momentLock(game, m);
              if (lock === 'No restroom here' || lock === 'Adults only' || lock === 'Done') return null;
              return (
                <button key={m} className={`dts-moment ${lock ? '' : 'ready'}`} disabled={!!lock} title={lock ?? ''} onClick={() => say(doMoment(game, m))}>
                  {label(m)}
                  {lock && <small>{lock}</small>}
                </button>
              );
            })}
          </div>
          <div className="dts-actions">
            {actionsFor(game).map((a) => {
              const lock = actionLock(game, a);
              return (
                <button key={a.id} className="dts-act" disabled={!!lock} title={lock ?? ''} onClick={() => say(dateAct(game, a.id))}>
                  <span>{a.icon}</span>
                  <b>{a.label}</b>
                  <small>{lock ?? `${Math.round(oddsOf(game, a) * 100)}%${a.cost ? ` · $${a.cost}` : ''}`}</small>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
