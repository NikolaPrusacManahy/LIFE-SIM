import { CAREER_BY_ID, type CareerTrack } from '../../../state/data/careers';
import { applyJob, quitJob, visibleCareers } from '../../../state/systems/career';
import { fmt } from '../../../state/systems/finance';
import { HoldButton } from '../../../components/HoldButton';
import type { AppProps } from './types';

const TRACK_LABEL: Record<CareerTrack, string> = {
  teen: 'Part-Time', entry: 'Entry Level', trade: 'Trades', pro: 'Professional', elite: 'Elite', service: 'Service', creative: 'Creative & Fame', country: 'Countryside', special: 'Special',
};

export function CareerApp({ game, done }: AppProps) {
  const j = game.s.job;
  const c = j ? CAREER_BY_ID[j.careerId] : null;
  const list = visibleCareers(game);
  const tracks = [...new Set(list.map((x) => x.c.track))];
  return (
    <div>
      {j && c ? (
        <div className="car-current">
          <div>
            <h3>{c.icon} {c.levels[j.level].title}</h3>
            <p className="ph-sub">{c.place} · {fmt(c.levels[j.level].pay)}/mo · {c.shift.join(' + ')} shift</p>
            <p className="ph-sub">Performance {Math.round(j.perf)}/100 · {j.months} months · Warnings {j.warnings}/3</p>
            {j.level < c.levels.length - 1 && <p className="ph-sub">Next: {c.levels[j.level + 1].title} ({fmt(c.levels[j.level + 1].pay)}/mo)</p>}
          </div>
          <HoldButton onConfirm={() => { quitJob(game); done('You quit your job.'); }}>Hold to quit</HoldButton>
        </div>
      ) : (
        <p className="ph-sub">You’re unemployed. Pick something below.</p>
      )}
      {tracks.map((t) => (
        <div key={t}>
          <div className="ph-section">{TRACK_LABEL[t]}</div>
          <div className="ph-cards">
            {list.filter((x) => x.c.track === t).map(({ c: cc, st }) => (
              <div key={cc.id} className={`ph-row ${st.ok ? '' : 'dim'}`}>
                <span className="ph-row-icon">{cc.icon}</span>
                <span className="ph-row-main">
                  <b>{cc.levels[0].title}</b> <small>· {cc.place}</small>
                  <small>{fmt(cc.levels[0].pay)}/mo → {fmt(cc.levels[cc.levels.length - 1].pay)} · {cc.shift.join('+')}</small>
                </span>
                {st.ok ? (
                  <button className="btn btn-sm" onClick={() => done(applyJob(game, cc.id).text, 'Job application', cc.icon)}>Apply · {Math.round(st.chance * 100)}%</button>
                ) : (
                  <span className="ph-why">{st.reason}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
