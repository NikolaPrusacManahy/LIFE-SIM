import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Game } from '../../state/Game';
import type { Note } from '../../state/phone/types';
import { markShown } from '../../state/phone/notify';
import { senderTone } from '../../state/phone/texts';
import { Portrait } from '../../components/Portrait';
import { NOTIFY_RATE, sfx } from '../../ui/audio';

/** Update 0.8 — slides in at the top when the queue flushes. Click opens the chat. */
export function NotificationBanner({ game, note, onOpen, onDone }: { game: Game; note: Note; onOpen: (pid: string) => void; onDone: () => void }) {
  const el = useRef<HTMLButtonElement>(null);
  const p = note.pid ? game.personById(note.pid) : null;
  useEffect(() => {
    markShown(game, note.id);
    sfx('notify', p ? NOTIFY_RATE[senderTone(p)] : 1);
    const tl = gsap.timeline({ onComplete: onDone });
    tl.fromTo(el.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }).to(el.current, { y: -80, opacity: 0, duration: 0.3, delay: 3.4 });
    return () => {
      tl.kill();
    };
  }, [game, note.id, p, onDone]);
  return (
    <button
      ref={el}
      className="ntf-banner"
      onClick={() => {
        onDone();
        if (note.pid) onOpen(note.pid);
      }}
    >
      {p ? <Portrait look={p.look} age={game.ageOf(p)} size={38} seed={p.id} mood={p.mood} /> : <span className="ntf-icon">{note.icon}</span>}
      <span className="ntf-body">
        <b>{p?.name ?? 'Phone'}</b>
        <small>{note.text.replace(`${p?.name}: `, '')}</small>
      </span>
    </button>
  );
}
