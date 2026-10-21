import type { Game } from '../../state/Game';
import { Portrait } from '../../components/Portrait';
import { inPursuit, recognition } from '../../state/crime/pursuit';

/** Update 0.5 — wanted poster + police net while on the run. */
export function PursuitHud({ game }: { game: Game }) {
  if (!inPursuit(game)) return null;
  const p = game.s.underworld.pursuit!;
  return (
    <>
      <div className="pur-vignette" />
      <div className="pur-poster">
        <b>WANTED</b>
        <Portrait look={game.s.look} age={game.age} size={70} seed="me" mood={10} />
        <span>{game.s.name} {game.s.familyName}</span>
        <i>{'★'.repeat(game.s.underworld.wanted)}</i>
        <small>Police net</small>
        <div className="me-track"><div style={{ width: `${p.zone}%`, background: '#ff3b4f' }} /></div>
        <small>Recognition {Math.round(recognition(game) * 100)}% · Disguise {Math.round(p.disguise)}</small>
      </div>
    </>
  );
}

/** Update 0.5 — breaking-news ticker during big cases. */
export function NewsTicker({ game }: { game: Game }) {
  const n = game.s.underworld.news;
  if (!n) return null;
  return (
    <div className="nws-ticker">
      <b>LIVE</b>
      <span><i>{n.text}</i></span>
    </div>
  );
}
