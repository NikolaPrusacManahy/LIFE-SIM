import type { DeskProps } from './types';
import { download, downloadLock } from '../../state/web/sites';
import { PART_BY_ID, SLOT_ICON, SLOT_LABEL, type PartSlot } from '../../state/pc/parts';
import { WALLPAPERS } from './types';

/** Update 0.8 — Files: downloads, your PC's specs, and the mining toggle. */
export function Files({ game, notify }: DeskProps) {
  const lock = downloadLock(game);
  const onPc = game.s.session?.device === 'pc';
  return (
    <div className="fil-wrap">
      <div className="ph-section">Downloads</div>
      {game.age >= 18 && (
        <button className="fil-row" disabled={!!lock || game.s.web.installed.includes('tor')} title={lock ?? ''} onClick={() => notify(download(game, 'tor'))}>
          🧅 Tor-ish Browser {game.s.web.installed.includes('tor') ? '· installed' : lock ? '· 🔒' : '· download'}
        </button>
      )}
      {game.s.web.installed.filter((x) => x !== 'tor').map((x) => <div key={x} className="fil-row">🎮 {x}</div>)}
      {onPc && (
        <>
          <div className="ph-section">This PC · score {game.s.pc.score}</div>
          {(Object.entries(game.s.pc.parts) as [PartSlot, string][]).map(([slot, id]) => (
            <div key={slot} className="fil-row">{SLOT_ICON[slot]} {SLOT_LABEL[slot]}: {PART_BY_ID[id]?.name}</div>
          ))}
          {game.s.pc.noPaste && <div className="fil-row warn">🔥 Running hot (no thermal paste)</div>}
          <button
            className="fil-row"
            onClick={() => {
              game.s.pc.mining = !game.s.pc.mining;
              notify(game.s.pc.mining ? '⛏️ Mining on. Watch the electricity bill.' : 'Mining off.');
            }}
          >
            ⛏️ Crypto mining: {game.s.pc.mining ? 'ON' : 'off'} (monthly)
          </button>
        </>
      )}
    </div>
  );
}

export function DeskSettings({ game, notify }: DeskProps) {
  return (
    <div className="fil-wrap">
      <div className="ph-section">Wallpaper</div>
      <div className="fil-wps">
        {WALLPAPERS.map((w, i) => (
          <button key={i} className={`fil-wp ${game.s.web.wallpaper === i ? 'on' : ''}`} style={{ background: w }} onClick={() => { game.s.web.wallpaper = i; notify(''); }} />
        ))}
      </div>
    </div>
  );
}

export function Trash() {
  return <p className="app-empty">🗑️ Empty. Your secrets are safe. Probably.</p>;
}
