import { ACHIEVEMENTS } from '../../../state/data/achievements';
import { fmt, netWorth } from '../../../state/systems/finance';
import type { AppProps } from './types';

/** Trophies: achievements and lifetime numbers. */
export function LifeApp({ game }: AppProps) {
  const s = game.s;
  return (
    <div className="app-stack">
      <div className="app-box app-facts">
        <span>🏆 {s.achievements.length}/{ACHIEVEMENTS.length} unlocked</span>
        <span>💰 Net worth {fmt(netWorth(game))} · peak {fmt(s.netWorthPeak)}</span>
      </div>
      <div className="lif-ach">
        {ACHIEVEMENTS.map((a) => {
          const got = s.achievements.includes(a.id);
          return (
            <div key={a.id} className={`lif-badge ${got ? 'got' : ''}`} title={a.desc}>
              <span>{got ? a.icon : '🔒'}</span>
              <small>{a.name}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
