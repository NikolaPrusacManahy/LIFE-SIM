import type { AvatarSpec } from '../state/types';
import { EYES, SKIN, hairColor, hex } from '../fx/look';

/** Update 0.4 — small SVG head matching the Pixi avatar (same palette and hairstyle indices). */
export function Portrait({ look, age, size = 40 }: { look: AvatarSpec; age: number; size?: number }) {
  const skin = hex(SKIN[look.skin % SKIN.length]);
  const hair = hex(hairColor(look.hair, age));
  const eye = hex(EYES[(look.eyes ?? 0) % EYES.length]);
  const st = look.hairStyle % 12;
  const long = st === 1 || st === 5 || st === 6;
  return (
    <svg className="por-svg" width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="32" fill={look.body === 'female' ? '#ffe3ec' : '#e2f2ff'} />
      {long && <rect x="12" y="16" width="40" height="44" rx="16" fill={hair} />}
      {st === 11 && <rect x="10" y="10" width="44" height="54" rx="20" fill="#6a4c93" />}
      <rect x="27" y="44" width="10" height="10" fill={skin} />
      <path d={`M10 64 Q32 48 54 64 Z`} fill={look.body === 'female' ? '#ff7aa2' : '#4f8ff0'} />
      <ellipse cx="32" cy="32" rx="16" ry="18" fill={skin} stroke="#1f1a33" strokeWidth="1.6" />
      {st !== 11 && st !== 3 && st !== 7 && <path d="M15 30 Q16 12 32 12 Q48 12 49 30 Q42 20 32 21 Q22 20 15 30 Z" fill={hair} stroke="#1f1a33" strokeWidth="1.4" />}
      {st === 3 && <path d="M17 26 Q32 10 47 26 Q32 20 17 26 Z" fill={hair} />}
      {st === 7 && [[18, 20, 8], [28, 13, 8], [38, 13, 8], [47, 20, 7]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={hair} />)}
      {st === 2 && <circle cx="32" cy="9" r="6" fill={hair} />}
      {st === 4 && <rect x="44" y="14" width="7" height="22" rx="4" fill={hair} />}
      {st === 9 && <rect x="29" y="4" width="6" height="16" rx="3" fill={hair} />}
      {st === 11 && <ellipse cx="32" cy="20" rx="18" ry="11" fill="#6a4c93" />}
      <ellipse cx="26" cy="33" rx="2.2" ry="2.8" fill={eye} />
      <ellipse cx="38" cy="33" rx="2.2" ry="2.8" fill={eye} />
      {look.glasses && <g fill="none" stroke="#1f1a33" strokeWidth="1.4"><rect x="21" y="29" width="9" height="8" rx="3" /><rect x="34" y="29" width="9" height="8" rx="3" /><path d="M30 33h4" /></g>}
      {look.freckles && <g fill="#8a5a3a" opacity=".6"><circle cx="23" cy="39" r=".9" /><circle cx="26" cy="40" r=".9" /><circle cx="41" cy="39" r=".9" /><circle cx="38" cy="40" r=".9" /></g>}
      <path d="M28 42 Q32 45 36 42" fill="none" stroke="#7a2b35" strokeWidth="1.6" strokeLinecap="round" />
      {age >= 55 && <path d="M22 26 h5 M37 26 h5" stroke="#1f1a33" strokeWidth=".8" opacity=".4" />}
    </svg>
  );
}
