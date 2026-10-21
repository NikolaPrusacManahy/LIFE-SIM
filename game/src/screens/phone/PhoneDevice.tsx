import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MONTHS } from '../../state/types';
import { weatherFor } from '../../fx/view';
import { useEscape } from '../../hooks/useEscape';
import { ageGate } from '../../state/rules/us';
import { APPS, APP_ORDER, AppView, type AppHostProps, type AppId } from './apps';

const CLOCK = { morning: '08:15', afternoon: '14:30', evening: '19:45', night: '23:10' } as const;
const TEMP = [2, 4, 9, 14, 19, 24, 27, 26, 21, 15, 8, 3];
const WEATHER_LABEL = { clear: 'Clear', rain: 'Rainy', snow: 'Snowy' } as const;
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props extends AppHostProps {
  /** a real phone, or the paper journal you carry without one */
  mode: 'phone' | 'journal';
  initial?: AppId | null;
}

/** Update 0.2 — in-game phone (app grid) / journal. Apps open inside the screen. */
export function PhoneDevice({ mode, initial = null, ...host }: Props) {
  const [app, setApp] = useState<AppId | null>(initial);
  const frame = useRef<HTMLDivElement>(null);
  const g = host.game;
  useEscape(() => (app ? setApp(null) : host.onClose()));
  useEffect(() => {
    gsap.fromTo(frame.current, { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)' });
  }, []);

  const apps = APP_ORDER.filter((id) => (mode === 'phone' || !APPS[id].phoneOnly) && (id !== 'dating' || ageGate('dating', g).allowed) && (id !== 'god' || g.s.god) && (id !== 'crime' || (g.age >= 18 && (g.s.god || g.flag('crimes05') > 0 || g.s.stats.street >= 5))));
  const temp = TEMP[g.month] + (g.s.region === 'country' ? -1 : 1) + (g.phase === 'night' ? -4 : g.phase === 'afternoon' ? 2 : 0);

  return (
    <div className="dev-backdrop" onMouseDown={(e) => e.target === e.currentTarget && host.onClose()}>
      <div ref={frame} className={`dev-frame dev-${mode}`}>
        <div className="dev-status">
          <span>{mode === 'phone' ? CLOCK[g.phase] : `${MONTHS[g.month]} ${g.year}`}</span>
          {mode === 'phone' && <span className="dev-notch" />}
          <span className="dev-icons">{mode === 'phone' ? '▂▄▆ 🔋' : '📓'}</span>
          <button className="dev-x" onClick={host.onClose} aria-label="Close">✕</button>
        </div>
        {app ? (
          <div className="dev-app">
            <div className="dev-app-head">
              <button className="dev-back" onClick={() => setApp(null)}>‹</button>
              <span className="dev-app-icon" style={{ background: `linear-gradient(135deg, ${APPS[app].color[0]}, ${APPS[app].color[1]})` }}>{APPS[app].icon}</span>
              <b>{APPS[app].name}</b>
            </div>
            <div className="dev-app-body">
              <AppView key={app} id={app} host={host} />
            </div>
          </div>
        ) : (
          <div className="dev-home">
            <div className="dev-clock">{mode === 'phone' ? CLOCK[g.phase] : 'Journal'}</div>
            <div className="dev-date">
              {mode === 'phone' ? `${MONTH_FULL[g.month]} ${g.year} · ${WEATHER_LABEL[weatherFor(g)]} · ${temp}°` : `${g.s.name}’s notebook — get a phone to job-hunt, shop and bank from anywhere`}
            </div>
            <div className="dev-grid">
              {apps.map((id) => (
                <button key={id} className="dev-tile" onClick={() => setApp(id)}>
                  <span className="dev-tile-icon" style={{ background: `linear-gradient(135deg, ${APPS[id].color[0]}, ${APPS[id].color[1]})` }}>{APPS[id].icon}</span>
                  <span className="dev-tile-name">{APPS[id].name}</span>
                </button>
              ))}
            </div>
            <div className="dev-foot">v0.6 · LIFE//SIM</div>
          </div>
        )}
        {mode === 'phone' && <div className="dev-bar" />}
      </div>
    </div>
  );
}
