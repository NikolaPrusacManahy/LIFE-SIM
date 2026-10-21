import { useState } from 'react';
import { HoldButton } from '../../../components/HoldButton';
import { settings } from '../../../state/settings';
import { saveSettings } from '../../../ui/settingsStore';
import type { AppProps } from './types';
import { syncMusic } from '../../../ui/audio';

export function SettingsApp({ game, onTitle, onRestart }: AppProps) {
  const [mature, setMature] = useState(settings.mature);
  const [dark, setDark] = useState(settings.darkCrime);
  const toggleDark = () => {
    saveSettings({ darkCrime: !dark });
    setDark(settings.darkCrime);
  };
  const [music, setMusic] = useState(settings.music);
  const [sound, setSound] = useState(settings.sound);
  const toggleMusic = () => {
    saveSettings({ music: !music });
    setMusic(settings.music);
    syncMusic();
  };
  const toggleSound = () => {
    saveSettings({ sound: !sound });
    setSound(settings.sound);
  };
  const toggle = () => {
    saveSettings({ mature: !mature });
    setMature(settings.mature);
  };
  return (
    <div className="app-stack">
      <div className="app-box">
        <p className="app-sub">Your life saves automatically after every action.</p>
        <p className="app-sub">Generation {game.s.generation} · Turn {game.s.turn} · Rules: United States</p>
      </div>
      <button className="app-box set-row" onClick={toggleMusic}>
        <span>
          <b>Music</b>
          <small>Background music.</small>
        </span>
        <i className={`set-switch ${music ? 'on' : ''}`} />
      </button>
      <button className="app-box set-row" onClick={toggleSound}>
        <span>
          <b>Sound effects</b>
          <small>Clicks, texts, notifications.</small>
        </span>
        <i className={`set-switch ${sound ? 'on' : ''}`} />
      </button>
      <button className="app-box set-row" onClick={toggle} disabled={!settings.isAdult}>
        <span>
          <b>Mature Content</b>
          <small>{settings.isAdult ? 'Adult-only relationship actions (both characters 18+). Non-explicit.' : 'Requires an 18+ age confirmation.'}</small>
        </span>
        <i className={`set-switch ${mature ? 'on' : ''}`} />
      </button>
      <button className="app-box set-row" onClick={toggleDark} disabled={!settings.isAdult}>
        <span>
          <b>Dark Crime</b>
          <small>{settings.isAdult ? 'Murder, kidnapping, the drug business. Off = petty crime only. Never involves minors.' : 'Requires an 18+ age confirmation.'}</small>
        </span>
        <i className={`set-switch ${dark ? 'on' : ''}`} />
      </button>
      <button className="btn" onClick={onTitle}>Title screen</button>
      <HoldButton onConfirm={onRestart}>Hold to start a new life</HoldButton>
    </div>
  );
}
