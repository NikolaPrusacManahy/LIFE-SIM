import type { AvatarSpec } from '../state/types';
import { portraitUri } from '../fx/portrait';

/**
 * Update 0.7 — DiceBear "Avataaars" portrait built from the same look as the Pixi avatar.
 * `seed` (the person's id) keeps the unmodelled parts (outfit, brows, beard) stable for that person.
 */
export function Portrait({ look, age, size = 40, seed, mood }: { look: AvatarSpec; age: number; size?: number; seed?: string; mood?: number }) {
  const src = portraitUri(look, age, seed ?? `${look.body}${look.skin}${look.hair}${look.hairStyle}`, mood);
  return <img className="por-svg por-dice" src={src} width={size} height={size} alt="" draggable={false} />;
}
