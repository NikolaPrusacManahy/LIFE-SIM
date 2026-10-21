import { useState } from 'react';
import { LANGS, LANG_ORDER, blanksOf, buildOutput, codeScore, isRight, projectsFor, type Lang, type Project } from '../../state/minigames/code';
import type { MiniResult } from '../../state/minigames/types';

/** Update 0.12 — pick a language, follow the guide, fill in the code, build. */
export function CodeGame({ title, onDone }: { title: string; onDone: (r: MiniResult) => void }) {
  const [lang, setLang] = useState<Lang | null>(null);
  const [proj, setProj] = useState<Project | null>(null);
  if (!lang) {
    return (
      <div className="mng-pick">
        <h3>{title}</h3>
        <p>Which language do you want to work in?</p>
        <div className="mng-langs">
          {LANG_ORDER.map((l) => (
            <button key={l} className={`mng-lang ide-${l}`} onClick={() => setLang(l)}>
              <span>{LANGS[l].icon}</span><b>{LANGS[l].name}</b><small>{LANGS[l].ide}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (!proj) {
    return (
      <div className="mng-pick">
        <h3>{LANGS[lang].icon} {LANGS[lang].name} — what are you building?</h3>
        <div className="mng-projects">
          {projectsFor(lang).map((p) => (
            <button key={p.id} className={`mng-proj ide-${lang}`} onClick={() => setProj(p)}><b>{p.name}</b><small>{p.goal}</small></button>
          ))}
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => setLang(null)}>‹ Other language</button>
      </div>
    );
  }
  return <Editor lang={lang} proj={proj} onDone={onDone} />;
}

function Editor({ lang, proj, onDone }: { lang: Lang; proj: Project; onDone: (r: MiniResult) => void }) {
  const blanks = blanksOf(proj);
  const [typed, setTyped] = useState<string[]>(blanks.map(() => ''));
  const [built, setBuilt] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const step = typed.findIndex((t, i) => !isRight(blanks[i].answer, t));
  let b = -1;
  return (
    <div className={`ide ide-${lang}`}>
      <div className="ide-bar">
        <span className="ide-dots"><i /><i /><i /></span>
        <b>{LANGS[lang].ide}</b>
        <span className="ide-tab">{LANGS[lang].file}</span>
        <button className="ide-build" onClick={() => setBuilt(buildOutput(proj, typed))}>▶ Build</button>
      </div>
      <div className="ide-body">
        <div className="ide-guide">
          <b>📋 {proj.name}</b>
          <p>{proj.goal}</p>
          <ol>
            {blanks.map((x, i) => (
              <li key={i} className={isRight(x.answer, typed[i]) ? 'done' : i === step ? 'now' : ''}>{x.hint}{i === step && <code> → {x.answer}</code>}</li>
            ))}
          </ol>
        </div>
        <pre className="ide-code">
          {proj.lines.map((l, n) => {
            const i = l.blank ? ++b : -1;
            return (
              <div key={n} className="ide-line">
                <span className="ide-ln">{n + 1}</span>
                <span>{l.before}</span>
                {l.blank && (
                  <input
                    className={`ide-blank ${isRight(l.blank.answer, typed[i]) ? 'ok' : ''}`}
                    style={{ width: `${Math.max(3, l.blank.answer.length + 1)}ch` }}
                    value={typed[i]}
                    spellCheck={false}
                    autoFocus={i === 0}
                    onChange={(e) => setTyped((t) => t.map((v, j) => (j === i ? e.target.value : v)))}
                  />
                )}
                {l.after && <span>{l.after}</span>}
              </div>
            );
          })}
        </pre>
      </div>
      {built && (
        <div className={`ide-out ${built.ok ? 'ok' : 'bad'}`}>
          {built.lines.map((x, i) => <div key={i}>{x}</div>)}
          <button className="btn btn-sm btn-primary" onClick={() => onDone({ kind: 'code', score: codeScore(proj, typed), lang, project: proj.id, note: built.ok ? `${proj.name} built and ran!` : 'The build failed.' })}>
            {built.ok ? 'Ship it ✔' : 'Call it a day'}
          </button>
        </div>
      )}
    </div>
  );
}
