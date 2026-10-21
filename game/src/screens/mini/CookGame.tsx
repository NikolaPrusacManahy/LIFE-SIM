import { useEffect, useRef, useState } from 'react';
import { FOODS, FOOD_ORDER, act, cookScore, donenessOf, freshPan, heat, type CookStep, type FoodId, type PanState } from '../../state/minigames/cook';
import type { MiniResult } from '../../state/minigames/types';

const STEP_LABEL: Record<CookStep, string> = { oil: '🫗 Oil', mix: '🥄 Mix', flip: '🍳 Flip', season: '🧂 Season' };

/** Update 0.12 — a pan on the stove: oil it, cook it, mix or flip, season, and plate it at the right moment. */
export function CookGame({ title, onDone }: { title: string; onDone: (r: MiniResult) => void }) {
  const [food, setFood] = useState<FoodId | null>(null);
  const [pan, setPan] = useState<PanState>(freshPan());
  const [on, setOn] = useState(false);
  const [plated, setPlated] = useState(false);
  const [toss, setToss] = useState(0);
  const tick = useRef(0);

  // the heat only runs while the food is on the pan
  useEffect(() => {
    if (!food || !on || plated) return;
    const f = FOODS[food];
    tick.current = performance.now();
    const t = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - tick.current) / 1000;
      tick.current = now;
      setPan((p) => heat(f, p, dt));
    }, 100);
    return () => window.clearInterval(t);
  }, [food, on, plated]);

  if (!food) {
    return (
      <div className="mng-pick">
        <h3>{title}</h3>
        <p>What are you cooking?</p>
        <div className="mng-foods">
          {FOOD_ORDER.map((id) => (
            <button key={id} className="mng-food" onClick={() => setFood(id)}><span>{FOODS[id].icon}</span><b>{FOODS[id].name}</b><small>{FOODS[id].needs.join(' · ')}</small></button>
          ))}
        </div>
      </div>
    );
  }
  const f = FOODS[food];
  const do_ = (s: CookStep) => {
    setPan((p) => act(f, p, s));
    if (s === 'flip' || s === 'mix') setToss((x) => x + 1);
  };
  const top = f.sides === 1 ? pan.sides[0] : pan.sides[pan.down === 0 ? 1 : 0];
  const bottom = f.sides === 1 ? pan.sides[0] : pan.sides[pan.down];
  const browned = (v: number) => `hsl(${Math.max(8, 42 - v * 0.3)}, ${Math.max(20, 75 - v * 0.4)}%, ${Math.max(14, 78 - v * 0.55)}%)`;
  const result = plated ? cookScore(f, pan) : null;
  return (
    <div className="mng-cook">
      <h3>{f.icon} {f.name}</h3>
      <div className={`cook-stove ${on && !plated ? 'hot' : ''}`}>
        <div className="cook-pan">
          <div className={`cook-oil ${pan.oiled ? 'on' : ''}`} />
          {on && <div key={toss} className="cook-food" style={{ background: browned(top), boxShadow: `inset 0 -6px 0 ${browned(bottom)}` }}>{f.icon}</div>}
          {on && !plated && <div className="cook-steam">〰️</div>}
        </div>
        <div className="cook-handle" />
      </div>
      <div className="cook-meter">
        {(f.sides === 1 ? [0] : [0, 1]).map((i) => (
          <div key={i} className="cook-side">
            <small>{f.sides === 1 ? 'Doneness' : `Side ${i + 1}${pan.down === i ? ' (down)' : ''}`} · {donenessOf(f, pan.sides[i])}</small>
            <i><em style={{ width: `${Math.min(100, (pan.sides[i] / 120) * 100)}%` }} /><span className="cook-win" style={{ left: `${(f.target[0] / 120) * 100}%`, width: `${((f.target[1] - f.target[0]) / 120) * 100}%` }} /></i>
          </div>
        ))}
      </div>
      {!plated ? (
        <div className="cook-actions">
          {!on && <button className="btn btn-primary" onClick={() => setOn(true)}>{f.icon} Into the pan</button>}
          {(['oil', 'mix', 'flip', 'season'] as CookStep[]).filter((s) => s !== 'mix' || f.sides === 1).filter((s) => s !== 'flip' || f.sides === 2).map((s) => (
            <button key={s} className="btn btn-sm" onClick={() => do_(s)}>{STEP_LABEL[s]}{s === 'season' && pan.seasoned ? ` ×${pan.seasoned}` : ''}</button>
          ))}
          {on && <button className="btn btn-sm btn-primary" onClick={() => setPlated(true)}>🍽️ Plate it</button>}
        </div>
      ) : (
        <div className="cook-result">
          <b>{result!.score >= 0.85 ? 'Chef’s kiss! 👨‍🍳' : result!.score >= 0.55 ? 'Pretty good!' : 'Edible. Mostly.'}</b>
          {result!.notes.length > 0 && <small>{result!.notes.join(' · ')}</small>}
          <button className="btn btn-primary" onClick={() => onDone({ kind: 'cook', score: result!.score, food, note: result!.score >= 0.85 ? `Perfect ${f.name.toLowerCase()}.` : result!.score >= 0.55 ? `Decent ${f.name.toLowerCase()}.` : `${f.name}… a learning experience.` })}>Eat</button>
        </div>
      )}
      <p className="app-note">Oil first, then the food. Keep it in the green window{f.sides === 2 ? ' on both sides — flip it!' : ' — keep mixing!'} Season once or twice.</p>
    </div>
  );
}
