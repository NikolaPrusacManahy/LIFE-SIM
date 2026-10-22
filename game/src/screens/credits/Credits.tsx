import { Modal } from '../../components/Modal';

// Update 0.13 — who made the art and tools the game is built on.
const CREDITS: [string, string, string][] = [
  ['🏙️', 'Kenney (kenney.nl)', 'Isometric city, buildings, landscape, vehicles, library, farm, foliage, background, animals and item art. Creative Commons CC0.'],
  ['🙂', 'DiceBear — Avataaars', 'Character portraits. Avataaars design by Pablo Stanley; DiceBear library, MIT.'],
  ['✨', 'PixiJS', 'The 2D renderer behind the world and the minigames. MIT.'],
  ['🎞️', 'GSAP', 'Interface and scene animation.'],
  ['⚛️', 'React · Vite · TypeScript', 'The game interface and build. MIT / Apache-2.0.'],
  ['🔤', 'Space Grotesk · Inter', 'Typefaces, SIL Open Font License.'],
];

export function Credits({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} className="crd-card">
      <h3 className="evt-title">Credits</h3>
      <div className="crd-list">
        {CREDITS.map(([icon, who, what]) => (
          <div key={who} className="crd-row">
            <span>{icon}</span>
            <div><b>{who}</b><small>{what}</small></div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={onClose} autoFocus>Close</button>
    </Modal>
  );
}
