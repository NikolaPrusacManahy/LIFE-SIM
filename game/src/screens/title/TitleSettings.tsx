import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { settings } from '../../state/settings';
import { saveSettings } from '../../ui/settingsStore';
import { syncMusic } from '../../ui/audio';

/** Update 0.13 — settings from the title screen: content (18+) and sound. The rest lives in the phone's Settings. */
export function TitleSettings({ onClose }: { onClose: () => void }) {
  const [, bump] = useState(0);
  const flip = (k: 'mature' | 'darkCrime' | 'music' | 'sound') => {
    saveSettings({ [k]: !settings[k] });
    if (k === 'music') syncMusic();
    bump((n) => n + 1);
  };
  const Row = ({ k, title, desc, adult }: { k: 'mature' | 'darkCrime' | 'music' | 'sound'; title: string; desc: string; adult?: boolean }) => (
    <button className="app-box set-row" onClick={() => flip(k)} disabled={adult && !settings.isAdult}>
      <span>
        <b>{title}</b>
        <small>{adult && !settings.isAdult ? 'Requires an 18+ age confirmation.' : desc}</small>
      </span>
      <i className={`set-switch ${settings[k] ? 'on' : ''}`} />
    </button>
  );
  return (
    <Modal onClose={onClose} className="tst-card">
      <h3 className="evt-title">Settings</h3>
      <div className="tst-list">
        <div className="tst-label">Content (18+)</div>
        <Row k="mature" adult title="Mature Content" desc="Adult-only relationship actions (both characters 18+). Non-explicit." />
        <Row k="darkCrime" adult title="Dark Crime" desc="Murder, kidnapping, the drug business. Off = petty crime only. Never involves minors." />
        <div className="tst-label">Sound</div>
        <Row k="music" title="Music" desc="Background music." />
        <Row k="sound" title="Sound effects" desc="Clicks, texts, notifications." />
      </div>
      <button className="btn btn-primary" onClick={onClose} autoFocus>Done</button>
    </Modal>
  );
}
