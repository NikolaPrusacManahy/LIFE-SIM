import { useState } from 'react';
import type { LogKind } from '../../../state/types';
import type { AppProps } from './types';
import { PersonChip } from '../../../components/PersonChip';

// Update 0.3 — Life story filters.
const FILTERS: [string, LogKind[] | null][] = [
  ['All', null],
  ['Love', ['love']],
  ['School', ['school']],
  ['Work', ['work', 'money']],
  ['Trouble', ['bad', 'crime']],
  ['Milestones', ['milestone']],
];

export function DiaryApp({ game }: AppProps) {
  const [f, setF] = useState(0);
  const kinds = FILTERS[f][1];
  const items = game.s.log.filter((l) => !kinds || kinds.includes(l.kind) || (FILTERS[f][0] === 'Trouble' && l.text.startsWith('🚨')));
  return (
    <div className="app-stack">
      <div className="app-seg dia-seg">
        {FILTERS.map(([name], i) => (
          <button key={name} className={i === f ? 'on' : ''} onClick={() => setF(i)}>{name}</button>
        ))}
      </div>
      <div className="app-feed">
        {items.length === 0 && <p className="app-empty">Nothing here yet.</p>}
        {items.map((l, i) => (
          <div key={`${l.turn}-${i}`} className={`app-feed-item log-${l.kind}`}>
            <small>{l.date}</small>
            {l.pid && game.personById(l.pid) && <PersonChip game={game} p={game.personById(l.pid)!} compact />}
            <span>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
