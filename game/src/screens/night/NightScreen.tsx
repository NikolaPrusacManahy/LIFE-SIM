import { useState } from 'react';
import type { Game } from '../../state/Game';
import { STAGES, TYPE_LABEL, VIBE_LABEL, ZONE_LABEL, stageOf, INTOX_LIMIT, type Zone } from '../../state/nightlife/types';
import { DRINKS, drinkLock, endNight, orderDrink } from '../../state/nightlife/night';
import { approach, chipsFor, current, talk, CHIP_LABEL, type TalkChip } from '../../state/nightlife/talk';
import { LEAVE_LABEL, chooseLeave, leaveOptions } from '../../state/nightlife/leave';
import { INCIDENT_CHOICES, NIGHT_ACTIONS, darts, incidentText, moveTo, nightAct, resolveIncident } from '../../state/nightlife/extras';
import { LOC_BY_ID } from '../../state/data/locations';
import { GENDER_SYMBOL } from '../../state/npc/identity';
import { Portrait } from '../../components/Portrait';
import { PersonChip } from '../../components/PersonChip';
import { Darts } from './Darts';
import { fmt } from '../../state/systems/finance';

const ZONES: Zone[] = ['bar', 'dance', 'booths', 'smoking', 'restrooms', 'vip'];

/** Update 0.8 — the night-out scene. One slot, ~12 actions; the queue waits until you head home. */
export function NightScreen({ game, onEnd, onChange }: { game: Game; onEnd: (summary: string) => void; onChange: () => void }) {
  const [line, setLine] = useState<string | null>(null);
  const [showDarts, setShowDarts] = useState(false);
  const [, bump] = useState(0);
  const n = game.s.night!;
  const where = LOC_BY_ID[n.venue]?.name(game) ?? 'the bar';
  const say = (t: string) => {
    if (t) setLine(t);
    onChange();
    bump((x) => x + 1);
    // the night may have ended inside an action (kicked out, left together)
    if (!game.s.night) onEnd(t);
  };
  const c = current(game);
  const leaveOpts = c ? leaveOptions(game, c) : [];
  const out = n.time <= 0;

  return (
    <div className={`ngt-screen ngt-${n.type}`} data-sfx="none">
      <div className="ngt-lights" />
      <div className="ngt-hud">
        <b>{where} · {TYPE_LABEL[n.type]}</b>
        <span title="Actions until closing">⏰ {n.time}/12</span>
        <span className="ngt-meter" title="Intoxication">🍸 <i><em style={{ width: `${n.intox}%`, background: n.intox >= INTOX_LIMIT ? '#ff3b4f' : '#ff9d3c' }} /></i></span>
        <span className="ngt-meter" title="Confidence">💪 <i><em style={{ width: `${n.confidence}%`, background: '#3fbf74' }} /></i></span>
        <span>💵 {fmt(game.s.money)}{n.spent ? ` (−${fmt(n.spent)})` : ''}</span>
        {n.wristband && n.type === 'eighteen' && <span className="ngt-band">Wristband: no alcohol</span>}
        <button className="btn btn-sm" onClick={() => onEnd(endNight(game))}>{out ? '🌙 Last call — head home' : '🚪 Head home'}</button>
      </div>

      <div className="ngt-room">
        {ZONES.filter((z) => z !== 'vip' || n.type !== 'eighteen').map((z) => {
          const here = n.crowd.map((p, i) => ({ p, i })).filter((x) => x.p.zone === z && !x.p.done);
          const locked = z === 'vip' && !n.vip;
          return (
            <section key={z} className={`ngt-zone ${n.zone === z ? 'on' : ''} ${locked ? 'locked' : ''}`}>
              <button className="ngt-zone-head" onClick={() => say(moveTo(game, z))}>{ZONE_LABEL[z]}{locked ? ' 🔒' : ''}{n.zone === z ? ' · you' : ''}</button>
              <div className="ngt-people">
                {here.map(({ p, i }) => (
                  <button key={p.p.id} className={`ngt-npc vibe-${p.vibe}`} disabled={out || !!n.incident || locked} onClick={() => say(approach(game, i))} title={VIBE_LABEL[p.vibe]}>
                    <Portrait look={p.p.look} age={game.ageOf(p.p)} size={34} seed={p.p.id} mood={p.p.mood} />
                    <span>
                      <b>{p.p.name}{p.known ? ' ⚠' : ''}</b>
                      <small>{GENDER_SYMBOL[p.p.gender]} {game.ageOf(p.p)} · {VIBE_LABEL[p.vibe]}</small>
                    </span>
                  </button>
                ))}
                {here.length === 0 && <small className="ngt-empty">quiet</small>}
              </div>
            </section>
          );
        })}
      </div>

      {line && <div className="ngt-line">{line}</div>}

      <div className="ngt-bar">
        <div className="ngt-drinks">
          {DRINKS.map((d) => {
            const lock = drinkLock(game, d.id);
            return <button key={d.id} disabled={!!lock || out || !!n.incident} title={lock ?? ''} onClick={() => say(orderDrink(game, d.id))}>{d.icon}<small>{d.price ? `$${d.price}` : 'free'}</small></button>;
          })}
        </div>
        <div className="ngt-acts">
          {NIGHT_ACTIONS.filter((a) => !a.zone || a.zone === n.zone).map((a) => {
            const lock = a.lock?.(game);
            if (lock && /only|night|Club|Bars|No VIP|Roadhouse|trivia/i.test(lock)) return null;
            return <button key={a.id} className="ngt-act" disabled={!!lock || out || !!n.incident} title={lock ?? a.desc} onClick={() => say(nightAct(game, a.id))}>{a.icon} {a.label}</button>;
          })}
          {n.zone === 'bar' && n.venue !== 'club' && <button className="ngt-act" disabled={out || !!n.incident} onClick={() => setShowDarts(true)}>🎯 Darts</button>}
        </div>
      </div>

      {c && !n.incident && (
        <div className="ngt-talk">
          <div className="ngt-talk-head">
            <PersonChip game={game} p={c.p} />
            <small>{VIBE_LABEL[c.vibe]}{c.intox >= INTOX_LIMIT ? ' · very drunk' : c.intox >= 40 ? ' · tipsy' : ''}</small>
          </div>
          <div className="ngt-stages">
            {STAGES.map((s) => <span key={s} className={stageOf(c.conn) === s ? 'on' : ''}>{s}</span>)}
          </div>
          <div className="ngt-conn"><i style={{ width: `${c.conn}%` }} /></div>
          <div className="ngt-chips">
            {chipsFor(game, c).map(({ chip, reason, odds }) => (
              <button key={chip} className="cht-chip" disabled={!!reason || (out && chip !== 'leave')} onClick={() => say(talk(game, chip as TalkChip))}>
                <span>{CHIP_LABEL[chip]}</span>
                <small>{reason ?? (chip === 'leave' ? '' : `${Math.round(odds * 100)}%`)}</small>
              </button>
            ))}
          </div>
          {leaveOpts.length > 0 && (
            <div className="ngt-leave">
              {leaveOpts.map((o) => <button key={o} className={`btn btn-sm ${o === 'leave' ? 'btn-primary' : ''}`} onClick={() => say(chooseLeave(game, o, where))}>{LEAVE_LABEL[o]}</button>)}
            </div>
          )}
        </div>
      )}

      {n.incident && (
        <div className="ngt-incident">
          <b>{incidentText(game)}</b>
          {INCIDENT_CHOICES[n.incident.kind].map((ch) => <button key={ch.id} className="btn btn-sm" onClick={() => say(resolveIncident(game, ch.id))}>{ch.label}</button>)}
        </div>
      )}

      {showDarts && <Darts onDone={(throws) => { setShowDarts(false); say(darts(game, throws)); }} />}
    </div>
  );
}
