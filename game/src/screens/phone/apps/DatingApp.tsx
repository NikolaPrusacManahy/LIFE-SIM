import { useState } from 'react';
import { BIO_IDEAS, SWIPES_PER_MONTH, TAG_CHANCE, nextProfile, saveSparkProfile, sparkAgeRange, swipe, swipesLeft, type SparkProfile } from '../../../state/systems/dating';
import type { AppProps } from './types';
import { Portrait } from '../../../components/Portrait';
import { PERSONA, personaShown, type Persona } from '../../../state/npc/persona';
import { attractedTo } from '../../../state/npc/identity';
import type { Gender } from '../../../state/types';

/** Update 0.3 — swipe cards. Adults only (gated in the app list and in swipe()).
 *  Update 0.13 — 30 swipes a month, and your own profile with preferences (also on Spark Web, which embeds this). */
export function DatingApp({ game, done }: AppProps) {
  const [tab, setTab] = useState<'swipe' | 'me'>(game.s.spark.made ? 'swipe' : 'me');
  return (
    <div className="app-stack">
      <div className="spk-tabs">
        <button className={tab === 'swipe' ? 'on' : ''} onClick={() => setTab('swipe')}>💘 Swipe</button>
        <button className={tab === 'me' ? 'on' : ''} onClick={() => setTab('me')}>🙂 My profile</button>
      </div>
      {tab === 'swipe' ? <Swipe game={game} done={done} onProfile={() => setTab('me')} /> : <MyProfile game={game} onSaved={() => setTab('swipe')} />}
    </div>
  );
}

function Swipe({ game, done, onProfile }: Pick<AppProps, 'game' | 'done'> & { onProfile: () => void }) {
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
    <>
      {!game.s.spark.made && <button className="spk-nudge" onClick={onProfile}>✨ Make your profile: more matches, and pick who you see</button>}
      <div className="dat-card">
        <div className="dat-face"><Portrait look={profile.look} age={profile.age} size={110} seed={profile.id} mood={75} /></div>
        <b>{profile.name}, {profile.age}</b>
        <small>{profile.gender === 'male' ? 'Man' : profile.gender === 'female' ? 'Woman' : 'Non-binary'}</small>
        {profile.persona && <span className="psn-chip">{personaShown(profile)}</span>}
        {profile.persona === 'yandere' && <span className="psn-chip psn-stun">✨ Stunning</span>}
        <p>“{profile.bio}”</p>
      </div>
      <div className="dat-buttons">
        <button className="dat-pass" disabled={left <= 0} onClick={() => act(false)}>✕</button>
        <button className="dat-like" disabled={left <= 0} onClick={() => act(true)}>♥</button>
      </div>
      <p className="app-note">{left > 0 ? `${left}/${SWIPES_PER_MONTH} swipes left this month` : 'Out of swipes — come back next month.'}</p>
      {note && <p className="app-msg">{note}</p>}
    </>
  );
}

const SHOW_LABEL: Record<Gender | 'any', string> = { any: 'Everyone', female: 'Women', male: 'Men', nonbinary: 'Non-binary' };

function MyProfile({ game, onSaved }: { game: AppProps['game']; onSaved: () => void }) {
  const [p, setP] = useState<SparkProfile>(() => ({ ...game.s.spark, bio: game.s.spark.bio || BIO_IDEAS[0], ageMin: game.s.spark.made ? game.s.spark.ageMin : Math.max(18, game.age - 6), ageMax: game.s.spark.made ? game.s.spark.ageMax : game.age + 8 }));
  const [lo, hi] = sparkAgeRange(game);
  const shows = (['any', 'female', 'male', 'nonbinary'] as const).filter((x) => x === 'any' || attractedTo(game.s.sexuality, game.s.gender, x));
  const tags = Object.keys(PERSONA) as Persona[];
  const set = (x: Partial<SparkProfile>) => setP((o) => ({ ...o, ...x }));
  return (
    <div className="spk-me">
      <div className="spk-head">
        <Portrait look={game.s.look} age={game.age} size={72} seed="me" mood={80} />
        <div><b>{game.s.name}, {game.age}</b><small>{game.s.spark.made ? 'Your Spark profile' : 'Create your Spark profile'}</small></div>
      </div>

      <label className="spk-label">Your bio</label>
      <textarea className="spk-bio" maxLength={120} value={p.bio} onChange={(e) => set({ bio: e.target.value })} placeholder="Say something about you…" />
      <div className="spk-chips">{BIO_IDEAS.map((b) => <button key={b} className={p.bio === b ? 'on' : ''} onClick={() => set({ bio: b })}>{b}</button>)}</div>

      <label className="spk-label">Show me</label>
      <div className="spk-chips">{shows.map((s) => <button key={s} className={p.show === s ? 'on' : ''} onClick={() => set({ show: s })}>{SHOW_LABEL[s]}</button>)}</div>

      <label className="spk-label">Age {p.ageMin}–{p.ageMax}</label>
      <div className="spk-ages">
        <input type="range" min={lo} max={hi} value={p.ageMin} onChange={(e) => set({ ageMin: Math.min(Number(e.target.value), p.ageMax) })} />
        <input type="range" min={lo} max={hi} value={Math.min(p.ageMax, hi)} onChange={(e) => set({ ageMax: Math.max(Number(e.target.value), p.ageMin) })} />
      </div>

      <label className="spk-label">Looking for a type? <small>({Math.round(TAG_CHANCE * 100)}% of profiles, where it fits)</small></label>
      <div className="spk-chips">
        <button className={!p.tag ? 'on' : ''} onClick={() => set({ tag: null })}>No preference</button>
        {tags.map((t) => <button key={t} className={p.tag === t ? 'on' : ''} onClick={() => set({ tag: t })}>{PERSONA[t].shown}</button>)}
      </div>

      <button className="btn btn-primary" onClick={() => { saveSparkProfile(game, p); onSaved(); }}>{game.s.spark.made ? 'Save' : 'Create profile'}</button>
    </div>
  );
}
