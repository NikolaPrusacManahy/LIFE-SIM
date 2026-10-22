// Update 0.13 — shared grid, types and helpers for every isometric scene (pure: no Pixi).
//
// Grid: cell (c, r). Its tile's top vertex sits at screen ((c − r)·66, (c + r)·33). Every tile sprite is
// bottom-anchored 98px below that vertex (shorter tiles, e.g. water, simply sit lower). Rendered pieces (farm,
// library) are anchored on the floor diamond's top vertex instead (RENDER_ANCHOR).

import type { Prim } from './furniture';

export const DX = 66;
export const DY = 33;
/** a tile's bottom edge, below its top vertex */
export const TILE_BASE = 98;
export const FLOOR_H = 36;
/** a roof's bottom edge, below the top floor's top */
export const ROOF_BASE = 50;

export type IsoSeason = 'spring' | 'summer' | 'autumn' | 'winter';

/** One thing to draw: a sprite (frame) or drawn shapes (prims). Screen position is the anchor point; z orders it. */
export interface Draw {
  frame: string;
  x: number;
  y: number;
  /** anchor (0–1) */
  ax: number;
  ay: number;
  z: number;
  flip?: boolean;
  scale?: number;
  /** the grid cell it stands on (tiles and buildings) */
  cell?: { c: number; r: number };
  /** drawn shapes instead of a sprite (frame is '') */
  prims?: Prim[];
}

/** Things that move or stay put: cars, walkers, and people who dance, sit or stand at a spot. Grid units. */
export interface Path {
  kind: 'car' | 'walk' | 'dance' | 'sit' | 'stand';
  points: { u: number; v: number }[];
  loop: boolean;
}

export interface IsoScene {
  kind: string;
  cols: number;
  rows: number;
  draws: Draw[];
  paths: Path[];
  /** street lamps (screen points) that glow at night */
  lamps: { x: number; y: number }[];
  /** lit windows (screen points) at night */
  windows: { x: number; y: number }[];
  /** how it sits in the stage window (default: scale 0.6, centre y 330) */
  view?: { scale: number; centreY: number };
  /** indoors: a backdrop gradient instead of the sky, lit the same day and night */
  backdrop?: [number, number];
  /** club lights: disco-ball spots and a beat pulse */
  disco?: { u: number; v: number; z: number };
  /** how many walkers (or dancers etc.) to keep around */
  crowd?: number;
  /** who's home: they take the first spots */
  household?: Member[];
}

/** Someone at home with you (spouse/partner, kid, pet). */
export interface Member { kind: 'adult' | 'kid' | 'pet'; color: number; skin?: number; /** a contact: clicking them opens their profile */ pid?: string }

/** Top vertex of a cell, or any grid point (u, v), on screen. */
export const toScreen = (u: number, v: number) => ({ x: (u - v) * DX, y: (u + v) * DY });
/** Draw order: things further down-screen draw later. */
export const depthOf = (u: number, v: number, layer = 0) => Math.round((u + v) * 100) + layer;

/** Small deterministic RNG so a place always looks the same. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pickOf = <T>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];

export function tile(frame: string, c: number, r: number, flip = false): Draw {
  const p = toScreen(c, r);
  return { frame, x: p.x, y: p.y + TILE_BASE, ax: 0.5, ay: 1, z: depthOf(c, r), cell: { c, r }, ...(flip ? { flip } : {}) };
}

/** Foliage art is drawn big; this brings it to the tiles' scale. */
export const FOLIAGE_SCALE = 0.42;

/** A tree, bush, rock or animal standing at grid point (u, v). */
export function plant(frame: string, u: number, v: number, scale = FOLIAGE_SCALE): Draw {
  const p = toScreen(u, v);
  return { frame, x: p.x, y: p.y, ax: 0.5, ay: 1, z: depthOf(u, v, 40), scale };
}

/** Rendered farm/library pieces: their floor diamond's top vertex is at (128, 373) of a 256×512 canvas (halved in the atlas). */
export const RENDER_ANCHOR = { ax: 0.5, ay: 373 / 512 };
/** halved canvas is 128 wide; a city tile is 132 */
export const RENDER_SCALE = 132 / 128;

/** A rendered piece on cell (c, r). Walls: `_E` stands on the back-left edge, `_S` on the back-right edge. */
export function piece(frame: string, c: number, r: number, layer = 20): Draw {
  const p = toScreen(c, r);
  return { frame, x: p.x, y: p.y, ...RENDER_ANCHOR, z: depthOf(c, r, layer), scale: RENDER_SCALE, cell: { c, r } };
}

/** Drawn shapes, ordered at grid point (u, v). */
export const shapes = (prims: Prim[], u: number, v: number, layer = 30): Draw => ({ frame: '', x: 0, y: 0, ax: 0, ay: 0, z: depthOf(u, v, layer), prims });

export const cellCentre = (c: number, r: number) => ({ u: c + 0.5, v: r + 0.5 });

/** Every frame a scene uses (for preloading and tests). */
export const allFrames = (s: IsoScene) => [...new Set(s.draws.filter((d) => d.frame).map((d) => d.frame))];
