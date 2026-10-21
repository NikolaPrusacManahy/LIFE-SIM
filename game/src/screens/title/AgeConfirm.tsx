import { Modal } from '../../components/Modal';
import { saveSettings } from '../../ui/settingsStore';

/** Update 0.3 — first launch: confirm age. Mature Content defaults on only for confirmed adults. */
export function AgeConfirm({ onDone }: { onDone: () => void }) {
  const pick = (adult: boolean) => {
    saveSettings({ ageConfirmed: true, isAdult: adult, mature: adult });
    onDone();
  };
  return (
    <Modal className="age-card">
      <div className="evt-icon">🔞</div>
      <h3 className="evt-title">Before you begin</h3>
      <p className="evt-text">LIFE//SIM includes mature themes for adult characters (non-explicit). Are you 18 or older?</p>
      <div className="evt-choices">
        <button className="evt-choice" onClick={() => pick(true)}>
          <span>Yes, I’m 18+</span>
          <small>Mature Content on — you can turn it off in Settings</small>
        </button>
        <button className="evt-choice" onClick={() => pick(false)}>
          <span>No</span>
          <small>Mature Content stays off</small>
        </button>
      </div>
    </Modal>
  );
}
