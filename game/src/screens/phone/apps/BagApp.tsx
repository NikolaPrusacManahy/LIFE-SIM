import { useState } from 'react';
import { NotebookView } from './NotebookView';
import { ITEM_BY_ID, contrabandHeld } from '../../../state/inventory/items';
import type { AppProps } from './types';
import { CRIMES } from '../../../state/crime/catalog';

// Update 0.5.1 — gear says what it's for (crimes are started from places or the People screen, not the bag)
const usedFor = (id: string) => CRIMES.filter((c) => c.needs?.includes(id)).map((c) => c.name);

/** Update 0.4 — inventory. */
export function BagApp({ game }: AppProps) {
  // Update 0.12 — the notebook opens to read
  const [reading, setReading] = useState(false);
  if (reading) return <NotebookView game={game} onBack={() => setReading(false)} />;
  const entries = Object.entries(game.s.inventory).filter(([, n]) => n > 0);
  const hot = new Set(contrabandHeld(game).map((i) => i.id));
  return (
    <div className="app-stack">
      {entries.length === 0 && <p className="app-empty">Your bag is empty. Buy things in the Shop.</p>}
      <div className="bag-grid">
        {entries.map(([id, n]) => {
          const it = ITEM_BY_ID[id];
          if (!it) return null;
          return (
            <div key={id} className={`bag-item ${hot.has(id) ? 'hot' : ''}`} title={it.desc}>
              <span>{it.icon}</span>
              <b>{it.name}</b>
              <small>{n > 1 ? `×${n}` : ''}{hot.has(id) ? ' · illegal for you' : ''}</small>
              {usedFor(id).length > 0 && <small className="bag-use">For: {usedFor(id).join(', ')}</small>}
              {id === 'notebook' && <button className="btn btn-sm" onClick={() => setReading(true)}>📖 Read</button>}
            </div>
          );
        })}
      </div>
      {hot.size > 0 && <p className="app-note">⚠ Parents, school, police or roommates may search your stuff.</p>}
    </div>
  );
}
