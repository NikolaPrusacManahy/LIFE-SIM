// Update 0.13 — the clickable city map: the whole town (city or countryside) as one isometric map. Areas (park,
// lake, woods, farm, downtown, Main Street, docks, airport) are fixed patches; every other place takes the next free
// lot along a road, nearest the centre first — so places never overlap and new ones appear on their own. Pure.

import { BUSHES, TILES, TREES, building } from './layout';
import { PIECES, flat } from './furniture';
import { depthOf, pickOf, piece, plant, rng, shapes, tile, toScreen, type Draw, type IsoScene, type IsoSeason, type Path } from './layout-core';

export const MAP_SIZE = 14;

export interface MapPlace {
  id: string;
  icon: string;
  name: string;
  /** shown, and clickable */
  open: boolean;
}

export interface MapPin {
  id: string;
  icon: string;
  name: string;
  open: boolean;
  /** screen point above the place (world coordinates) */
  x: number;
  y: number;
  cell: { c: number; r: number };
}

export interface MapExtras {
  /** your company's building tier (room = not on the map) */
  startup?: { name: string; tier: 'room' | 'office' | 'facility' | 'hq' | 'skyscraper' };
  /** a car parked at your home */
  car?: boolean;
}

type Rect = [c: number, r: number, w: number, h: number];
const ROADS: Record<'city' | 'country', { cols: number[]; rows: number[] }> = {
  city: { cols: [4, 9], rows: [4, 9] },
  country: { cols: [6], rows: [7] },
};
const AREAS: Record<'city' | 'country', Record<string, Rect>> = {
  city: { park: [0, 5, 4, 4], downtown: [5, 10, 4, 3], docks: [12, 0, 2, 14], airport: [10, 11, 2, 3] },
  country: { lake: [0, 0, 5, 5], woods: [0, 9, 5, 5], farm: [9, 9, 5, 5], mainstreet: [7, 5, 4, 2], backroads: [7, 0, 5, 3] },
};
const FLOORS: Record<string, number> = { hospital: 3, work: 3, campus: 2, casino: 2, college: 1, library: 1, police: 1, school: 1, club: 1, rehab: 1 };
const CIVIC = ['school', 'campus', 'college', 'library', 'police', 'church', 'hospital', 'clinic', 'rehab', 'base', 'station', 'jail'];
const TIER_FLOORS = { room: -1, office: 1, facility: 2, hq: 4, skyscraper: 8 };

const inRect = (c: number, r: number, [x, y, w, h]: Rect) => c >= x && c < x + w && r >= y && r < y + h;

export function cityMapScene(region: 'city' | 'country', season: IsoSeason, places: MapPlace[], extras: MapExtras = {}): { scene: IsoScene; pins: MapPin[] } {
  const rand = rng(region === 'city' ? 1301 : 1307);
  const N = MAP_SIZE;
  const roads = ROADS[region];
  const areas = AREAS[region];
  const isRoad = (c: number, r: number) => roads.cols.includes(c) || roads.rows.includes(r);
  const areaAt = (c: number, r: number) => Object.entries(areas).find(([, rect]) => inRect(c, r, rect))?.[0];
  const draws: Draw[] = [];
  const pins: MapPin[] = [];
  const used = new Set<string>();
  const key = (c: number, r: number) => `${c},${r}`;
  const country = region === 'country';

  // roads
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (!isRoad(c, r)) continue;
    used.add(key(c, r));
    const both = roads.cols.includes(c) && roads.rows.includes(r);
    if (country) draws.push(tile(both ? 'land_090' : 'land_082', c, r, !both && roads.rows.includes(r)));
    else draws.push(tile(both ? TILES.cross : TILES.road, c, r, !both && roads.rows.includes(r)));
  }

  // areas
  const pinAt = (p: MapPlace, c: number, r: number, lift: number) => {
    const s = toScreen(c + 0.5, r + 0.5);
    pins.push({ id: p.id, icon: p.icon, name: p.name, open: p.open, x: s.x, y: s.y - lift, cell: { c, r } });
  };
  for (const [id, rect] of Object.entries(areas)) {
    const [x, y, w, h] = rect;
    for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) {
      if (used.has(key(c, r))) continue;
      used.add(key(c, r));
      draws.push(...areaCell(id, c, r, season, rand));
    }
    const p = places.find((q) => q.id === id);
    if (p) pinAt(p, x + Math.floor(w / 2), y + Math.floor(h / 2), id === 'downtown' ? 150 : 60);
  }

  // lots along the roads, nearest the centre first
  const lots: [number, number][] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (used.has(key(c, r)) || areaAt(c, r)) continue;
    const nextToRoad = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => isRoad(c + dc, r + dr));
    if (nextToRoad) lots.push([c, r]);
  }
  lots.sort((a, b) => Math.hypot(a[0] - N / 2, a[1] - N / 2) - Math.hypot(b[0] - N / 2, b[1] - N / 2) || a[0] - b[0] || a[1] - b[1]);
  const placeOn = (c: number, r: number, floors: number, style: number, roof: 'flat' | 'pitched' | 'none') => {
    used.add(key(c, r));
    draws.push(...building(c, r, style, floors, roof, rand));
  };
  for (const p of places) {
    if (areas[p.id]) continue;
    const lot = lots.shift();
    if (!lot) break;
    const [c, r] = lot;
    const floors = FLOORS[p.id] ?? 0;
    if (p.id === 'home') placeOn(c, r, 0, 4, 'pitched');
    else placeOn(c, r, floors, CIVIC.includes(p.id) ? 5 : (p.id.length + c) % 4, country || p.id === 'church' ? 'pitched' : 'flat');
    pinAt(p, c, r, 70 + floors * 36);
    if (p.id === 'home' && extras.car) {
      const s = toScreen(c + 0.85, r + 0.85);
      draws.push({ frame: 'car_red_sedan1_SW', x: s.x, y: s.y, ax: 0.5, ay: 0.75, z: depthOf(c + 0.85, r + 0.85, 46) });
    }
  }
  // your company's tower
  const tier = extras.startup ? TIER_FLOORS[extras.startup.tier] : -1;
  if (extras.startup && tier >= 0) {
    const lot = lots.shift();
    if (lot) {
      const [c, r] = lot;
      placeOn(c, r, tier, 0, 'flat');
      const s = toScreen(c + 0.5, r + 0.5);
      pins.push({ id: 'startup', icon: '🚀', name: extras.startup.name, open: false, x: s.x, y: s.y - 70 - tier * 36, cell: { c, r } });
    }
  }
  // everything else: quiet blocks and greenery
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (used.has(key(c, r))) continue;
    if (country) {
      draws.push(tile(TILES.grass, c, r));
      if (rand() < 0.3) draws.push(plant(pickOf(rand, TREES[season]), c + 0.5, r + 0.5));
    } else if (rand() < 0.35) draws.push(...building(c, r, Math.floor(rand() * 6), Math.floor(rand() * 3), 'none', rand));
    else draws.push(tile(rand() < 0.3 ? TILES.planterTree : TILES.pavement, c, r));
  }

  const paths: Path[] = [];
  for (const c of roads.cols) paths.push(lane(c + 0.68, true, N), lane(c + 0.32, true, N, true));
  for (const r of roads.rows) paths.push(lane(r + 0.32, false, N), lane(r + 0.68, false, N, true));
  return { scene: { kind: `map-${region}`, cols: N, rows: N, draws, paths, lamps: [], windows: [], crowd: 0 }, pins };
}

function lane(at: number, alongV: boolean, n: number, back = false): Path {
  const a = alongV ? { u: at, v: -1 } : { u: -1, v: at };
  const b = alongV ? { u: at, v: n + 1 } : { u: n + 1, v: at };
  return { kind: 'car', loop: false, points: back ? [b, a] : [a, b] };
}

/** One cell of an area patch. */
function areaCell(id: string, c: number, r: number, season: IsoSeason, rand: () => number): Draw[] {
  switch (id) {
    case 'park':
    case 'woods': {
      const out = [tile(TILES.grass, c, r)];
      if (rand() < (id === 'woods' ? 0.75 : 0.35)) out.push(plant(pickOf(rand, TREES[season]), c + 0.5, r + 0.5));
      else if (rand() < 0.3) out.push(plant(pickOf(rand, BUSHES[season]), c + 0.5, r + 0.5, 0.33));
      return out;
    }
    case 'lake':
    case 'docks':
      return id === 'docks' && c === 12 && r % 3 === 1 ? [tile(TILES.water, c, r), piece('farm_planksHigh_S', c, r, 25)] : [tile(TILES.water, c, r)];
    case 'farm': {
      const out = [tile(TILES.grass, c, r), piece('farm_dirtFarmland_S', c, r, 5)];
      const corn = season === 'spring' ? 'farm_cornYoung_S' : season === 'summer' ? 'farm_corn_S' : season === 'autumn' ? 'farm_cornDouble_S' : '';
      if (corn) out.push(piece(corn, c, r, 15));
      return out;
    }
    case 'backroads':
      return [tile(TILES.dirt, c, r), ...(rand() < 0.25 ? [plant(pickOf(rand, TREES[season]), c + 0.5, r + 0.5)] : [])];
    case 'downtown':
      return building(c, r, Math.floor(rand() * 6), 2 + Math.floor(rand() * 4), 'flat', rand);
    case 'mainstreet':
      return building(c, r, 1 + Math.floor(rand() * 4), rand() < 0.4 ? 1 : 0, 'pitched', rand);
    case 'airport': {
      const out = [tile(TILES.road, c, r, true)];
      if (c === 10 && r === 12) out.push(shapes([flat(c, r + 0.4, 2, 0.2, 0xffffff, 0.8), ...PIECES.plane(c + 0.7, r - 0.6)], c + 1, r + 1, 50));
      return out;
    }
  }
  return [tile(TILES.pavement, c, r)];
}
