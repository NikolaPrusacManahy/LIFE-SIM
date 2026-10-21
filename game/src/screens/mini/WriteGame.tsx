import { useState } from 'react';
import type { Game } from '../../state/Game';
import { NOTE_MAX, TEMPLATES, compose, saveNote, writeScore, type Template, type WriteKind } from '../../state/minigames/write';
import type { MiniResult } from '../../state/minigames/types';

/** Update 0.12 — an open book: a journal page or a story, from a preset with your choices or written freely. */
export function WriteGame({ game, title, onDone }: { game: Game; title: string; onDone: (r: MiniResult) => void }) {
  const [kind, setKind] = useState<WriteKind | null>(null);
  const [tpl, setTpl] = useState<Template | null | 'free'>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const save = (t: string, ttl: string) => {
    const e = saveNote(game, kind!, ttl, t);
    if (e) onDone({ kind: 'write', score: writeScore(t), note: `📓 “${e.title}” saved to your notebook.` });
  };
  return (
    <div className="book">
      <div className="book-page left">
        <h3>✍️ {title}</h3>
        {!kind && (
          <>
            <p>What are you writing today?</p>
            <button className="book-opt" onClick={() => setKind('journal')}>📔 A journal page</button>
            <button className="book-opt" onClick={() => setKind('story')}>📖 A story</button>
          </>
        )}
        {kind && !tpl && (
          <>
            <p>{kind === 'journal' ? 'Pick a page to fill in, or write freely.' : 'Pick a story to shape, or write your own.'}</p>
            {TEMPLATES.filter((t) => t.kind === kind).map((t) => (
              <button key={t.id} className="book-opt" onClick={() => { setTpl(t); setPicks(t.slots.map(() => -1)); }}>{t.title}</button>
            ))}
            <button className="book-opt" onClick={() => setTpl('free')}>🖋️ Write it myself</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setKind(null)}>‹ Back</button>
          </>
        )}
        {tpl && tpl !== 'free' && (
          <div className="book-slots">
            {tpl.slots.map((opts, i) => (
              <div key={i} className="book-slot">
                <small>Blank {i + 1}</small>
                <div>{opts.map((o, j) => <button key={o} className={`book-chip ${picks[i] === j ? 'on' : ''}`} onClick={() => setPicks((p) => p.map((v, k) => (k === i ? j : v)))}>{o}</button>)}</div>
              </div>
            ))}
          </div>
        )}
        {tpl === 'free' && (
          <input className="book-title" placeholder="Title" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        )}
      </div>
      <div className="book-page right">
        {tpl && tpl !== 'free' && (
          <>
            <h4>{tpl.title}</h4>
            <p className="book-ink">{compose(tpl, picks.map((p) => (p < 0 ? -1 : p))).replace(/undefined|…/g, '______')}</p>
            <button className="btn btn-primary" disabled={picks.some((p) => p < 0)} onClick={() => save(compose(tpl, picks), tpl.title)}>Save to notebook</button>
          </>
        )}
        {tpl === 'free' && (
          <>
            <textarea className="book-free" maxLength={NOTE_MAX} placeholder={kind === 'journal' ? 'Dear diary…' : 'Once upon a time…'} value={text} onChange={(e) => setText(e.target.value)} />
            <small className="app-note">{text.length}/{NOTE_MAX}</small>
            <button className="btn btn-primary" disabled={!text.trim()} onClick={() => save(text, name)}>Save to notebook</button>
          </>
        )}
        {!tpl && <p className="book-ink faded">The page is waiting.</p>}
      </div>
    </div>
  );
}
