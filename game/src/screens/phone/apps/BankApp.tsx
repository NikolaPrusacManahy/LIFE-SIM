import { fmt, invest, netWorth, payDebt } from '../../../state/systems/finance';
import type { AppProps } from './types';

export function BankApp({ game, done }: AppProps) {
  const s = game.s;
  const inv = game.flag('invest');
  return (
    <div>
      <div className="bnk-grid">
        <div className="bnk-stat"><small>Cash</small><b>{fmt(s.money)}</b></div>
        <div className="bnk-stat"><small>Invested</small><b>{fmt(inv)}</b></div>
        <div className="bnk-stat"><small>Debt</small><b className={s.debt ? 'neg' : ''}>{fmt(s.debt)}</b></div>
        <div className="bnk-stat"><small>Net worth</small><b>{fmt(netWorth(game))}</b></div>
      </div>
      <div className="ph-section">Index fund</div>
      <p className="ph-sub">Grows about 7% a year on average. Swings monthly.</p>
      <div className="ph-pills">
        {[500, 5000, 50000].map((a) => (
          <button key={a} className="btn btn-sm" disabled={s.money < a || game.age < 16} onClick={() => done(invest(game, a), 'Investing', '📈')}>Invest {fmt(a)}</button>
        ))}
        <button className="btn btn-sm" disabled={inv <= 0} onClick={() => done(invest(game, -inv), 'Investing', '📈')}>Withdraw all</button>
      </div>
      <div className="ph-section">Debt</div>
      <p className="ph-sub">0.7% monthly interest. Minimum payments are automatic.</p>
      <div className="ph-pills">
        {[500, 5000].map((a) => (
          <button key={a} className="btn btn-sm" disabled={!s.debt || s.money <= 0} onClick={() => done(payDebt(game, a), 'Debt payment', '💳')}>Pay {fmt(a)}</button>
        ))}
        <button className="btn btn-sm" disabled={!s.debt || s.money <= 0} onClick={() => done(payDebt(game, s.debt), 'Debt payment', '💳')}>Pay max</button>
      </div>
    </div>
  );
}
