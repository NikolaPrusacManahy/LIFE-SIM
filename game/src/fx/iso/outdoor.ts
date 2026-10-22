// Update 0.13 — outdoor dioramas beyond downtown/Main Street/park: campus, lake, docks, woods, back roads, the farm,
// the homeless camp, the alley, a construction site, the station, the stadium and the base. Pure (no Pixi).

import { BUSHES, TILES, TREES, building } from './layout';
import { PIECES, flat, type PieceId } from './furniture';
import { pickOf, piece, plant, rng, shapes, tile, toScreen, type Draw, type IsoScene, type IsoSeason, type Path } from './layout-core';

/** A country road running along r (flip it for along c). */
const COUNTRY_ROAD = 'land_082';
const SAND = 'land_059';

const put = (id: PieceId, u: number, v: number, c?: number, layer = 30): Draw => shapes(PIECES[id](u, v, c), u + 0.5, v + 0.5, layer);
const loop = (pts: [number, number][]): Path => ({ kind: 'walk', loop: true, points: [...pts, pts[0]].map(([u, v]) => ({ u, v })) });
const line = (kind: Path['kind'], a: [number, number], b: [number, number]): Path => ({ kind, loop: false, points: [{ u: a[0], v: a[1] }, { u: b[0], v: b[1] }] });
const spot = (kind: Path['kind'], u: number, v: number): Path => ({ kind, loop: false, points: [{ u, v }] });

function base(kind: string, cols: number, rows: number): IsoScene {
  return { kind, cols, rows, draws: [], paths: [], lamps: [], windows: [] };
}

/** Grass everywhere, with trees and bushes on `wild` cells. */
function greenery(s: IsoScene, season: IsoSeason, rand: () => number, wild: (c: number, r: number) => boolean, density = 0.3) {
  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.cols; c++) {
      if (!wild(c, r)) continue;
      s.draws.push(tile(TILES.grass, c, r));
      const x = rand();
      if (x < density) s.draws.push(plant(pickOf(rand, TREES[season]), c + 0.3 + rand() * 0.4, r + 0.3 + rand() * 0.4));
      else if (x < density + 0.15) s.draws.push(plant(pickOf(rand, BUSHES[season]), c + 0.5, r + 0.5, 0.33));
    }
  }
}

// ---------------------------------------------------------------- campus
export function campusScene(season: IsoSeason, seed = 21): IsoScene {
  const rand = rng(seed);
  const s = base('campus', 12, 12);
  const walk = (c: number, r: number) => c === 5 || c === 6 || r === 5 || r === 6;
  const hall = (c: number, r: number) => (r <= 2 && c >= 1 && c <= 10 && c !== 5 && c !== 6) || (c <= 2 && r >= 1 && r <= 10 && r !== 5 && r !== 6);
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      if (walk(c, r)) s.draws.push(tile(c === 6 && r === 6 ? TILES.fountain : TILES.pavement, c, r));
      else if (hall(c, r)) s.draws.push(...building(c, r, rand() < 0.5 ? 2 : 3, 1 + Math.floor(rand() * 2), 'flat', rand));
    }
  }
  greenery(s, season, rand, (c, r) => !walk(c, r) && !hall(c, r), 0.18);
  s.paths.push(line('walk', [5.3, 0], [5.3, 12]), line('walk', [6.7, 12], [6.7, 0]), line('walk', [0, 5.3], [12, 5.3]), line('walk', [12, 6.7], [0, 6.7]));
  for (const [u, v] of [[4.2, 4.2], [7.8, 7.8], [4.2, 7.8], [7.8, 4.2]]) {
    s.draws.push(put('bench', u, v, 0x8a5a3a));
    s.paths.push(spot('sit', u + 0.45, v + 0.3));
  }
  s.lamps = [toScreen(5, 3), toScreen(7, 3), toScreen(5, 9), toScreen(7, 9), toScreen(3, 5), toScreen(9, 7)];
  s.crowd = 12;
  return s;
}

// ---------------------------------------------------------------- lake & docks
export function lakeScene(season: IsoSeason, seed = 31): IsoScene {
  const rand = rng(seed);
  const s = base('lake', 12, 12);
  const water = (c: number, r: number) => c + r >= 11 && c >= 3 && r >= 3;
  const beach = (c: number, r: number) => !water(c, r) && c + r >= 9 && c >= 2 && r >= 2;
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) {
    if (water(c, r)) s.draws.push(tile(TILES.water, c, r));
    else if (beach(c, r)) s.draws.push(tile(SAND, c, r));
  }
  greenery(s, season, rand, (c, r) => !water(c, r) && !beach(c, r), 0.35);
  // a wooden dock out over the water
  for (let k = 0; k < 4; k++) s.draws.push(piece('farm_planksHigh_S', 6 + k, 5, 25));
  for (let i = 0; i < 4; i++) s.draws.push(put('duck', 8 + rand() * 2.5, 8 + rand() * 2.5));
  if (season !== 'winter') {
    s.draws.push(put('campfire', 3.2, 6.3));
    s.paths.push(spot('sit', 3.9, 6.9), spot('sit', 3.5, 7.2));
  }
  s.paths.push(line('walk', [2.5, 9.5], [9.5, 2.5]), line('walk', [9.3, 2.7], [2.7, 9.3]), spot('stand', 9.7, 5.5));
  s.lamps = [toScreen(6.2, 5.2), toScreen(9.8, 5.2)];
  s.crowd = 6;
  return s;
}

export function docksScene(_season: IsoSeason, seed = 41): IsoScene {
  const rand = rng(seed);
  const s = base('docks', 12, 12);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) {
    if (c >= 7) s.draws.push(tile(TILES.water, c, r));
    else if (c === 3) s.draws.push(tile(TILES.road, c, r));
    else s.draws.push(tile(TILES.pavement, c, r));
  }
  for (const r of [1, 4, 7, 10]) for (let k = 0; k < 3; k++) s.draws.push(piece('farm_planksHigh_S', 7 + k, r, 25));
  for (let i = 0; i < 14; i++) {
    const u = 4.2 + rand() * 2.2;
    const v = 0.5 + rand() * 11;
    s.draws.push(put(rand() < 0.6 ? 'crate' : 'barrel', u, v, rand() < 0.5 ? 0xb5864f : 0x6f8fa8));
  }
  s.draws.push(...building(0, 2, 5, 1, 'flat', rand), ...building(0, 6, 5, 0, 'flat', rand), ...building(1, 9, 3, 1, 'flat', rand));
  s.paths.push(line('car', [3.68, -1], [3.68, 13]), line('car', [3.32, 13], [3.32, -1]), line('walk', [5, 0], [5, 12]), line('walk', [6.3, 12], [6.3, 0]), spot('stand', 8.5, 1.5), spot('stand', 8.6, 7.4));
  s.lamps = [toScreen(4, 2), toScreen(4, 6), toScreen(4, 10)];
  s.crowd = 7;
  return s;
}

// ---------------------------------------------------------------- woods & back roads
export function woodsScene(season: IsoSeason, seed = 51): IsoScene {
  const rand = rng(seed);
  const s = base('woods', 12, 12);
  const trail = (c: number, r: number) => Math.abs(c - r) <= 0 || (c === 6 && r > 3);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) if (trail(c, r)) s.draws.push(tile(TILES.dirt, c, r));
  greenery(s, season, rand, (c, r) => !trail(c, r), 0.62);
  s.draws.push(put('tent', 8, 3, 0x5b8c5a), put('campfire', 7.4, 4.6));
  s.paths.push(line('walk', [0.5, 0.5], [11.5, 11.5]), line('walk', [11.5, 11.4], [0.5, 0.6]), spot('sit', 7.9, 5.1));
  s.crowd = 3;
  return s;
}

export function backroadsScene(season: IsoSeason, seed = 61): IsoScene {
  const rand = rng(seed);
  const s = base('backroads', 12, 12);
  const road = (c: number) => c === 6;
  const field = (c: number, r: number) => c >= 8 && c <= 10 && r >= 2 && r <= 8;
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) {
    if (road(c)) s.draws.push(tile(COUNTRY_ROAD, c, r));
    else if (field(c, r)) s.draws.push(tile(TILES.grass, c, r), piece('farm_dirtFarmland_S', c, r, 5), ...crop(season, c, r));
  }
  greenery(s, season, rand, (c, r) => !road(c) && !field(c, r), 0.28);
  s.paths.push(line('car', [6.68, -1], [6.68, 13]), line('car', [6.32, 13], [6.32, -1]));
  s.crowd = 0;
  return s;
}

// ---------------------------------------------------------------- the farm
/** Corn grows with the seasons: young in spring, tall in summer, double in autumn, bare in winter. */
function crop(season: IsoSeason, c: number, r: number): Draw[] {
  const f = season === 'spring' ? 'farm_cornYoung_S' : season === 'summer' ? 'farm_corn_S' : season === 'autumn' ? 'farm_cornDouble_S' : '';
  return f ? [piece(f, c, r, 15)] : [];
}

export function farmScene(season: IsoSeason, seed = 71): IsoScene {
  const rand = rng(seed);
  const s = base('farm', 12, 12);
  const field = (c: number, r: number) => c >= 6 && c <= 10 && r >= 1 && r <= 5;
  const barn = (c: number, r: number) => c >= 1 && c <= 3 && r >= 1 && r <= 3;
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) {
    if (field(c, r)) s.draws.push(tile(TILES.grass, c, r), piece('farm_dirtFarmland_S', c, r, 5), ...crop(season, c, r));
    else if (barn(c, r)) s.draws.push(tile(TILES.dirt, c, r), piece('farm_planks_S', c, r, 5));
  }
  greenery(s, season, rand, (c, r) => !field(c, r) && !barn(c, r), 0.12);
  // the barn: wood walls all round, a door at the front, hay inside
  for (let k = 1; k <= 3; k++) {
    s.draws.push(piece('farm_woodWall_S', k, 1, 22), piece('farm_woodWall_E', 1, k, 22));
    s.draws.push(piece(k === 2 ? 'farm_woodWallGateOpen_N' : 'farm_woodWallWindow_N', k, 3, 60), piece('farm_woodWall_W', 3, k, 60));
  }
  s.draws.push(piece('farm_hayBalesStacked_S', 2, 2, 35));
  // the pen: fences, animals
  for (let k = 1; k <= 4; k++) s.draws.push(piece('farm_fenceLow_S', k, 6, 22), piece('farm_fenceLow_N', k, 9, 60));
  for (let k = 6; k <= 9; k++) s.draws.push(piece('farm_fenceLow_E', 1, k, 22), piece('farm_fenceLow_W', 4, k, 60));
  const animals: PieceId[] = ['cow', 'cow', 'pig', 'pig', 'chicken', 'chicken', 'chicken', 'horse'];
  for (const a of animals) s.draws.push(put(a, 1.4 + rand() * 2.6, 6.4 + rand() * 2.8));
  s.draws.push(put('hay', 5, 3.2), piece('farm_sacksCrate_S', 5, 0, 30));
  s.paths.push(line('walk', [5.2, 0.5], [5.2, 11]), line('walk', [5.6, 11], [5.6, 0.5]), spot('stand', 8.5, 6.6));
  s.lamps = [toScreen(2, 4), toScreen(5, 1)];
  s.crowd = 3;
  return s;
}

// ---------------------------------------------------------------- the rough side of town
export function homelessScene(season: IsoSeason, seed = 81): IsoScene {
  const rand = rng(seed);
  const s = base('homeless', 12, 12);
  const under = (c: number, r: number) => r >= 4 && r <= 7;
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) if (under(c, r)) s.draws.push(tile(r === 5 || r === 6 ? TILES.road : TILES.pavement, c, r, true));
  greenery(s, season, rand, (c, r) => !under(c, r), 0.15);
  s.draws.push(put('tent', 3, 8.2, 0x7a6a4a), put('tent', 5.2, 8.6, 0x4a6a7a), put('campfire', 4.4, 9.6), put('cart', 6.6, 8.3), put('dumpster', 8, 8.2));
  s.paths.push(line('car', [-1, 5.32], [13, 5.32]), line('car', [13, 6.68], [-1, 6.68]), spot('sit', 4.2, 10.2), spot('stand', 7.2, 9.4), line('walk', [0, 4.2], [12, 4.2]));
  s.lamps = [toScreen(2, 4.1), toScreen(8, 4.1)];
  s.crowd = 4;
  return s;
}

export function alleyScene(_season: IsoSeason, seed = 91): IsoScene {
  const rand = rng(seed);
  const s = base('alley', 12, 12);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) {
    const lane = c === 5 || c === 6;
    // brick walls right along the lane, low backyards behind them
    if (lane) s.draws.push(tile(TILES.pavement, c, r));
    else if (c === 4 || c === 7) s.draws.push(...building(c, r, c < 5 ? 2 : 5, c === 4 ? 1 + Math.floor(rand() * 3) : 0, 'none', rand));
    else s.draws.push(tile(rand() < 0.15 ? TILES.planterTree : TILES.pavement, c, r));
  }
  for (let i = 0; i < 6; i++) s.draws.push(put(rand() < 0.5 ? 'dumpster' : 'barrel', 5.1 + rand() * 1.2, 1 + i * 1.8, 0x2f6b4f));
  s.paths.push(line('walk', [5.5, 0], [5.5, 12]), spot('stand', 6.4, 3.5), spot('stand', 6.4, 8.5));
  s.lamps = [toScreen(6.9, 2), toScreen(6.9, 7), toScreen(6.9, 11)];
  s.crowd = 3;
  return s;
}

export function constructionScene(_season: IsoSeason, seed = 101): IsoScene {
  const rand = rng(seed);
  const s = base('construction', 12, 12);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) s.draws.push(tile(r === 9 ? TILES.road : TILES.dirt, c, r, r === 9));
  // half-built: floors but no roofs
  for (const [c, r, f] of [[2, 2, 3], [3, 2, 2], [6, 3, 4], [7, 3, 1]] as const) s.draws.push(...building(c, r, 5, f, 'none', rand));
  for (let i = 0; i < 10; i++) s.draws.push(put(rand() < 0.5 ? 'cone' : 'crate', 1 + rand() * 9, 5 + rand() * 3, 0xb5864f));
  s.draws.push(put('toolbox', 4.5, 6), put('barrel', 9.5, 2));
  s.paths.push(line('walk', [1, 6], [10, 6]), line('walk', [10, 7.5], [1, 7.5]), line('car', [-1, 9.32], [13, 9.32]), spot('stand', 5, 4.6));
  s.crowd = 6;
  return s;
}

export function stationScene(_season: IsoSeason, seed = 111): IsoScene {
  const rand = rng(seed);
  const s = base('station', 12, 12);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) s.draws.push(tile(c === 7 ? TILES.road : TILES.pavement, c, r));
  s.draws.push(put('trainCar', 7, 1.2), put('trainCar', 7, 5.6));
  for (let k = 0; k < 4; k++) {
    s.draws.push(put('bench', 5.3, 1.5 + k * 2.6, 0x3b3f4c));
    s.paths.push(spot('sit', 5.75, 1.8 + k * 2.6));
  }
  s.draws.push(...building(1, 1, 5, 1, 'flat', rand), ...building(1, 2, 5, 1, 'flat', rand));
  s.paths.push(line('walk', [4.6, 0], [4.6, 12]), line('walk', [6.3, 12], [6.3, 0]), spot('stand', 6.2, 4.5), spot('stand', 6.1, 9.2));
  s.lamps = [toScreen(6.5, 2), toScreen(6.5, 6), toScreen(6.5, 10)];
  s.crowd = 10;
  return s;
}

export function stadiumScene(_season: IsoSeason): IsoScene {
  const s = base('stadium', 12, 12);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) s.draws.push(tile(TILES.grass, c, r));
  s.draws.push(shapes([flat(2, 2, 8, 8, 0x5fae4f), flat(2, 5.95, 8, 0.1, 0xffffff), flat(5.6, 5.6, 0.8, 0.8, 0xffffff, 0.35)], 6, 6, -50));
  s.draws.push(put('stands', 0, 2), put('standsR', 2, 0));
  s.paths.push(loop([[3, 3], [9, 4], [8, 9], [3.5, 8]]), loop([[8, 3], [4, 6], [8.5, 8.5]]));
  s.lamps = [toScreen(1, 1), toScreen(11, 1), toScreen(1, 11)];
  s.crowd = 10;
  return s;
}

export function baseScene(season: IsoSeason, seed = 121): IsoScene {
  const rand = rng(seed);
  const s = base('base', 12, 12);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) s.draws.push(tile(c >= 2 && c <= 9 && r >= 2 && r <= 9 ? TILES.dirt : TILES.grass, c, r));
  for (let k = 2; k <= 9; k++) s.draws.push(piece('farm_fenceHigh_S', k, 2, 22), piece('farm_fenceHigh_E', 2, k, 22));
  for (const [u, v] of [[3, 3], [5, 3], [7, 3], [3, 5.5]]) s.draws.push(put('tent', u, v, 0x5a6b3a));
  for (let i = 0; i < 8; i++) s.draws.push(put('crate', 6 + rand() * 3, 6 + rand() * 3, 0x6b7a4a));
  s.draws.push(...TREES[season].slice(0, 2).map((t, i) => plant(t, 11 - i, 0.5)));
  s.paths.push(loop([[4, 8], [8.5, 8.5], [8.5, 5], [4.5, 7]]), loop([[4.2, 8.2], [4.5, 7.2], [8.3, 5.2], [8.7, 8.7]]));
  s.lamps = [toScreen(2.2, 2.2), toScreen(9.8, 2.2)];
  s.crowd = 8;
  return s;
}

