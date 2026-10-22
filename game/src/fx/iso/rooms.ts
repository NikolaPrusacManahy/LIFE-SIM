// Update 0.13 — interiors: one room builder (floor, two back walls, wall decor, props, people spots) and every
// indoor place as data. Library and farmhouse/roadhouse use the rendered Kenney pieces; the rest is drawn in code.
// Pure (no Pixi).

import { PIECES, flat, panel, discoBall, shade, type PieceId, type Prim } from './furniture';
import { piece, shapes, type Draw, type IsoScene, type Member, type Path } from './layout-core';

export const WALL_H = 110;
const ROOM_VIEW = { scale: 0.8, centreY: 322 };

type Prop = [PieceId, number, number, number?];
interface RoomSpec {
  size?: number;
  /** two floor colours (checker) or a rendered floor piece */
  floor: [number, number] | string;
  /** wall colour, or rendered wall pieces [backLeft (_E), backRight (_S)] */
  wall: number | [string, string];
  /** extra wall shapes: windows, posters, neon */
  decor?: (n: number) => Prim[];
  props: Prop[];
  /** rendered props */
  pieces?: [string, number, number][];
  spots: Path[];
  backdrop: [number, number];
  crowd: number;
  disco?: boolean;
  /** the dance floor (club) */
  dance?: [number, number, number, number];
}

const sit = (u: number, v: number): Path => ({ kind: 'sit', loop: false, points: [{ u, v }] });
const stand = (u: number, v: number): Path => ({ kind: 'stand', loop: false, points: [{ u, v }] });
const dance = (u: number, v: number): Path => ({ kind: 'dance', loop: false, points: [{ u, v }] });
const walk = (pts: [number, number][]): Path => ({ kind: 'walk', loop: true, points: [...pts, pts[0]].map(([u, v]) => ({ u, v })) });

const windowsLeft = (n: number, color = 0xbfe3ff): Prim[] => Array.from({ length: Math.floor(n / 2) }, (_, i) => panel('left', 0, 0.6 + i * 2, 1.1, 40, 46, color, 0.9));
const windowsRight = (n: number, color = 0xbfe3ff): Prim[] => Array.from({ length: Math.floor(n / 2) }, (_, i) => panel('right', 0, 0.6 + i * 2, 1.1, 40, 46, color, 0.9));
const posters = (colors: number[]): Prim[] => colors.map((c, i) => panel(i % 2 ? 'right' : 'left', 0, 1 + i, 0.6, 46, 34, c));

export const ROOMS: Record<string, RoomSpec> = {
  library: {
    floor: 'farm_planks_S', wall: ['lib_wallBooks_E', 'lib_wallBooks_S'], props: [['plant', 6.3, 0.3]],
    pieces: [['lib_floorCarpet_S', 3, 3], ['lib_floorCarpetEnd_S', 3, 4], ['lib_longTableDecoratedChairs_S', 2, 2], ['lib_longTableDecoratedChairsBooks_S', 2, 4], ['lib_bookcaseBooksLadder_S', 5, 0], ['lib_bookcaseBooks_S', 4, 0], ['lib_bookcaseWideBooks_E', 0, 5], ['lib_bookcaseHalfBooks_E', 0, 3], ['lib_bookcaseWideBooks_S', 5, 2], ['lib_bookcaseWideBooksLadder_S', 5, 3], ['lib_candleStandDouble_S', 6, 6], ['lib_candleStand_S', 1, 1], ['lib_displayCaseBooks_S', 4, 5], ['lib_bookStand_S', 1, 6], ['lib_libraryChair_S', 6, 1]],
    spots: [sit(2.5, 2.6), sit(3.2, 2.9), sit(2.6, 4.6), sit(3.3, 4.9), walk([[4.5, 1.2], [5.5, 3.5], [4.4, 5.6], [1.2, 5.4]])],
    backdrop: [0x2a1d14, 0x5a3b26], crowd: 5,
  },
  club: {
    floor: [0x1b1630, 0x221c3a], wall: 0x2a1f4a, disco: true, dance: [2, 2, 3, 3],
    decor: (n) => [panel('left', 0, 0.5, n - 1, 70, 6, 0xff4fd8), panel('right', 0, 0.5, n - 1, 70, 6, 0x4fd8ff), panel('left', 0, 2, 2, 20, 40, 0x111111)],
    props: [['djBooth', 1, 0.3], ['speaker', 0.2, 0.2], ['speaker', 2.6, 0.2], ['bar', 0.3, 3.4], ['stool', 0.9, 3.6], ['stool', 0.9, 4.4], ['stool', 0.9, 5.2], ['shelfBottles', 0.05, 3.4], ['booth', 5, 5.6, 0x8e2b8e]],
    spots: [dance(2.5, 2.5), dance(3.4, 2.4), dance(4.3, 2.7), dance(2.6, 3.5), dance(3.6, 3.4), dance(4.4, 3.7), dance(2.9, 4.4), dance(3.9, 4.5), dance(4.6, 4.6), sit(1.1, 3.9), sit(1.1, 4.7), stand(1.6, 0.9), sit(5.4, 6)],
    backdrop: [0x0a0614, 0x1d0f33], crowd: 12,
  },
  bar: {
    floor: 'farm_planks_S', wall: 0x3e5a3a, decor: (n) => [...windowsLeft(n, 0xffd27a), ...posters([0xd04a4a, 0xf2b134])],
    props: [['bar', 0.3, 1], ['shelfBottles', 0.05, 1], ['stool', 0.9, 1.3], ['stool', 0.9, 2.1], ['stool', 0.9, 2.9], ['poolTable', 3.2, 2.5], ['booth', 4.8, 5.4, 0x7a3b2b], ['booth', 2.6, 5.4, 0x7a3b2b], ['lamp', 5.6, 0.4]],
    spots: [sit(1.1, 1.6), sit(1.1, 2.4), sit(1.1, 3.2), stand(3.4, 2.2), stand(4.6, 3.4), sit(3, 5.6), sit(5.2, 5.6), stand(0.8, 0.7)],
    backdrop: [0x1a120c, 0x3a2618], crowd: 8,
  },
  roadhouse: {
    floor: 'farm_planks_S', wall: ['farm_woodWall_E', 'farm_woodWall_S'],
    props: [['bar', 0.3, 1], ['stool', 0.9, 1.4], ['stool', 0.9, 2.3], ['poolTable', 3.4, 2.6], ['barrel', 5.8, 0.4], ['table', 4.3, 5], ['chair', 4, 5.8], ['speaker', 6.2, 3]],
    pieces: [['farm_hayBales_S', 6, 0]],
    spots: [sit(1.1, 1.7), sit(1.1, 2.6), stand(3.6, 2.2), stand(4.8, 3.6), sit(4.2, 6), dance(2.4, 4.6), dance(3, 5.2)],
    backdrop: [0x1a120c, 0x3f2a18], crowd: 7,
  },
  gym: {
    floor: [0x3a3f48, 0x353a42], wall: 0xd8dde3, decor: (n) => [panel('left', 0, 0.5, n - 1, 20, 60, 0xa9c8e8, 0.6), panel('right', 0, 1, 3, 60, 22, 0xd04a4a)],
    props: [['treadmill', 0.4, 1], ['treadmill', 0.4, 2.3], ['treadmill', 0.4, 3.6], ['bench', 3, 1.5], ['rack', 5.4, 0.4], ['punchBag', 4.4, 4.4], ['bench', 2.6, 4.8], ['plant', 6.2, 6.2]],
    spots: [stand(0.6, 1.5), stand(0.6, 2.8), stand(3.4, 1.7), stand(4.5, 4.2), stand(5.3, 2), walk([[2, 3], [5, 3], [5, 5.5], [2, 6]])],
    backdrop: [0x1d2430, 0x3a4658], crowd: 7,
  },
  hospital: {
    floor: [0xeef2f4, 0xe2e9ec], wall: 0xbfe3d8, decor: (n) => [...windowsRight(n), panel('left', 0, 1, 1.4, 50, 20, 0xd04a4a)],
    props: [['hospitalBed', 3.4, 0.4], ['curtain', 4.1, 0.2], ['hospitalBed', 5, 0.4], ['curtain', 5.7, 0.2], ['desk', 0.4, 4.6, 0xdfe6ec], ['chair', 1.4, 5.3], ['chair', 2.2, 5.6], ['plant', 0.3, 6.3]],
    spots: [sit(3.7, 0.9), stand(0.8, 4.4), sit(1.5, 5.5), walk([[2, 2], [5.5, 2.5], [5.5, 5], [2.5, 4.5]])],
    backdrop: [0x1e2f33, 0x3e5c62], crowd: 5,
  },
  casino: {
    floor: [0x7a1622, 0x6a1220], wall: 0x2b1a12, decor: (n) => [panel('left', 0, 0.3, n - 0.6, 80, 6, 0xffd166), panel('right', 0, 0.3, n - 0.6, 80, 6, 0xffd166)],
    props: [['slot', 0.3, 0.6], ['slot', 0.3, 1.4], ['slot', 0.3, 2.2], ['slot', 0.3, 3], ['cardTable', 3, 2], ['cardTable', 3.4, 4.6], ['bar', 6.3, 0.3], ['stool', 5.8, 0.8]],
    spots: [stand(1, 1), stand(1, 2.6), sit(3.4, 2.9), sit(4.3, 2.9), sit(3.8, 5.5), sit(4.7, 5.5), stand(3.5, 1.7), walk([[2, 6], [6, 6], [6, 3.5]])],
    backdrop: [0x14080a, 0x3a1a12], crowd: 9,
  },
  church: {
    floor: [0xd8d0c0, 0xcfc6b4], wall: 0xf2ead8, decor: (n) => [panel('left', 0, 1, 0.7, 40, 60, 0x6fb7e8, 0.9), panel('left', 0, 3, 0.7, 40, 60, 0xe86f6f, 0.9), panel('right', 0, 1, 0.7, 40, 60, 0xf2c94c, 0.9), panel('right', 0, 3, 0.7, 40, 60, 0x7bc96f, 0.9), panel('right', 0, n - 2, 0.8, 40, 60, 0x9b7be8, 0.9)],
    props: [['altar', 2.6, 0.4], ['pew', 1.6, 2], ['pew', 1.6, 3.2], ['pew', 1.6, 4.4], ['pew', 1.6, 5.6], ['plant', 0.3, 0.3], ['plant', 5.6, 0.3]],
    spots: [stand(3.1, 1.1), sit(2.2, 2.4), sit(2.8, 3.6), sit(2, 4.8), sit(2.6, 6), sit(3.3, 2.4)],
    backdrop: [0x2a2418, 0x5a4c34], crowd: 6,
  },
  jail: {
    floor: [0x7c8288, 0x737980], wall: 0x9aa1a8, decor: () => [panel('left', 0, 2, 0.5, 70, 14, 0x2c3036)],
    props: [['bars', 0.2, 3.2], ['bunk', 0.3, 0.5], ['bunk', 1.2, 0.5], ['bench', 3.6, 4.6, 0x5c6168], ['toolbox', 5.4, 1]],
    spots: [sit(0.6, 1.2), sit(1.5, 1.4), stand(2.4, 1.6), walk([[3, 4], [6, 4], [6, 6], [3, 6]])],
    backdrop: [0x16191c, 0x30363c], crowd: 4,
  },
  school: {
    floor: [0xd9b48a, 0xd1ab80], wall: 0xf3e6c4, decor: (n) => windowsLeft(n),
    props: [['blackboard', 1, 0], ['desk', 2, 0.6, 0x8a5a3a], ...[1.4, 2.8, 4.2].flatMap((u) => [2, 3.4, 4.8].map((v): Prop => ['schoolDesk', u, v])), ['plant', 6.2, 0.3]],
    spots: [stand(2.4, 1.2), ...[1.6, 3, 4.4].flatMap((u) => [2.5, 3.9, 5.3].map((v) => sit(u, v)))],
    backdrop: [0x2a2418, 0x5a4c34], crowd: 8,
  },
  office: {
    floor: [0x8a929c, 0x838b95], wall: 0xe6e9ec, decor: (n) => [...windowsRight(n), ...windowsLeft(n)],
    props: [['whiteboard', 1, 0], ...[1, 3].flatMap((u) => [1.8, 3.6].map((v): Prop => ['computerDesk', u, v])), ['plant', 6.2, 0.3], ['sofa', 4.8, 5.4, 0x5c7fb3], ['fridge', 0.2, 5.8]],
    spots: [sit(1.4, 2.4), sit(3.4, 2.4), sit(1.4, 4.2), sit(3.4, 4.2), stand(2, 0.8), sit(5.2, 5.7), walk([[5, 1], [6, 3], [5, 4.5]])],
    backdrop: [0x1d2430, 0x3a4658], crowd: 7,
  },
  shop: {
    floor: [0xeceae4, 0xe0ddd5], wall: 0xf6d7a7, decor: (n) => posters([0xe8505b, 0x3a7bd5, 0x4caf7a]).concat(windowsRight(n)),
    props: [['shelfGoods', 2, 1], ['shelfGoods', 3.6, 1], ['shelfGoods', 5.2, 1], ['counter', 0.4, 5], ['register', 0.6, 5.1], ['plant', 6.2, 6.2]],
    spots: [stand(0.8, 4.6), walk([[2.8, 1.5], [2.8, 3.8], [4.4, 3.8], [4.4, 1.5]]), walk([[6, 2], [6, 4.5], [4.6, 5]])],
    backdrop: [0x2a2418, 0x5a4c34], crowd: 5,
  },
  diner: {
    floor: [0xf2f2f2, 0x2b2b2b], wall: 0x9ad3c8, decor: (n) => windowsLeft(n, 0xffefb0),
    props: [['counter', 3, 0.4, 0xd04a4a], ['stool', 3.4, 1], ['stool', 4.2, 1], ['stool', 5, 1], ['booth', 0.4, 2], ['booth', 0.4, 4], ['booth', 3.2, 4.8], ['fridge', 6.3, 0.2]],
    spots: [sit(3.6, 1.3), sit(4.4, 1.3), sit(0.9, 2.2), sit(0.9, 4.2), sit(3.6, 5), stand(4, 0.2)],
    backdrop: [0x1e2f33, 0x3e5c62], crowd: 6,
  },
  police: {
    floor: [0xb8c0c8, 0xaeb6be], wall: 0x7a8fae, decor: () => posters([0x2c3e66, 0xf2b134]),
    props: [['desk', 1, 1], ['computerDesk', 3, 1], ['chair', 1.4, 1.8], ['chair', 3.4, 1.8], ['bars', 0.2, 4.4], ['bench', 4, 5.2, 0x5c6168], ['locker', 5, 0.2]],
    spots: [sit(1.6, 2), sit(3.6, 2), stand(5, 3), sit(4.4, 5.5), stand(0.8, 5.2)],
    backdrop: [0x16191c, 0x30363c], crowd: 5,
  },
  studio: {
    floor: [0x2b2f3a, 0x262a34], wall: 0x1f222b, decor: (n) => [panel('right', 0, 1, n - 2, 30, 50, 0x3a3f4c), panel('left', 0, 2, 1.5, 40, 30, 0xd04a4a)],
    props: [['mic', 3, 3], ['camera', 4.8, 4.8], ['lamp', 1.2, 1.2], ['lamp', 5, 1], ['sofa', 1.2, 4.8, 0x8e6bd8], ['speaker', 0.3, 0.3]],
    spots: [stand(3.1, 3.4), stand(5, 5.2), sit(1.6, 5.1)],
    backdrop: [0x0a0c12, 0x1f2430], crowd: 3,
  },
  warehouse: {
    floor: [0x9a9890, 0x928f87], wall: 0x6f6a60, decor: (n) => windowsRight(n, 0x8fb0c8),
    props: [['crate', 0.4, 0.4], ['crate', 0.9, 0.4], ['crate', 0.4, 0.9], ['crate', 3, 0.5], ['crate', 3.5, 0.5], ['barrel', 5.6, 0.4], ['barrel', 6, 0.9], ['crate', 0.5, 4], ['crate', 1, 4.4], ['rack', 4.5, 3.5]],
    spots: [walk([[2, 2], [5, 2.5], [5.5, 5.5], [2.5, 5.5]]), stand(1.8, 1.5)],
    backdrop: [0x1a1814, 0x3a352c], crowd: 3,
  },
  garage: {
    floor: [0x8a8a86, 0x80807c], wall: 0xb5b0a4, decor: () => [panel('right', 0, 2, 2.4, 0, 70, 0x6f747a)],
    props: [['rack', 0.3, 0.6], ['toolbox', 0.4, 3], ['barrel', 5.8, 0.4], ['crate', 6, 1]],
    pieces: [],
    spots: [stand(3, 4.5), stand(1, 2)],
    backdrop: [0x1a1814, 0x3a352c], crowd: 2,
  },
  hideout: {
    floor: [0x3a2a24, 0x33251f], wall: 0x3b2a2a, decor: () => posters([0x8a1c1c]),
    props: [['rug', 2, 2, 0x7a1c2a], ['sofa', 2, 1, 0x3a3a3a], ['armchair', 4.2, 2.6, 0x5a1a1a], ['cardTable', 2.4, 4.4], ['bar', 6.2, 0.3], ['lamp', 0.4, 0.4]],
    spots: [sit(2.5, 1.4), sit(3.2, 1.4), sit(4.5, 2.9), sit(2.8, 5.2), sit(3.6, 5.2), stand(6, 1.6)],
    backdrop: [0x0e0a08, 0x2a1c16], crowd: 6,
  },
};
// the mafia's place is the same kind of room as the hideout
ROOMS.mafia = { ...ROOMS.hideout, wall: 0x2a1a12, props: [...ROOMS.hideout.props, ['plant', 6.2, 6.2]] };

// ---------------------------------------------------------------- homes (by housing; spots for the household)
const HOME_SPOTS = (n: number): Path[] => [sit(1.6, 1.4), stand(n - 1.6, 0.9), sit(2.4, 1.4), stand(1, n - 1.5), sit(n - 2, n - 2.2)];
export const HOMES: Record<string, RoomSpec> = {
  home: {
    floor: [0xc9a27a, 0xc09870], wall: 0x9ec6e8, decor: (n) => [...windowsLeft(n), ...posters([0xe8505b, 0xf2b134])],
    props: [['bed', 0.4, 0.4, 0x6aa4d8], ['desk', 3, 0.3], ['computerDesk', 3, 0.3], ['chair', 3.3, 1], ['bookshelf', 5, 0.2], ['rug', 1.5, 2.5, 0x6b8e5a], ['lamp', 0.3, 4.6], ['plant', 4.6, 4.6]],
    spots: HOME_SPOTS(6), backdrop: [0x1e2733, 0x3e4c62], crowd: 0, size: 6,
  },
  apartment: {
    floor: [0xb08a62, 0xa8825a], wall: 0xe8dcc8, decor: (n) => [...windowsLeft(n), ...windowsRight(n)],
    props: [['sofa', 1, 0.4, 0x5b7bd6], ['tv', 1.1, 2.6], ['rug', 0.8, 1.2, 0xc0504d], ['kitchen', 4.2, 0.3], ['fridge', 6.2, 0.2], ['table', 4.5, 2.2], ['chair', 4.3, 3.1], ['bedDouble', 4.6, 4.8, 0xd88aa4], ['plant', 0.3, 6.2]],
    spots: HOME_SPOTS(7), backdrop: [0x1e2733, 0x3e4c62], crowd: 0,
  },
  mansion: {
    floor: [0xf0ece2, 0xe4dfd2], wall: 0xf6efe0, decor: (n) => [...windowsLeft(n, 0xd6ecff), ...windowsRight(n, 0xd6ecff), panel('left', 0, 3, 1.2, 50, 36, 0xd4af37)],
    props: [['rug', 1.5, 1.5, 0x8e2b3e], ['sofa', 1.4, 0.4, 0xf2f2f2], ['sofa', 3.2, 0.4, 0xf2f2f2], ['armchair', 0.4, 2.4, 0x8e2b3e], ['tv', 1.6, 3.6], ['bar', 7.2, 0.3], ['kitchen', 4.6, 0.3], ['bedDouble', 5.6, 5.4, 0xd4af37], ['plant', 0.3, 7.2], ['plant', 7.2, 7.2], ['poolTable', 3.4, 5.6]],
    spots: HOME_SPOTS(8), backdrop: [0x2a2418, 0x5a4c34], crowd: 0, size: 8,
  },
  farmhouse: {
    floor: 'farm_planks_S', wall: ['farm_woodWall_E', 'farm_woodWallWindow_S'],
    props: [['kitchen', 3.6, 0.3], ['table', 3.8, 2.4], ['chair', 3.6, 3.3], ['chair', 4.6, 3.3], ['bedDouble', 0.4, 0.5, 0xc0504d], ['rug', 1, 3.5, 0x8a5a32], ['armchair', 1, 4.6, 0x6b8e5a]],
    pieces: [['farm_sacksCrate_S', 6, 6]],
    spots: HOME_SPOTS(7), backdrop: [0x1e2733, 0x3e4c62], crowd: 0,
  },
};

/** Build a room scene. `household` fills the home's spots. */
export function roomScene(kind: string, spec: RoomSpec, household: Member[] = []): IsoScene {
  const n = spec.size ?? 7;
  const draws: Draw[] = [];
  // floor
  if (typeof spec.floor === 'string') {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) draws.push(piece(spec.floor, c, r, -90));
  } else {
    const [a, b] = spec.floor;
    const tiles: Prim[] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) tiles.push(flat(c, r, 1, 1, (c + r) % 2 ? a : b, 1, 0));
    draws.push(shapes(tiles, 0, 0, -90));
  }
  if (spec.dance) {
    const [u, v, w, d] = spec.dance;
    const glow = [0xff4fd8, 0x4fd8ff, 0xffe066, 0x7cff6b];
    const tiles: Prim[] = [];
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) tiles.push(flat(u + i, v + j, 1, 1, glow[(i + j * 2) % glow.length], 0.55, 0.8));
    draws.push(shapes(tiles, u, v, -80));
  }
  // back walls (behind everything)
  if (Array.isArray(spec.wall)) {
    for (let k = 0; k < n; k++) draws.push(piece(spec.wall[0], 0, k, -60), piece(spec.wall[1], k, 0, -60));
  } else {
    const w = spec.wall;
    draws.push(shapes([panel('left', 0, 0, n, 0, WALL_H, shade(w, 0.9)), panel('right', 0, 0, n, 0, WALL_H, w), ...(spec.decor?.(n) ?? [])], 0, 0, -70));
  }
  if (Array.isArray(spec.wall) && spec.decor) draws.push(shapes(spec.decor(n), 0, 0, -55));
  for (const [id, u, v, c] of spec.props) draws.push(shapes(PIECES[id](u, v, c), u + 0.4, v + 0.4, 30));
  for (const [f, c, r] of spec.pieces ?? []) draws.push(piece(f, c, r, 28));
  const disco = spec.disco ? { u: n / 2, v: n / 2, z: WALL_H + 10 } : undefined;
  if (disco) draws.push(shapes(discoBall(disco.u, disco.v, disco.z), disco.u, disco.v, 900));
  // the household takes the home's spots (the rest of the spots are for the crowd)
  const paths = [...spec.spots];
  const members = household.slice(0, paths.length);
  return { kind, cols: n, rows: n, draws, paths, lamps: [], windows: [], view: ROOM_VIEW, backdrop: spec.backdrop, crowd: spec.crowd, disco, ...(members.length ? { household: members } : {}) };
}
