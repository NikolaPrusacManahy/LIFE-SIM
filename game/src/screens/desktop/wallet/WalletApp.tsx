import { useState } from 'react';
import type { DeskProps } from '../types';
import { BTC_FEE, buyBitcons, buyLock, fmtCoins, roundCoins, sellBitcons, sellLock, walletValue } from '../../../state/systems/bitcons';
import { fmt } from '../../../state/systems/finance';

/** Update 0.12 — the Bitcons wallet: price chart, balance, buy and sell (1% fee). Trades take no computer actions. */
export function WalletApp({ game, notify }: DeskProps) {
  const w = game.s.wallet;
  const [usd, setUsd] = useState(100);
  const [coins, setCoins] = useState(0);
  const prev = w.history.length > 1 ? w.history[w.history.length - 2] : w.price;
  const change = prev ? (w.price - prev) / prev : 0;
  const bLock = buyLock(game, usd);
  const sLock = sellLock(game, coins);
  return (
    <div className="wlt-wrap">
      <div className="wlt-head">
        <span className="wlt-logo">₿</span>
        <div>
          <small>Bitcons price</small>
          <b>{fmt(w.price)}</b>
          <em className={change >= 0 ? 'up' : 'down'}>{change >= 0 ? '▲' : '▼'} {Math.abs(change * 100).toFixed(1)}% this month</em>
        </div>
        <div className="wlt-bal">
          <small>Your wallet</small>
          <b>{fmtCoins(w.coins)}</b>
          <em>≈ {fmt(walletValue(game))}</em>
        </div>
      </div>
      <Chart data={w.history} />
      <div className="wlt-trade">
        <div className="wlt-box">
          <b>Buy</b>
          <label>$ <input type="number" min={0} value={usd} onChange={(e) => setUsd(Math.max(0, Math.round(Number(e.target.value) || 0)))} /></label>
          <small>≈ {fmtCoins(roundCoins((usd * (1 - BTC_FEE)) / w.price))}</small>
          <button className="btn btn-sm btn-primary" disabled={!!bLock} onClick={() => notify(buyBitcons(game, usd))}>{bLock ?? `Buy · ${fmt(usd)}`}</button>
        </div>
        <div className="wlt-box">
          <b>Sell</b>
          <label>₿ <input type="number" min={0} step={0.0001} value={coins} onChange={(e) => setCoins(Math.max(0, Number(e.target.value) || 0))} /></label>
          <button className="btn btn-sm btn-ghost" onClick={() => setCoins(w.coins)}>Max</button>
          <small>≈ {fmt(coins * w.price * (1 - BTC_FEE))}</small>
          <button className="btn btn-sm btn-primary" disabled={!!sLock} onClick={() => { notify(sellBitcons(game, coins)); setCoins(0); }}>{sLock ?? 'Sell'}</button>
        </div>
      </div>
      <p className="app-note">{BTC_FEE * 100}% fee each way. The price moves every month. Mining pays in here.</p>
    </div>
  );
}

function Chart({ data }: { data: number[] }) {
  const W = 520;
  const H = 120;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const span = hi - lo || 1;
  const pts = data.map((v, i) => `${data.length > 1 ? (i / (data.length - 1)) * W : W / 2},${H - 8 - ((v - lo) / span) * (H - 16)}`).join(' ');
  const up = data[data.length - 1] >= data[0];
  return (
    <svg className="wlt-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={up ? '#3fbf74' : '#ff5d73'} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}
