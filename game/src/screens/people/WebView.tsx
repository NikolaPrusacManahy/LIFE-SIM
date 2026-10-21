import type { Game } from '../../state/Game';
import { contactGroup } from '../../state/npc/labels';
import { Portrait } from '../../components/Portrait';

const COLOR: Record<string, string> = {
  Partner: '#ff5c8a', Family: '#f5b53a', Friends: '#3cbfc4', Romance: '#ff9ec4', School: '#8b72f5', Work: '#ff9d3c', Exes: '#a8a2bd', Rivals: '#ff5d6c', Other: '#cfcadb',
};

/** Update 0.4 — who knows whom: you in the middle, lines to everyone; people from the same place are linked. */
export function WebView({ game, onPick }: { game: Game; onPick: (id: string) => void }) {
  const people = game.s.people.filter((p) => p.alive && p.status === 'alive').slice(0, 28);
  const W = 900;
  const H = 560;
  const cx = W / 2;
  const cy = H / 2;
  const pos = people.map((p, i) => {
    const a = (i / Math.max(1, people.length)) * Math.PI * 2 - Math.PI / 2;
    const r = 150 + (i % 2) * 70 + (100 - p.rel) * 0.6;
    return { p, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.82 };
  });
  return (
    <div className="web-wrap">
      <svg width={W} height={H} className="web-svg">
        {pos.flatMap((a, i) =>
          pos.slice(i + 1).filter((b) => a.p.where && a.p.where === b.p.where).map((b) => <line key={`${a.p.id}-${b.p.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e3deec" strokeWidth="1.5" strokeDasharray="4 4" />),
        )}
        {pos.map(({ p, x, y }) => <line key={p.id} x1={cx} y1={cy} x2={x} y2={y} stroke={COLOR[contactGroup(p)] ?? '#ccc'} strokeWidth={1 + p.rel / 30} opacity={0.75} />)}
        <circle cx={cx} cy={cy} r={34} fill="#ff5c8a" />
        <text x={cx} y={cy + 6} textAnchor="middle" fontFamily="Fredoka" fontSize="18" fill="#fff">You</text>
      </svg>
      {pos.map(({ p, x, y }) => (
        <button key={p.id} className="web-node" style={{ left: x - 22, top: y - 22 }} onClick={() => onPick(p.id)} title={`${p.name} · ${contactGroup(p)}`}>
          <Portrait look={p.look} age={game.ageOf(p)} size={44} />
          <small>{p.name}</small>
        </button>
      ))}
      <div className="web-legend">{Object.entries(COLOR).map(([k, c]) => <span key={k}><i style={{ background: c }} />{k}</span>)}</div>
    </div>
  );
}
