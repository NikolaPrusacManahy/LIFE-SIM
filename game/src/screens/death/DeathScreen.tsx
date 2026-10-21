import type { Game } from '../../state/Game';
import { ACHIEVEMENT_BY_ID } from '../../state/data/achievements';
import { DEGREE_LABEL } from '../../state/data/programs';
import { fmt, netWorth } from '../../state/systems/finance';
import { START_AGE } from '../../state/newGame';

interface Props {
  game: Game;
  onChild: (childId: string) => void;
  onNewLife: () => void;
}

export function DeathScreen({ game, onChild, onNewLife }: Props) {
  const s = game.s;
  const kids = game.peopleBy('child').filter((k) => game.ageOf(k) >= START_AGE);
  const degrees = s.education.degrees.map((d) => DEGREE_LABEL[d] ?? d);
  return (
    <div className="dth-screen">
      <div className="dth-card glass">
        <div className="dth-stone">🪦</div>
        <h2>{s.name} {s.familyName}</h2>
        <p className="dth-years">{s.startYear + Math.floor(s.bornAt / 12)} – {game.year} · age {s.dead?.age}</p>
        <p className="dth-cause">{s.dead?.cause}</p>
        <div className="dth-stats">
          <span>Net worth <b>{fmt(netWorth(game))}</b></span>
          <span>Peak <b>{fmt(s.netWorthPeak)}</b></span>
          <span>Karma <b>{Math.round(s.karma)}</b></span>
          <span>Children <b>{game.peopleBy('child').length}</b></span>
        </div>
        {degrees.length > 0 && <p className="dth-line">🎓 {degrees.join(' · ')}</p>}
        <div className="dth-miles">
          {s.milestones.slice(-10).map((m, i) => <div key={i}>{m}</div>)}
        </div>
        <div className="dth-ach">
          {s.achievements.map((a) => <span key={a} title={ACHIEVEMENT_BY_ID[a]?.desc}>{ACHIEVEMENT_BY_ID[a]?.icon}</span>)}
        </div>
        <div className="dth-actions">
          {kids.map((k) => (
            <button key={k.id} className="btn btn-primary" onClick={() => onChild(k.id)}>🧬 Continue as {k.name} ({game.ageOf(k)})</button>
          ))}
          <button className="btn" onClick={onNewLife}>✦ New Life</button>
        </div>
      </div>
    </div>
  );
}
