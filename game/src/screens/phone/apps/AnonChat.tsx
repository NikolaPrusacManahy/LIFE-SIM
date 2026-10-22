import { useEffect, useRef, useState } from 'react';
import type { Game } from '../../../state/Game';
import { ANON_REPLIES, REMARK_REPLIES, anonLock, anonReply, answerRemark, type RemarkTone } from '../../../state/systems/stalker';
import { sfx } from '../../../ui/audio';

/** Update 0.12 — the unknown number. No contextual chips here: you can only try to get away, or give in. */
export function AnonChat({ game, onBack, done }: { game: Game; onBack: () => void; done: (text: string, title: string, icon: string) => void }) {
  const [note, setNote] = useState<string | null>(null);
  const [, bump] = useState(0);
  const log = useRef<HTMLDivElement>(null);
  const s = game.s.stalker;
  const n = s?.msgs.length ?? 0;
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
    if (game.s.stalker) game.s.stalker.read = true;
  }, [game, n]);
  if (!s) {
    return (
      <div className="cht-wrap anon-wrap">
        <div className="cht-head"><button className="app-back" onClick={onBack}>‹</button><b className="anon-name">👤 Unknown number</b></div>
        <p className="app-empty">This number no longer exists.</p>
      </div>
    );
  }
  const pick = (id: (typeof ANON_REPLIES)[number]['id']) => {
    const r = anonReply(game, id);
    sfx('message');
    setNote(r || null);
    done('', '', '');
    bump((x) => x + 1);
  };
  // Update 0.12 — she asked you something: react to it first
  const react = (tone: RemarkTone) => {
    setNote(answerRemark(game, tone) || null);
    sfx('message');
    done('', '', '');
    bump((x) => x + 1);
  };
  return (
    <div className="cht-wrap anon-wrap">
      <div className="cht-head">
        <button className="app-back" onClick={onBack}>‹</button>
        <b className="anon-name">👤 Unknown number</b>
        <small className="anon-sub">No profile · No name · Always online</small>
      </div>
      <div className="cht-log anon-log" ref={log}>
        {s.msgs.map((m) => (
          <div key={m.id} className={`cht-row ${m.from === 'me' ? 'me' : ''}`}>
            <div className={`cht-bub ${m.from === 'me' ? 'me' : 'anon-bub'} ${m.photo ? 'photo' : ''}`}>
              {m.photo && <span className="cht-photo anon-photo">{m.photo}</span>}
              {m.text && <span>{m.text}</span>}
            </div>
          </div>
        ))}
      </div>
      {note && <div className="app-msg" onClick={() => setNote(null)}>{note}</div>}
      {s.remark != null ? (
        <div className="anon-choices">
          {REMARK_REPLIES.map((r) => (
            <button key={r.id} className={`anon-choice ${r.id === 'cold' ? '' : 'give'}`} onClick={() => react(r.id)}>
              <b>{r.label}</b>
              <small>{r.hint}</small>
            </button>
          ))}
        </div>
      ) : (
      <div className="anon-choices">
        {ANON_REPLIES.map((r) => {
          const lock = anonLock(game, r.id);
          return (
            <button key={r.id} className={`anon-choice ${r.id === 'listen' ? 'give' : ''}`} disabled={!!lock} title={lock ?? r.hint} onClick={() => pick(r.id)}>
              <b>{r.label}</b>
              <small>{lock ?? r.hint}</small>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
}
