import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { UpdateNotes } from '../updates/UpdateNotes';

interface Props {
  hasSave: boolean;
  onContinue: () => void;
  onNew: () => void;
}

export function TitleScreen({ hasSave, onContinue, onNew }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState(false);
  useEffect(() => {
    gsap.fromTo(root.current!.querySelectorAll('.ttl-anim'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.6, ease: 'power3.out' });
  }, []);
  return (
    <div className="ttl-screen" ref={root}>
      <h1 className="ttl-logo ttl-anim">LIFE<span>//</span>SIM</h1>
      <p className="ttl-tag ttl-anim">One life. Every choice.</p>
      <div className="ttl-buttons ttl-anim">
        {hasSave && <button className="btn btn-primary btn-lg" onClick={onContinue}>▶ Continue</button>}
        <button className={`btn btn-lg ${hasSave ? '' : 'btn-primary'}`} onClick={onNew}>✦ New Life</button>
      </div>
      <p className="ttl-foot ttl-anim">
        v0.5 · <button className="ttl-notes" onClick={() => setNotes(true)}>Update 0.5 — Underworld</button>
      </p>
      {notes && <UpdateNotes onClose={() => setNotes(false)} />}
    </div>
  );
}
