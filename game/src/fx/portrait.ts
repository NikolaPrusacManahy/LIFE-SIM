import { Avatar, Style, type StyleDefinition } from '@dicebear/core';
import avataaars from '@dicebear/styles/avataaars.json';
import type { AvatarSpec } from '../state/types';
import { SKIN, hairColor, hex } from './look';

// Update 0.7 — portraits drawn with DiceBear "Avataaars" (Pablo Stanley, free for personal & commercial use).
// Our look maps onto it; parts we don't model (eyebrows, outfit) come from the seed so each person stays the same.
// Avataaars has no freckles or eye colours — those only show on the Pixi avatar.

// generic definition type: our variant names are checked against the style file in tests/test-portrait.ts
const STYLE = new Style<StyleDefinition>(avataaars as unknown as StyleDefinition);
/** Avataaars part names (tests check our mapping only uses real ones). */
export const AVATAAARS_PARTS = avataaars.components as unknown as Record<string, { variants: Record<string, unknown> }>;

/** Our 12 hairstyles → the closest Avataaars top, [male model, female model]. Female tops are all long/feminine cuts. */
export const TOPS: [string, string][] = [
  ['shortWaved', 'curvy'], // Tousled
  ['shaggy', 'straight01'], // Long
  ['shortFlat', 'bun'], // Top bun
  ['theCaesar', 'frizzle'], // Buzz
  ['shaggyMullet', 'straightAndStrand'], // Ponytail
  ['frizzle', 'bob'], // Bob
  ['dreads01', 'frida'], // Braids
  ['shortCurly', 'curly'], // Curly
  ['shortRound', 'miaWallace'], // Pixie
  ['dreads02', 'shavedSides'], // Mohawk
  ['theCaesarAndSidePart', 'longButNotTooLong'], // Side part
  ['turban', 'hijab'], // Hijab / head wrap
];

const CLOTHES: Record<'male' | 'female', [teen: string[], adult: string[]]> = {
  male: [['hoodie', 'graphicShirt', 'shirtCrewNeck', 'collarAndSweater'], ['blazerAndShirt', 'blazerAndSweater', 'shirtCrewNeck', 'collarAndSweater', 'hoodie', 'shirtVNeck']],
  female: [['hoodie', 'graphicShirt', 'shirtScoopNeck', 'overall'], ['shirtScoopNeck', 'shirtVNeck', 'blazerAndShirt', 'collarAndSweater', 'overall', 'hoodie']],
};
const CLOTHES_COLOR = ['262e33', '65c9ff', '5199e4', '25557c', '929598', '3c4f5c', 'a7ffc4', 'ffafb9', 'ff488e', 'ff5c5c'];

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const bare = (c: number) => hex(c).slice(1);

/** Pure mapping from a game look to DiceBear options (tested). */
export function portraitOptions(look: AvatarSpec, age: number, seed: string, mood?: number) {
  const h = hash(seed);
  const female = look.body === 'female';
  const hair = bare(hairColor(look.hair, age));
  const beard = !female && age >= 20 && h % 10 < 3;
  const clothes = CLOTHES[female ? 'female' : 'male'][age < 18 ? 0 : 1];
  const happy = mood !== undefined && mood >= 70;
  const sad = mood !== undefined && mood <= 25;
  return {
    seed,
    skinColor: bare(SKIN[look.skin % SKIN.length]),
    hairColor: hair,
    hatColor: '6a4c93',
    topVariant: TOPS[look.hairStyle % TOPS.length][female ? 1 : 0],
    topProbability: 100,
    accessoriesVariant: look.accessory ?? 'prescription02',
    accessoriesProbability: look.glasses || look.accessory ? 100 : 0,
    facialHairVariant: (h >>> 4) % 2 ? 'beardLight' : 'beardMedium',
    facialHairColor: hair,
    facialHairProbability: beard ? 100 : 0,
    clothesVariant: clothes[(h >>> 8) % clothes.length],
    clothesColor: CLOTHES_COLOR[(h >>> 12) % CLOTHES_COLOR.length],
    eyesVariant: happy ? 'happy' : sad ? 'side' : 'default',
    mouthVariant: happy ? 'smile' : sad ? 'sad' : 'default',
    eyebrowsVariant: sad ? 'sadConcernedNatural' : 'defaultNatural',
    backgroundColor: female ? 'ffe3ec' : 'e2f2ff',
  };
}

const cache = new Map<string, string>();

/** SVG data URI for a portrait (cached — chips re-render a lot). */
export function portraitUri(look: AvatarSpec, age: number, seed: string, mood?: number): string {
  const opts = portraitOptions(look, age, seed, mood);
  const key = JSON.stringify(opts);
  let uri = cache.get(key);
  if (!uri) {
    uri = new Avatar(STYLE, opts).toDataUri();
    if (cache.size > 600) cache.clear();
    cache.set(key, uri);
  }
  return uri;
}
