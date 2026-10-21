import type { Phase } from '../../state/types';

export const W = 1440;
export const H = 860;
/** Ground line. */
export const GROUND_Y = 566;
/** Horizontal centre of the open scene window between the side cards. */
export const SCENE_X = 740;

export interface SkyKey {
  top: number;
  mid: number;
  horizon: number;
  /** atmospheric haze colour at the horizon */
  haze: number;
  /** 0 = full day, 1 = deep night */
  dark: number;
  /** multiplied onto every lit-by-sky surface */
  tint: number;
  cloud: number;
}

export const SKY: Record<Phase, SkyKey> = {
  morning: { top: 0x5b8fe6, mid: 0x9cc3f2, horizon: 0xffd2a8, haze: 0xffe2c4, dark: 0.05, tint: 0xfff0e2, cloud: 0xfff3ea },
  afternoon: { top: 0x2f78e8, mid: 0x6faaf2, horizon: 0xcfe8ff, haze: 0xe4f1ff, dark: 0, tint: 0xffffff, cloud: 0xffffff },
  evening: { top: 0x241a52, mid: 0x7b3f78, horizon: 0xff8a5c, haze: 0xffa77a, dark: 0.45, tint: 0xd8a3a0, cloud: 0xf2a08a },
  night: { top: 0x03050f, mid: 0x0b1230, horizon: 0x1f2a5c, haze: 0x26326a, dark: 0.82, tint: 0x4a5794, cloud: 0x3a4470 },
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpColor(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
}

export const hexCss = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const seasonOf = (month: number): Season =>
  month === 11 || month <= 1 ? 'winter' : month <= 4 ? 'spring' : month <= 7 ? 'summer' : 'autumn';

/** [shadow, base, highlight] canopy colours */
export const FOLIAGE: Record<Season, [number, number, number]> = {
  spring: [0x3f8f4a, 0x63b85a, 0x9ad77a],
  summer: [0x2b6e3c, 0x3f9150, 0x6cbf62],
  autumn: [0xa8431f, 0xdf7a2c, 0xf2b84b],
  winter: [0xb9c6d4, 0xdbe4ee, 0xffffff],
};

export const GRASS: Record<Season, [number, number]> = {
  spring: [0x7cc463, 0x5aa04a],
  summer: [0x5fae4c, 0x3f8838],
  autumn: [0xb0a052, 0x8a7a3a],
  winter: [0xf1f5fa, 0xcfd9e4],
};

/** Deterministic PRNG so scenery doesn't reshuffle every rebuild. */
export function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
