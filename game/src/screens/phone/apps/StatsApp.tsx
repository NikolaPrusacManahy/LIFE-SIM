import type { StatKey } from '../../../state/types';
import { Bar } from '../../../components/Bar';
import { TRAIT_BY_ID } from '../../../state/data/traits';
import { HOUSING } from '../../../state/data/locations';
import { DEGREE_LABEL } from '../../../state/data/programs';
import type { AppProps } from './types';

export const STAT_ROWS: [StatKey, string, string][] = [
  ['health', '❤️', '#ff5d73'],
  ['mood', '😊', '#ffb648'],
  ['energy', '⚡', '#3aa8e6'],
  ['smarts', '🧠', '#8b72f5'],
  ['fitness', '💪', '#34c77b'],
  ['charm', '😏', '#ff5c8a'],
  ['creativity', '🎨', '#ff9d3c'],
  ['looks', '✨', '#c77dff'],
];

export function StatsApp({ game }: AppProps) {
  const s = game.s;
  return (
    <div className="app-stack">
      <div className="app-chips">
        {s.traits.map((t) => (
          <span key={t} className="app-chip" title={TRAIT_BY_ID[t]?.desc}>{TRAIT_BY_ID[t]?.icon} {TRAIT_BY_ID[t]?.name}</span>
        ))}
      </div>
      <div className="app-box">
        {STAT_ROWS.map(([k, icon, color]) => (
          <Bar key={k} label={k[0].toUpperCase() + k.slice(1)} icon={icon} value={s.stats[k]} color={color} />
        ))}
        <Bar label="Karma" icon="☯️" value={s.karma} min={-100} max={100} color={s.karma >= 0 ? '#3cbfc4' : '#ff5d6c'} />
        <Bar label="Fame" icon="🌟" value={s.fame} color="#f5b53a" />
      </div>
      <div className="app-box app-facts">
        <span>🏠 {HOUSING[s.housing].name}</span>
        <span>🎓 {s.education.degrees.length ? s.education.degrees.map((d) => DEGREE_LABEL[d] ?? d).join(', ') : 'No degrees yet'}</span>
      </div>
    </div>
  );
}
