// Update 0.13 — furniture drawn in code (no pack has home or club furniture): flat isometric boxes in the Kenney
// palette, as ready-to-draw polygons. Pure: IsoView draws them with Pixi Graphics, tools/iso_preview with PIL.

import { DX, DY } from './layout-core';

export type Prim = { kind: 'poly'; pts: number[]; color: number; alpha?: number } | { kind: 'circle'; x: number; y: number; r: number; color: number; alpha?: number };

const P = (u: number, v: number) => [(u - v) * DX, (u + v) * DY];

export function shade(c: number, k: number) {
  const r = Math.round(((c >> 16) & 255) * k);
  const g = Math.round(((c >> 8) & 255) * k);
  const b = Math.round((c & 255) * k);
  return (Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b);
}

/** A box on the floor: (u, v) its back corner in grid units, w × d its footprint, h its height in px, lifted e px. */
export function box(u: number, v: number, w: number, d: number, h: number, color: number, e = 0): Prim[] {
  const lift = (p: number[], z: number) => [p[0], p[1] - z];
  const a = P(u, v), b = P(u + w, v), c = P(u + w, v + d), dd = P(u, v + d);
  const top = [...lift(a, e + h), ...lift(b, e + h), ...lift(c, e + h), ...lift(dd, e + h)];
  // the two faces you can see: +v (front-left) and +u (front-right)
  const left = [...lift(dd, e), ...lift(c, e), ...lift(c, e + h), ...lift(dd, e + h)];
  const right = [...lift(b, e), ...lift(c, e), ...lift(c, e + h), ...lift(b, e + h)];
  return [
    { kind: 'poly', pts: left, color: shade(color, 0.78) },
    { kind: 'poly', pts: right, color: shade(color, 0.62) },
    { kind: 'poly', pts: top, color },
  ];
}

/** A flat shape lying on the floor (rugs, dance tiles). */
export function flat(u: number, v: number, w: number, d: number, color: number, alpha = 1, e = 0.5): Prim {
  const pts = [P(u, v), P(u + w, v), P(u + w, v + d), P(u, v + d)].flatMap((p) => [p[0], p[1] - e]);
  return { kind: 'poly', pts, color, alpha };
}

/** A panel standing on the back-left edge (u fixed) or back-right edge (v fixed): pictures, boards, windows. */
export function panel(edge: 'left' | 'right', at: number, from: number, len: number, z0: number, h: number, color: number, alpha = 1): Prim {
  const a = edge === 'left' ? P(at, from) : P(from, at);
  const b = edge === 'left' ? P(at, from + len) : P(from + len, at);
  return { kind: 'poly', pts: [a[0], a[1] - z0, b[0], b[1] - z0, b[0], b[1] - z0 - h, a[0], a[1] - z0 - h], color, alpha };
}

const circle = (u: number, v: number, z: number, r: number, color: number, alpha = 1): Prim => {
  const p = P(u, v);
  return { kind: 'circle', x: p[0], y: p[1] - z, r, color, alpha };
};

// ---------------------------------------------------------------- the kit
// Each piece is drawn with its back corner at (u, v); `c` overrides the main colour.
export type PieceId =
  | 'sofa' | 'armchair' | 'bed' | 'bedDouble' | 'tv' | 'desk' | 'chair' | 'table' | 'rug' | 'lamp' | 'kitchen' | 'fridge'
  | 'bookshelf' | 'plant' | 'bar' | 'shelfBottles' | 'stool' | 'djBooth' | 'speaker' | 'poolTable' | 'treadmill'
  | 'bench' | 'rack' | 'punchBag' | 'hospitalBed' | 'curtain' | 'slot' | 'cardTable' | 'pew' | 'altar' | 'bars'
  | 'bunk' | 'crate' | 'counter' | 'register' | 'shelfGoods' | 'booth' | 'locker' | 'blackboard' | 'schoolDesk'
  | 'whiteboard' | 'computerDesk' | 'tent' | 'campfire' | 'barrel' | 'toolbox' | 'easel' | 'mic' | 'camera'
  | 'cow' | 'pig' | 'chicken' | 'duck' | 'horse' | 'cone' | 'dumpster' | 'trainCar' | 'stands' | 'standsR' | 'cart' | 'hay' | 'plane';

const WOOD = 0xb07a4a;
const DARK = 0x3b3f4c;
const METAL = 0x9aa3ad;
const WHITE = 0xeef0f2;

export const PIECES: Record<PieceId, (u: number, v: number, c?: number) => Prim[]> = {
  sofa: (u, v, c = 0x5b7bd6) => [...box(u, v, 0.9, 0.45, 12, c), ...box(u, v, 0.9, 0.14, 26, shade(c, 0.9)), ...box(u, v, 0.12, 0.45, 18, c), ...box(u + 0.78, v, 0.12, 0.45, 18, c)],
  armchair: (u, v, c = 0xd66b5b) => [...box(u, v, 0.45, 0.45, 12, c), ...box(u, v, 0.45, 0.12, 26, shade(c, 0.9))],
  bed: (u, v, c = 0x6aa4d8) => [...box(u, v, 0.55, 1, 10, WOOD), ...box(u + 0.03, v + 0.25, 0.49, 0.72, 5, c, 10), ...box(u + 0.08, v + 0.05, 0.39, 0.18, 6, WHITE, 10), ...box(u, v, 0.55, 0.08, 26, WOOD)],
  bedDouble: (u, v, c = 0xd88aa4) => [...box(u, v, 0.9, 1, 10, WOOD), ...box(u + 0.03, v + 0.28, 0.84, 0.69, 5, c, 10), ...box(u + 0.08, v + 0.06, 0.34, 0.18, 6, WHITE, 10), ...box(u + 0.5, v + 0.06, 0.34, 0.18, 6, WHITE, 10), ...box(u, v, 0.9, 0.08, 30, WOOD)],
  tv: (u, v) => [...box(u, v, 0.7, 0.3, 12, DARK), ...box(u + 0.08, v + 0.08, 0.54, 0.06, 26, 0x1c1f28, 12), ...box(u + 0.1, v + 0.14, 0.5, 0.005, 22, 0x6fb7ff, 14)],
  desk: (u, v, c = WOOD) => [...box(u, v, 0.8, 0.4, 18, c)],
  chair: (u, v, c = 0x8a5a3a) => [...box(u, v, 0.28, 0.28, 10, c), ...box(u, v, 0.28, 0.06, 22, c)],
  table: (u, v, c = WOOD) => [...box(u, v, 0.7, 0.7, 16, c)],
  rug: (u, v, c = 0xc0504d) => [flat(u, v, 1.4, 1, c, 0.95), flat(u + 0.1, v + 0.1, 1.2, 0.8, shade(c, 1.25), 0.9, 0.7)],
  lamp: (u, v) => [...box(u + 0.1, v + 0.1, 0.06, 0.06, 34, METAL), ...box(u, v, 0.26, 0.26, 12, 0xffe2a3, 34)],
  kitchen: (u, v) => [...box(u, v, 1.6, 0.4, 20, WHITE), ...box(u, v, 1.6, 0.4, 2, 0x8b8f96, 20), ...box(u + 0.2, v + 0.08, 0.3, 0.25, 1, DARK, 22)],
  fridge: (u, v) => [...box(u, v, 0.45, 0.42, 46, 0xdfe6ec)],
  bookshelf: (u, v, c = WOOD) => [...box(u, v, 0.9, 0.25, 44, c), ...box(u + 0.05, v + 0.2, 0.8, 0.05, 6, 0xd04a4a, 8), ...box(u + 0.05, v + 0.2, 0.8, 0.05, 6, 0x3e7bd6, 22), ...box(u + 0.05, v + 0.2, 0.8, 0.05, 6, 0x4caf7a, 34)],
  plant: (u, v) => [...box(u, v, 0.26, 0.26, 10, 0xc56a3a), circle(u + 0.13, v + 0.13, 20, 11, 0x4caf50), circle(u + 0.05, v + 0.1, 26, 8, 0x66c26a)],
  bar: (u, v, c = 0x6b3e26) => [...box(u, v, 0.4, 2.6, 22, c), ...box(u, v, 0.45, 2.6, 3, 0x3a2416, 22)],
  shelfBottles: (u, v) => [...box(u, v, 0.2, 2.2, 40, 0x4b2c1a), ...[0.2, 0.5, 0.8, 1.1, 1.4, 1.7, 2.0].map((k, i) => box(u + 0.04, v + k, 0.12, 0.08, 9, [0x7bc96f, 0xe0a33a, 0xd8574f, 0x66b6e8][i % 4], 30)).flat()],
  stool: (u, v) => [...box(u + 0.08, v + 0.08, 0.06, 0.06, 14, METAL), ...box(u, v, 0.22, 0.22, 3, 0xd04a4a, 14)],
  djBooth: (u, v) => [...box(u, v, 1.2, 0.5, 20, 0x22252e), ...box(u, v, 1.2, 0.5, 2, 0x8e6bd8, 20), circle(u + 0.35, v + 0.25, 23, 7, 0x111111), circle(u + 0.85, v + 0.25, 23, 7, 0x111111)],
  speaker: (u, v) => [...box(u, v, 0.35, 0.35, 40, 0x1b1d24), circle(u + 0.35, v + 0.35, 14, 6, 0x555b66), circle(u + 0.35, v + 0.35, 30, 4, 0x555b66)],
  poolTable: (u, v) => [...box(u, v, 1.2, 0.7, 16, 0x6b3e26), ...box(u + 0.06, v + 0.06, 1.08, 0.58, 1, 0x2e8b57, 16)],
  treadmill: (u, v) => [...box(u, v, 0.4, 0.9, 6, DARK), ...box(u, v, 0.4, 0.08, 30, METAL)],
  bench: (u, v, c = DARK) => [...box(u, v, 0.9, 0.3, 10, c), ...box(u + 0.4, v, 0.1, 0.3, 30, METAL)],
  rack: (u, v) => [...box(u, v, 0.2, 1, 30, METAL), ...[0.15, 0.4, 0.65].map((k) => box(u - 0.05, v + k, 0.3, 0.12, 10, DARK, 8)).flat()],
  punchBag: (u, v) => [...box(u + 0.1, v + 0.1, 0.03, 0.03, 70, DARK), ...box(u, v, 0.24, 0.24, 30, 0xb3302f, 18)],
  hospitalBed: (u, v) => [...box(u, v, 0.5, 1, 14, METAL), ...box(u + 0.02, v + 0.1, 0.46, 0.85, 4, WHITE, 14), ...box(u + 0.06, v + 0.04, 0.38, 0.14, 6, 0xbfd9ef, 16)],
  curtain: (u, v) => [...box(u, v, 0.04, 1.2, 46, 0x9ec6c0)],
  slot: (u, v) => [...box(u, v, 0.4, 0.4, 36, 0xc23b4c), ...box(u + 0.05, v + 0.36, 0.3, 0.02, 12, 0xffe066, 18)],
  cardTable: (u, v) => [...box(u, v, 1, 0.7, 16, 0x6b3e26), ...box(u + 0.05, v + 0.05, 0.9, 0.6, 1, 0x1f7a4a, 16)],
  pew: (u, v) => [...box(u, v, 1.4, 0.3, 10, WOOD), ...box(u, v, 1.4, 0.07, 22, shade(WOOD, 0.9))],
  altar: (u, v) => [...box(u, v, 1, 0.45, 18, WHITE), ...box(u + 0.46, v + 0.2, 0.06, 0.06, 40, 0xd4af37, 18), ...box(u + 0.38, v + 0.2, 0.22, 0.06, 6, 0xd4af37, 44)],
  bars: (u, v) => Array.from({ length: 9 }, (_, i) => box(u + i * 0.18, v, 0.03, 0.03, 52, METAL)).flat(),
  bunk: (u, v) => [...box(u, v, 0.5, 1, 8, METAL), ...box(u, v, 0.5, 1, 4, 0x8a96a3, 8), ...box(u, v, 0.5, 1, 4, 0x8a96a3, 34), ...box(u, v, 0.05, 0.05, 40, METAL)],
  crate: (u, v, c = 0xb5864f) => [...box(u, v, 0.45, 0.45, 26, c)],
  counter: (u, v, c = 0xd8d2c4) => [...box(u, v, 1.6, 0.4, 20, c), ...box(u, v, 1.6, 0.42, 2, 0x8a6c4a, 20)],
  register: (u, v) => [...box(u, v, 0.2, 0.2, 10, DARK, 22)],
  shelfGoods: (u, v) => [...box(u, v, 0.3, 1.6, 36, 0xc9c2b5), ...[0.15, 0.55, 0.95, 1.3].map((k, i) => box(u + 0.04, v + k, 0.2, 0.25, 8, [0xe8505b, 0xf2b134, 0x3a7bd5, 0x4caf7a][i], 14)).flat()],
  booth: (u, v, c = 0xc0392b) => [...box(u, v, 0.9, 0.3, 12, c), ...box(u, v, 0.9, 0.1, 28, shade(c, 0.85)), ...box(u, v + 0.35, 0.9, 0.4, 16, WOOD)],
  locker: (u, v) => [...box(u, v, 1.2, 0.3, 46, 0x5c7fb3)],
  blackboard: (u, v) => [panel('right', v, u, 1.6, 18, 26, 0x2d4a3e)],
  schoolDesk: (u, v) => [...box(u, v, 0.4, 0.3, 14, 0xd8b48a), ...box(u + 0.1, v + 0.35, 0.22, 0.2, 8, 0x5c7fb3)],
  whiteboard: (u, v) => [panel('right', v, u, 1.4, 20, 26, WHITE)],
  computerDesk: (u, v) => [...box(u, v, 0.8, 0.4, 18, 0xe2e2e2), ...box(u + 0.25, v + 0.05, 0.3, 0.05, 16, DARK, 18)],
  tent: (u, v, c = 0x5b8c5a) => [...box(u, v, 0.9, 0.9, 6, shade(c, 0.8)), ...box(u + 0.1, v + 0.1, 0.7, 0.7, 22, c, 6)],
  campfire: (u, v) => [...box(u, v, 0.3, 0.3, 4, 0x6b4a2a), circle(u + 0.15, v + 0.15, 10, 7, 0xff8a2a, 0.9), circle(u + 0.15, v + 0.15, 15, 4, 0xffd166, 0.9)],
  barrel: (u, v) => [...box(u, v, 0.3, 0.3, 24, 0x8a5a3a)],
  toolbox: (u, v) => [...box(u, v, 0.35, 0.2, 10, 0xd04a4a)],
  easel: (u, v) => [...box(u + 0.1, v, 0.04, 0.04, 40, WOOD), panel('right', v + 0.05, u, 0.5, 18, 26, 0xf6efe1)],
  mic: (u, v) => [...box(u, v, 0.04, 0.04, 34, METAL), circle(u, v, 36, 3, DARK)],
  camera: (u, v) => [...box(u, v, 0.05, 0.05, 30, DARK), ...box(u - 0.08, v - 0.08, 0.25, 0.18, 10, DARK, 30)],
  // simple animals (the animal pack is round head portraits — those are for the Pets app)
  cow: (u, v) => [...legs(u, v, 0.5, 0.22, 10, 0x333333), ...box(u, v, 0.5, 0.22, 14, WHITE, 10), ...box(u + 0.12, v + 0.02, 0.14, 0.18, 8, 0x222222, 24), ...box(u + 0.46, v + 0.02, 0.16, 0.18, 12, WHITE, 16)],
  pig: (u, v) => [...legs(u, v, 0.34, 0.18, 6, 0xd98a9a), ...box(u, v, 0.34, 0.18, 10, 0xf2a5b5, 6), ...box(u + 0.32, v + 0.03, 0.08, 0.12, 7, 0xf2a5b5, 8)],
  chicken: (u, v) => [...box(u, v, 0.12, 0.08, 8, WHITE, 3), ...box(u + 0.1, v + 0.02, 0.04, 0.04, 5, 0xd04a4a, 11)],
  duck: (u, v) => [...box(u, v, 0.14, 0.08, 6, 0xf6d34a), ...box(u + 0.1, v + 0.01, 0.06, 0.06, 6, 0x3f8f4f, 6), ...box(u + 0.16, v + 0.02, 0.04, 0.03, 2, 0xff9a2a, 8)],
  horse: (u, v) => [...legs(u, v, 0.55, 0.2, 16, 0x5a3a22), ...box(u, v, 0.55, 0.2, 14, 0x8a5a32, 16), ...box(u + 0.5, v + 0.03, 0.12, 0.14, 20, 0x8a5a32, 22)],
  cone: (u, v) => [...box(u, v, 0.1, 0.1, 10, 0xff7a2a)],
  dumpster: (u, v) => [...box(u, v, 0.7, 0.4, 22, 0x2f6b4f), ...box(u, v, 0.7, 0.4, 2, 0x24543e, 22)],
  trainCar: (u, v) => [...box(u, v, 0.85, 3.6, 48, 0xc0392b), ...box(u, v, 0.85, 3.6, 4, 0x8a2a20, 48), ...[0.3, 1.1, 1.9, 2.7].map((k) => box(u + 0.85, v + k, 0.01, 0.5, 14, 0xbfe3ff, 22)).flat()],
  // stadium stands: rows stepping back from the field (left side along v, right side along u)
  stands: (u, v) => [3, 2, 1, 0].map((k) => box(u + (3 - k) * 0.45, v, 0.45, 8, 14 + k * 16, [0x3a7bd5, 0xe8505b][k % 2])).flat(),
  standsR: (u, v) => [3, 2, 1, 0].map((k) => box(u, v + (3 - k) * 0.45, 8, 0.45, 14 + k * 16, [0x3a7bd5, 0xe8505b][k % 2])).flat(),
  cart: (u, v) => [...box(u, v, 0.4, 0.3, 14, METAL, 6), ...box(u + 0.05, v + 0.05, 0.3, 0.2, 6, 0xb5864f, 20)],
  hay: (u, v) => [...box(u, v, 0.5, 0.3, 16, 0xe2c26a)],
  plane: (u, v) => [...box(u, v, 0.32, 1.9, 16, WHITE, 6), ...box(u - 0.75, v + 0.8, 1.82, 0.4, 3, 0xdfe6ec, 14), ...box(u + 0.08, v, 0.16, 0.25, 22, 0x3a7bd5, 18), ...box(u + 0.05, v + 1.6, 0.22, 0.25, 4, 0x8fbbe8, 22)],
};

/** Four legs under a body (animals). */
function legs(u: number, v: number, w: number, d: number, h: number, c: number): Prim[] {
  return [[0.04, 0.04], [w - 0.1, 0.04], [0.04, d - 0.08], [w - 0.1, d - 0.08]].flatMap(([a, b]) => box(u + a, v + b, 0.05, 0.04, h, c));
}

/** The disco ball: a mirrored sphere hanging from the ceiling. */
export const discoBall = (u: number, v: number, z: number): Prim[] => [
  ...box(u - 0.01, v - 0.01, 0.02, 0.02, 60, METAL, z + 14),
  circle(u, v, z, 14, 0xc9d3de),
  circle(u - 0.05, v - 0.05, z + 4, 5, 0xffffff, 0.9),
];
