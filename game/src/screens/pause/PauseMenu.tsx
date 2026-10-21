import { Modal } from '../../components/Modal';
import { HoldButton } from '../../components/HoldButton';

interface Props {
  onResume: () => void;
  onTitle: () => void;
  onRestart: () => void;
}

export function PauseMenu({ onResume, onTitle, onRestart }: Props) {
  return (
    <Modal onClose={onResume} className="pse-card">
      <h3 className="evt-title">Paused</h3>
      <p className="ph-sub">Your life saves automatically after every action.</p>
      <div className="pse-buttons">
        <button className="btn btn-primary" onClick={onResume} autoFocus>Resume</button>
        <button className="btn" onClick={onTitle}>Title Screen</button>
        <HoldButton onConfirm={onRestart}>Hold to start a new life</HoldButton>
      </div>
    </Modal>
  );
}
