import { useState } from 'react';
import type { ActionResult, Game } from '../../state/Game';
import { COVER_ACTIONS, coverUp, finishScene, sceneClues } from '../../state/crime/evidence';
import { CRIME_BY_ID } from '../../state/crime/catalog';
import { fmt } from '../../state/systems/finance';

/** Update 0.5 — the cover-up puzzle: clue cards, limited actions. You see clues, not answers. */
export function EvidenceScreen({ game, onResult }: { game: Game; onResult: (r: ActionResult) => void }) {
  const [log, setLog] = useState<string[]>([]);
  const scene = game.s.underworld.scene;
  if (!scene) return null;
  const clues = sceneClues(scene);
  const act = (id: string) => {
    const t = coverUp(game, id);
    if (t) setLog((l) => [t, ...l]);
    onResult(game.flush('', '', ''));
  };
  const finish = () => {
    const t = finishScene(game);
    onResult(game.flush('Afterwards', '🕯️', t));
  };
  return (
    <div className="evd-backdrop">
      <div className="evd-card">
        <div className="hud-label evd-label">AFTERMATH · {CRIME_BY_ID[scene.crimeId]?.name.toUpperCase()}</div>
        <h3>What does this scene need?</h3>
        <div className="evd-timer"><div style={{ width: `${(scene.actionsLeft / (scene.actionsLeft + scene.used.length)) * 100}%` }} /></div>
        <small className="evd-left">{scene.actionsLeft} action{scene.actionsLeft === 1 ? '' : 's'} left before morning</small>
        <div className="evd-clues">
          {clues.map((c, i) => <div key={i} className="evd-clue">🔎 {c.text}</div>)}
        </div>
        <div className="evd-actions">
          {COVER_ACTIONS.map((a) => {
            const lock = a.req?.(game) ?? null;
            const used = scene.used.includes(a.id);
            return (
              <button key={a.id} className={`evd-act ${used ? 'used' : ''}`} disabled={used || !!lock || scene.actionsLeft <= 0 || (!!a.cost && !game.canAfford(a.cost))} onClick={() => act(a.id)} title={lock ?? a.risk}>
                <span>{a.icon}</span>
                <b>{a.label}</b>
                <small>{Math.round(a.odds(game) * 100)}%{a.cost ? ` · ${fmt(a.cost)}` : ''} · ⚠ {a.risk}</small>
              </button>
            );
          })}
        </div>
        {log.length > 0 && <div className="evd-log">{log.map((l, i) => <div key={i}>{l}</div>)}</div>}
        <button className="btn btn-primary evd-done" onClick={finish}>{scene.actionsLeft > 0 ? 'Walk away now' : 'It’s morning'}</button>
      </div>
    </div>
  );
}
