import type { Game } from '../state/Game';

/** Compact "+3 Smarts  -$25" chips for an action result. */
export function DeltaChips({ game, deltas }: { game: Game; deltas: Record<string, number> }) {
  const items = Object.entries(deltas).filter(([k, v]) => (k === 'money' ? Math.abs(v) >= 1 : Math.abs(v) >= 0.5));
  if (!items.length) return null;
  return (
    <div className="dlt-row">
      {items.map(([k, v]) => (
        <span key={k} className={`dlt-chip ${v > 0 ? 'dlt-up' : 'dlt-down'} ${k === 'money' ? 'dlt-money' : ''}`}>
          {game.describeDelta(k, v)}
        </span>
      ))}
    </div>
  );
}
