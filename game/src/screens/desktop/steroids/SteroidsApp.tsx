import { useState, type ReactNode } from 'react';
import type { DeskProps } from '../types';
import type { StatKey } from '../../../state/types';
import { STAT_ROWS } from '../../phone/apps/StatsApp';
import { BOOST_STATS, CAP_MAX, CAP_STATS, levelPrice, boostCost, boostLock, boostStat, capCost, capLock, raiseCap, type CapStat } from '../../../state/systems/boost';
import { fmt } from '../../../state/systems/finance';
import { HoldButton } from '../../../components/HoldButton';

/** Update 0.11 — "Stats on steroids": slide or type the level you want, pay 100 a level. Karma isn't for sale. */
export function SteroidsApp({ game, notify }: DeskProps) {
  return (
    <div className="ste-wrap">
      <p className="app-note">💉 {fmt(levelPrice(game))} per level. Slide or type the level you want. Karma can’t be bought.</p>
      <div className="ph-section">Max health & energy (up to {CAP_MAX})</div>
      {CAP_STATS.map((k) => <CapRow key={k} k={k} {...{ game, notify }} />)}
      <div className="ph-section">Stats</div>
      {STAT_ROWS.filter(([k]) => BOOST_STATS.includes(k)).map(([k, icon, color]) => <StatRow key={k} k={k} icon={icon} color={color} {...{ game, notify }} />)}
    </div>
  );
}

type RowProps = Pick<DeskProps, 'game' | 'notify'>;

function StatRow({ game, notify, k, icon, color }: RowProps & { k: StatKey; icon: string; color: string }) {
  const cur = Math.floor(game.s.stats[k]);
  const max = game.maxOf(k);
  const [want, setWant] = useState(Math.min(max, cur + 1));
  const target = Math.max(cur, Math.min(max, want));
  const lock = boostLock(game, k, target);
  return (
    <Row icon={icon} name={k} color={color} cur={cur} max={max} min={cur} want={target} raw={want} setWant={setWant}
      button={<HoldButton className="btn-sm" disabled={!!lock} onConfirm={() => { notify(boostStat(game, k, target)); setWant(Math.min(max, target + 1)); }}>{lock ?? `Boost to ${target} · ${fmt(boostCost(game, k, target))}`}</HoldButton>} />
  );
}

function CapRow({ game, notify, k }: RowProps & { k: CapStat }) {
  const cur = game.maxOf(k);
  const [want, setWant] = useState(Math.min(CAP_MAX, cur + 1));
  const target = Math.max(cur, Math.min(CAP_MAX, want));
  const lock = capLock(game, k, target);
  return (
    <Row icon={k === 'health' ? '❤️' : '⚡'} name={`max ${k}`} color={k === 'health' ? '#ff5d73' : '#3aa8e6'} cur={cur} max={CAP_MAX} min={cur} want={target} raw={want} setWant={setWant}
      button={<HoldButton className="btn-sm" disabled={!!lock} onConfirm={() => { notify(raiseCap(game, k, target)); setWant(Math.min(CAP_MAX, target + 1)); }}>{lock ?? `Raise to ${target} · ${fmt(capCost(game, k, target))}`}</HoldButton>} />
  );
}

function Row({ icon, name, color, cur, max, min, want, raw, setWant, button }: { icon: string; name: string; color: string; cur: number; max: number; min: number; want: number; raw: number; setWant: (n: number) => void; button: ReactNode }) {
  return (
    <div className="ste-row">
      <span className="ste-icon">{icon}</span>
      <b className="ste-name">{name}</b>
      <span className="ste-cur">{cur}/{max}</span>
      <input className="ste-slide" type="range" min={min} max={max} value={want} disabled={cur >= max} style={{ accentColor: color }} onChange={(e) => setWant(Number(e.target.value))} />
      <input className="ste-num" type="number" min={min} max={max} value={raw} disabled={cur >= max} onChange={(e) => setWant(Math.round(Number(e.target.value) || 0))} />
      {button}
    </div>
  );
}
