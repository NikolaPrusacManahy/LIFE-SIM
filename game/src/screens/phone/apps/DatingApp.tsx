import { useState } from 'react';
import { nextProfile, swipe, swipesLeft } from '../../../state/systems/dating';
import type { AppProps } from './types';
import { Portrait } from '../../../components/Portrait';

/** Update 0.3 — swipe cards. Adults only (gated in the app list and in swipe()). */
export function DatingApp({ game, done }: AppProps) {
  const [profile, setProfile] = useState(() => nextProfile(game));
  const [note, setNote] = useState<string | null>(null);
  const left = swipesLeft(game);
  const act = (like: boolean) => {
    const r = swipe(game, profile, like);
    if (r.matched) done(r.text, 'Dating app', '💘');
    setNote(r.text || null);
    setProfile(nextProfile(game));
  };
  return (
    <div className="app-stack">
      <div className="dat-card">
        <div className="dat-face"><Portrait look={profile.look} age={profile.age} size={110} seed={profile.id} mood={75} /></div>
        <b>{profile.name}, {profile.age}</b>
        <small>{profile.gender === 'male' ? 'Man' : profile.gender === 'female' ? 'Woman' : 'Non-binary'}</small>
        <p>“{profile.bio}”</p>
      </div>
      <div className="dat-buttons">
        <button className="dat-pass" disabled={left <= 0} onClick={() => act(false)}>✕</button>
        <button className="dat-like" disabled={left <= 0} onClick={() => act(true)}>♥</button>
      </div>
      <p className="app-note">{left > 0 ? `${left} swipes left this month` : 'Out of swipes — come back next month.'}</p>
      {note && <p className="app-msg">{note}</p>}
    </div>
  );
}
