import { Modal } from '../../components/Modal';
import { useState } from 'react';
import { HoldButton } from '../../components/HoldButton';
import { Credits } from '../credits/Credits';

interface Props {
  onResume: () => void;
  onTitle: () => void;
  onRestart: () => void;
}

export function PauseMenu({ onResume, onTitle, onRestart }: Props) {
  const [credits, setCredits] = useState(false);
  if (credits) return <Credits onClose={() => setCredits(false)} />;
  return (
    <Modal onClose={onResume} className="pse-card">
      <h3 className="evt-title">Paused</h3>
      <p className="ph-sub">Your life saves automatically after every action.</p>
      <div className="pse-buttons">
        <button className="btn btn-primary" onClick={onResume} autoFocus>Resume</button>
        <button className="btn" onClick={onTitle}>Title Screen</button>
        <button className="btn btn-ghost" onClick={() => setCredits(true)}>Credits</button>
        <HoldButton onConfirm={onRestart}>Hold to start a new life</HoldButton>
      </div>
    </Modal>
  );
}
