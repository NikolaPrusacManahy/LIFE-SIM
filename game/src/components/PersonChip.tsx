import type { Game } from '../state/Game';
import type { Person } from '../state/types';
import { GENDER_SYMBOL } from '../state/npc/identity';
import { primaryLabel } from '../state/npc/labels';
import { Portrait } from './Portrait';
import { claimedAge } from '../state/web/discorb';

/** Update 0.4 — [portrait] Name Surname · ♂ he/him · 15 · Classmate (Westside High) */
export function PersonChip({ game, p, compact, onClick }: { game: Game; p: Person; compact?: boolean; onClick?: () => void }) {
  const age = game.ageOf(p);
  // Update 0.8 — unverified online profiles only show the age they claim
  const shown = p.tags.includes('online') && !p.tags.includes('verified') ? `${claimedAge(game, p)}?` : age;
  return (
    <button className={`pch-chip ${compact ? 'pch-compact' : ''}`} onClick={onClick} type="button" title={`${p.name} ${p.surname} — ${p.pronouns.label}, ${shown}`}>
      <Portrait look={p.look} age={age} size={compact ? 22 : 34} seed={p.id} mood={p.mood} />
      <span className="pch-text">
        <b>{p.name} {compact ? '' : p.surname}</b>
        <small>
          {GENDER_SYMBOL[p.gender]} {p.pronouns.label} · {shown}
          {!compact && <> · {primaryLabel(p)}{p.where ? ` (${p.where})` : ''}</>}
        </small>
      </span>
    </button>
  );
}
