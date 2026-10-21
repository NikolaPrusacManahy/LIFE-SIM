import type { Game } from '../../../state/Game';
import { CAREER_BY_ID } from '../../../state/data/careers';
import { HOUSING } from '../../../state/data/locations';
import { TRAIT_BY_ID } from '../../../state/data/traits';
import { gpa, gradeLabel } from '../../../state/systems/education';
import { fmt } from '../../../state/systems/finance';
import { STAT_ROWS } from '../../phone/apps/StatsApp';
import { Portrait } from '../../../components/Portrait';

/** Update 0.3 — left column: identity + every stat at a glance. */
export function StatsCard({ game }: { game: Game }) {
  const s = game.s;
  const e = s.education.current;
  const j = s.job;
  const c = j ? CAREER_BY_ID[j.careerId] : null;
  return (
    <section className="hud-card stc-card">
      <div className="me-top">
        <div className="me-avatar"><Portrait look={s.look} age={game.age} size={48} seed="me" mood={s.stats.mood} /></div>
        <div className="me-id">
          <b>{s.name} {s.familyName}{s.generation > 1 && <em> · Gen {s.generation}</em>}</b>
          <small>Age {game.age} · {HOUSING[s.housing].name}</small>
        </div>
      </div>
      {s.traits.length > 0 && (
        <div className="stc-traits">
          {s.traits.map((t) => <span key={t} title={TRAIT_BY_ID[t]?.desc}>{TRAIT_BY_ID[t]?.icon} {TRAIT_BY_ID[t]?.name}</span>)}
        </div>
      )}
      <div className="stc-bars">
        {STAT_ROWS.map(([k, icon, color]) => (
          <div key={k} className="me-bar" title={k}>
            <span>{icon}</span>
            <i className="stc-name">{k}{game.maxOf(k) > 100 && <small> /{game.maxOf(k)}</small>}</i>
            <div className="me-track"><div style={{ width: `${(s.stats[k] / game.maxOf(k)) * 100}%`, background: color }} /></div>
            <b>{Math.round(s.stats[k])}</b>
          </div>
        ))}
        <div className="me-bar" title="Karma (-100 to 100)">
          <span>☯️</span>
          <i className="stc-name">karma</i>
          <div className="me-track stc-karma"><div style={{ left: s.karma >= 0 ? '50%' : `${50 + s.karma / 2}%`, width: `${Math.abs(s.karma) / 2}%`, background: s.karma >= 0 ? '#3cbfc4' : '#ff5d6c' }} /></div>
          <b>{Math.round(s.karma)}</b>
        </div>
        {s.heat >= 1 && (
          <div className="me-bar" title="Police heat — lie low to cool off">
            <span>🚨</span>
            <i className="stc-name">heat</i>
            <div className="me-track"><div style={{ width: `${Math.min(100, s.heat)}%`, background: '#ff3b4f' }} /></div>
            <b>{Math.round(s.heat)}</b>
          </div>
        )}
        {s.fame >= 1 && (
          <div className="me-bar">
            <span>🌟</span>
            <i className="stc-name">fame</i>
            <div className="me-track"><div style={{ width: `${s.fame}%`, background: '#f5b53a' }} /></div>
            <b>{Math.round(s.fame)}</b>
          </div>
        )}
      </div>
      <div className="stc-status">
        {e && <span>🎓 {gradeLabel(e)} · GPA {gpa(e.perf)}{e.warnings ? ` · ⚠️${e.warnings}` : ''}</span>}
        {j && c && <span>{c.icon} {c.levels[j.level].title} · {fmt(c.levels[j.level].pay)}/mo{j.warnings ? ` · ⚠️${j.warnings}` : ''}</span>}
        {!e && !j && <span>🫥 No school or job</span>}
      </div>
    </section>
  );
}
