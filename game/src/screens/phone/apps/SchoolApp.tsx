import { useState } from 'react';
import { DEGREE_LABEL, PROGRAM_BY_ID } from '../../../state/data/programs';
import { availablePrograms, dropOut, enroll, fundingOptions, gpa, gradeLabel } from '../../../state/systems/education';
import { HoldButton } from '../../../components/HoldButton';
import type { AppProps } from './types';

export function SchoolApp({ game, done }: AppProps) {
  const e = game.s.education.current;
  const [open, setOpen] = useState<string | null>(null);
  const progs = availablePrograms(game);
  return (
    <div>
      {e ? (
        <div className="car-current">
          <div>
            <h3>{PROGRAM_BY_ID[e.program].icon} {PROGRAM_BY_ID[e.program].name}</h3>
            <p className="ph-sub">{gradeLabel(e)} · GPA {gpa(e.perf)} · {e.months}/{e.length} months · Warnings {e.warnings}/3</p>
            <p className="ph-sub">Funding: {e.funding}</p>
          </div>
          <HoldButton onConfirm={() => { dropOut(game); done('You dropped out.'); }}>Hold to drop out</HoldButton>
        </div>
      ) : (
        <p className="ph-sub">Not enrolled anywhere.</p>
      )}
      <div className="ph-section">Degrees</div>
      <div className="ph-pills">
        {game.s.education.degrees.length ? game.s.education.degrees.map((d) => <span key={d} className="ph-pill">🎓 {DEGREE_LABEL[d] ?? d}</span>) : <span className="ph-sub">None yet.</span>}
      </div>
      <div className="ph-section">Programs</div>
      <div className="ph-cards">
        {progs.map(({ p, st }) => (
          <div key={p.id} className={`ph-row ${st.ok ? '' : 'dim'}`}>
            <span className="ph-row-icon">{p.icon}</span>
            <span className="ph-row-main">
              <b>{p.name}</b>
              <small>{p.desc} · {p.length} mo · {p.tuition ? `$${p.tuition.toLocaleString()}/yr` : 'free'} · Smarts {p.minSmarts}+</small>
              {open === p.id && (
                <span className="sch-fund">
                  {fundingOptions(game, p).map((f) => (
                    <button key={f.id} className="btn btn-sm" disabled={!f.ok} title={f.ok ? '' : f.reason} onClick={() => { const r = enroll(game, p.id, f.id); setOpen(null); done(r.text, 'Application', p.icon); }}>
                      {f.label}
                    </button>
                  ))}
                </span>
              )}
            </span>
            {st.ok ? (
              <button className="btn btn-sm" onClick={() => setOpen(open === p.id ? null : p.id)}>Apply · {Math.round(st.chance * 100)}%</button>
            ) : (
              <span className="ph-why">{st.reason}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
