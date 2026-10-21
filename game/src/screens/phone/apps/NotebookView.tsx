import { useState } from 'react';
import type { Game } from '../../../state/Game';

/** Update 0.12 — the notebook in your bag: every journal page and story you wrote. */
export function NotebookView({ game, onBack }: { game: Game; onBack: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const pages = game.s.notebook;
  const page = pages.find((p) => p.id === open);
  return (
    <div className="app-stack nbk">
      <button className="app-back" onClick={() => (page ? setOpen(null) : onBack())}>‹ {page ? 'Notebook' : 'Bag'}</button>
      {page ? (
        <div className="nbk-page">
          <small>{page.kind === 'journal' ? '📔 Journal' : '📖 Story'} · {page.date}</small>
          <h4>{page.title}</h4>
          <p>{page.text}</p>
        </div>
      ) : (
        <>
          {pages.length === 0 && <p className="app-empty">Nothing written yet.</p>}
          {pages.map((p) => (
            <button key={p.id} className="nbk-row" onClick={() => setOpen(p.id)}>
              <span>{p.kind === 'journal' ? '📔' : '📖'}</span>
              <span className="msg-mid"><b>{p.title}</b><small>{p.date} · {p.text.slice(0, 50)}{p.text.length > 50 ? '…' : ''}</small></span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
