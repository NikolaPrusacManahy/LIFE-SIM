import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game } from '../../state/Game';
import type { AppHostProps } from '../phone/apps';
import { DEVICE_NAME, closeSession } from '../../state/pc/session';
import { currentZoom } from '../../ui/layout';
import { WALLPAPERS, type DeskApp, type DeskProps } from './types';
import { Browser } from './Browser';
import { Bitstore } from './Bitstore';
import { Files, DeskSettings, Trash } from './Files';
import { GameWindow } from './games/GameWindow';
import { GAME_BY_ID, type GameId } from '../../state/games/catalog';
import { StartupApp } from './startup/StartupApp';
import { SteroidsApp } from './steroids/SteroidsApp';

// Update 0.8 — "Doors": a fake OS. Windows open, close, drag and stack. One sitting = one time slot.

const CLOCK = { morning: '08:15', afternoon: '14:30', evening: '19:45', night: '23:10' } as const;

const APPS: { app: DeskApp; name: string; icon: string; arg?: string }[] = [
  { app: 'browser', name: 'Browser', icon: '🌐' },
  { app: 'browser', name: 'JobHunt', icon: '💼', arg: 'jobhunt' },
  { app: 'startup', name: 'START-UP', icon: '🚀' },
  { app: 'steroids', name: 'Stats on steroids', icon: '💉' },
  { app: 'bitstore', name: 'Bitstore', icon: '🛍️' },
  { app: 'browser', name: 'Discorb', icon: '💬', arg: 'discorb' },
  { app: 'files', name: 'Files', icon: '📁' },
  { app: 'settings', name: 'Settings', icon: '⚙️' },
  { app: 'trash', name: 'Trash', icon: '🗑️' },
];

interface Win {
  key: number;
  app: DeskApp;
  arg?: string;
  x: number;
  y: number;
  z: number;
}

const TITLE: Record<DeskApp, string> = { browser: 'Browser', bitstore: 'Bitstore', files: 'Files', settings: 'Settings', trash: 'Trash', game: 'Game', startup: 'START-UP', steroids: 'Stats on steroids' };

export function Desktop({ game, host, onShutdown }: { game: Game; host: AppHostProps; onShutdown: (summary: string) => void }) {
  const [wins, setWins] = useState<Win[]>([]);
  const [start, setStart] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, bump] = useState(0);
  const zTop = useRef(10);
  const keyN = useRef(1);
  const drag = useRef<{ key: number; sx: number; sy: number; x: number; y: number } | null>(null);
  const s = game.s.session!;

  const notify = useCallback(
    (text: string) => {
      if (text) setToast(text);
      host.onResult(game.flush('', '', ''), false);
      bump((n) => n + 1);
    },
    [game, host],
  );
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const open = useCallback((app: DeskApp, arg?: string) => {
    setStart(false);
    setWins((w) => {
      const same = w.find((x) => x.app === app && (app !== 'game' || x.arg === arg));
      zTop.current++;
      if (same) return w.map((x) => (x === same ? { ...x, arg: arg ?? x.arg, z: zTop.current } : x));
      const n = w.length;
      return [...w, { key: keyN.current++, app, arg, x: 150 + n * 34, y: 60 + n * 28, z: zTop.current }];
    });
  }, []);
  const close = (key: number) => setWins((w) => w.filter((x) => x.key !== key));
  const focus = (key: number) => setWins((w) => w.map((x) => (x.key === key ? { ...x, z: ++zTop.current } : x)));

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const z = currentZoom();
      setWins((w) => w.map((x) => (x.key === d.key ? { ...x, x: Math.max(0, Math.min(1440 - 200, d.x + (e.clientX - d.sx) / z)), y: Math.max(0, Math.min(860 - 120, d.y + (e.clientY - d.sy) / z)) } : x)));
    };
    const up = () => (drag.current = null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  const props: DeskProps = { game, host, notify, open };
  const shutdown = () => onShutdown(closeSession(game));
  const wp = WALLPAPERS[game.s.web.wallpaper % WALLPAPERS.length];

  return (
    <div className="dsk-screen" style={{ background: wp }} data-sfx="none">
      <div className="dsk-icons">
        {APPS.map((a) => (
          <button key={a.name} className="dsk-icon" onDoubleClick={() => open(a.app, a.arg)} onClick={() => open(a.app, a.arg)}>
            <span>{a.icon}</span>
            <small>{a.name}</small>
          </button>
        ))}
      </div>

      {wins.map((w) => (
        <div key={w.key} className={`dsk-win dsk-win-${w.app}`} style={{ left: w.x, top: w.y, zIndex: w.z }} onPointerDown={() => focus(w.key)}>
          <div className="dsk-titlebar" onPointerDown={(e) => { drag.current = { key: w.key, sx: e.clientX, sy: e.clientY, x: w.x, y: w.y }; }}>
            <b>{w.app === 'game' ? `${GAME_BY_ID[w.arg as GameId]?.icon} ${GAME_BY_ID[w.arg as GameId]?.name}` : TITLE[w.app]}</b>
            <button className="dsk-close" onPointerDown={(e) => e.stopPropagation()} onClick={() => close(w.key)}>✕</button>
          </div>
          <div className="dsk-body">
            {w.app === 'browser' && <Browser {...props} site={w.arg} />}
            {w.app === 'bitstore' && <Bitstore {...props} />}
            {w.app === 'startup' && <StartupApp {...props} />}
            {w.app === 'steroids' && <SteroidsApp {...props} />}
            {w.app === 'files' && <Files {...props} />}
            {w.app === 'settings' && <DeskSettings {...props} />}
            {w.app === 'trash' && <Trash />}
            {w.app === 'game' && <GameWindow {...props} id={w.arg as GameId} onClose={() => close(w.key)} />}
          </div>
        </div>
      ))}

      {toast && <div className="dsk-toast">{toast}</div>}

      {start && (
        <div className="dsk-start">
          <b>{game.s.name}</b>
          {APPS.map((a) => <button key={a.name} onClick={() => open(a.app, a.arg)}>{a.icon} {a.name}</button>)}
          <button className="dsk-off" onClick={shutdown}>⏻ Shut down</button>
        </div>
      )}

      <div className="dsk-taskbar">
        <button className={`dsk-startbtn ${start ? 'on' : ''}`} onClick={() => setStart((x) => !x)}>⊞ Doors</button>
        {wins.map((w) => <button key={w.key} className="dsk-task" onClick={() => focus(w.key)}>{w.app === 'game' ? GAME_BY_ID[w.arg as GameId]?.icon : TITLE[w.app]}</button>)}
        <span className="dsk-tray">
          <span className={s.left === 0 ? 'dsk-out' : ''} title="Actions left this sitting">⚡ {s.left}/{s.max}</span>
          <span>{DEVICE_NAME[s.device]}</span>
          <span>{CLOCK[game.phase]}</span>
        </span>
        <button className="dsk-shutdown" onClick={shutdown} title="Shut down (ends the sitting)">⏻</button>
      </div>
    </div>
  );
}
