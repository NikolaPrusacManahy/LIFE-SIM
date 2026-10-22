// Update 0.13 — isometric dioramas (Kenney isometric city/landscape/buildings packs). Pure: no Pixi, so the
// layouts are testable and tools/iso_preview can draw exactly what the game draws.
//
// Grid: cell (c, r). Its tile's top vertex sits at screen ((c − r)·66, (c + r)·33). Every tile sprite is
// bottom-anchored 98px below that vertex (shorter tiles, e.g. water, simply sit lower). Buildings: a ground
// floor (bottom-anchored like a tile), upper floors stacked 36px apart, then a roof.

import { FLOOR_H, ROOF_BASE, TILE_BASE, depthOf, pickOf, plant, rng, tile, toScreen, type Draw, type IsoScene, type IsoSeason, type Path } from './layout-core';
export * from './layout-core';

// ---------------------------------------------------------------- tiles (frame names in public/iso atlases)
export const TILES = {
  pavement: 'city_072',
  /** a road running along r (c fixed); flip it for a road along c */
  road: 'city_086',
  cross: 'city_089',
  planterTree: 'city_067',
  fountain: 'city_043',
  grass: 'land_067',
  water: 'land_066',
  dirt: 'land_083',
};

/** Building styles: a ground floor and the upper floors that match it (from the Kenney buildings pack). */
export const STYLES: { ground: string[]; floors: string[] }[] = [
  { ground: ['bld_003', 'bld_117', 'bld_124', 'bld_125'], floors: ['bld_015', 'bld_024', 'bld_031', 'bld_007'] },
  { ground: ['bld_001', 'bld_002', 'bld_009', 'bld_010', 'bld_123'], floors: ['bld_016', 'bld_023', 'bld_000'] },
  { ground: ['bld_030', 'bld_036', 'bld_033', 'bld_025'], floors: ['bld_045', 'bld_049', 'bld_052', 'bld_054'] },
  { ground: ['bld_014', 'bld_021'], floors: ['bld_032', 'bld_047', 'bld_043', 'bld_038'] },
  { ground: ['bld_022', 'bld_029'], floors: ['bld_044', 'bld_048', 'bld_051', 'bld_039'] },
  { ground: ['bld_037', 'bld_042', 'bld_085'], floors: ['bld_050', 'bld_053', 'bld_055', 'bld_056'] },
];
export const PITCHED_ROOFS = ['bld_057', 'bld_062', 'bld_065', 'bld_066', 'bld_069', 'bld_070', 'bld_071', 'bld_074', 'bld_076', 'bld_082', 'bld_083', 'bld_090'];
export const FLAT_ROOFS = ['bld_005', 'bld_006', 'bld_013', 'bld_118', 'bld_119', 'bld_120', 'bld_121'];

/** Trees and greenery by season (Kenney foliage pack). */
export const TREES: Record<IsoSeason, string[]> = {
  spring: ['fol_006', 'fol_007', 'fol_008', 'fol_004', 'fol_005'],
  summer: ['fol_006', 'fol_007', 'fol_009', 'fol_010', 'fol_005'],
  autumn: ['fol_012', 'fol_013', 'fol_014', 'fol_015', 'fol_016'],
  winter: ['fol_027', 'fol_028', 'fol_029', 'fol_022', 'fol_023'],
};
export const BUSHES: Record<IsoSeason, string[]> = {
  spring: ['fol_049', 'fol_050', 'fol_001', 'fol_003', 'fol_062'],
  summer: ['fol_049', 'fol_050', 'fol_051', 'fol_018', 'fol_019'],
  autumn: ['fol_049', 'fol_050', 'fol_018'],
  winter: ['fol_053', 'fol_054', 'fol_059'],
};
/** A building on cell (c, r): ground floor, `floors` upper floors, then a roof (or none). */
export function building(c: number, r: number, style: number, floors: number, roof: 'flat' | 'pitched' | 'none', rand: () => number): Draw[] {
  const s = STYLES[style % STYLES.length];
  const p = toScreen(c, r);
  const cell = { c, r };
  const out: Draw[] = [{ frame: pickOf(rand, s.ground), x: p.x, y: p.y + TILE_BASE, ax: 0.5, ay: 1, z: depthOf(c, r, 10), cell }];
  // the ground floor sprite is 127 tall: its top sits 28px above the cell's top vertex
  let top = p.y + TILE_BASE - 126;
  for (let k = 0; k < floors; k++) {
    top -= FLOOR_H;
    out.push({ frame: pickOf(rand, s.floors), x: p.x, y: top, ax: 0.5, ay: 0, z: depthOf(c, r, 11 + k), cell });
  }
  if (roof !== 'none') out.push({ frame: pickOf(rand, roof === 'flat' ? FLAT_ROOFS : PITCHED_ROOFS), x: p.x, y: top + ROOF_BASE, ax: 0.5, ay: 1, z: depthOf(c, r, 30), cell });
  return out;
}

// ---------------------------------------------------------------- the city
type Cell = 'pave' | 'roadR' | 'roadC' | 'cross' | 'grass' | 'water';

interface Plan {
  cols: number;
  rows: number;
  /** columns with a road running along r */
  roadCols: number[];
  /** rows with a road running along c */
  roadRows: number[];
}

function roadGrid(p: Plan): Cell[][] {
  return Array.from({ length: p.rows }, (_, r) =>
    Array.from({ length: p.cols }, (_, c) => {
      const onC = p.roadCols.includes(c);
      const onR = p.roadRows.includes(r);
      return onC && onR ? 'cross' : onC ? 'roadR' : onR ? 'roadC' : 'pave';
    }),
  );
}

/** Car lanes: both directions on every road, right-hand traffic. */
function carPaths(p: Plan): Path[] {
  const out: Path[] = [];
  const LANE = 0.18;
  for (const c of p.roadCols) {
    out.push({ kind: 'car', loop: false, points: [{ u: c + 0.5 + LANE, v: -1 }, { u: c + 0.5 + LANE, v: p.rows + 1 }] });
    out.push({ kind: 'car', loop: false, points: [{ u: c + 0.5 - LANE, v: p.rows + 1 }, { u: c + 0.5 - LANE, v: -1 }] });
  }
  for (const r of p.roadRows) {
    out.push({ kind: 'car', loop: false, points: [{ u: -1, v: r + 0.5 - LANE }, { u: p.cols + 1, v: r + 0.5 - LANE }] });
    out.push({ kind: 'car', loop: false, points: [{ u: p.cols + 1, v: r + 0.5 + LANE }, { u: -1, v: r + 0.5 + LANE }] });
  }
  return out;
}

/** Walkers: the sidewalks on both sides of every road. */
function sidewalkPaths(p: Plan): Path[] {
  const out: Path[] = [];
  const SIDE = 0.42;
  for (const c of p.roadCols) for (const s of [-SIDE, SIDE]) out.push({ kind: 'walk', loop: false, points: [{ u: c + 0.5 + s, v: 0 }, { u: c + 0.5 + s, v: p.rows }] });
  for (const r of p.roadRows) for (const s of [-SIDE, SIDE]) out.push({ kind: 'walk', loop: false, points: [{ u: 0, v: r + 0.5 + s }, { u: p.cols, v: r + 0.5 + s }] });
  return out;
}

function lampsFor(p: Plan): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const c of p.roadCols) for (let r = 0; r < p.rows; r += 2) out.push(toScreen(c + 0.92, r + 0.5));
  for (const r of p.roadRows) for (let c = 1; c < p.cols; c += 2) out.push(toScreen(c + 0.5, r + 0.92));
  return out;
}

export function cityScene(kind: 'downtown' | 'mainstreet', season: IsoSeason, seed = 7): IsoScene {
  const rand = rng(seed);
  const downtown = kind === 'downtown';
  const plan: Plan = downtown ? { cols: 12, rows: 12, roadCols: [3, 8], roadRows: [5] } : { cols: 12, rows: 12, roadCols: [], roadRows: [6] };
  const grid = roadGrid(plan);
  const draws: Draw[] = [];
  const windows: { x: number; y: number }[] = [];
  for (let r = 0; r < plan.rows; r++) {
    for (let c = 0; c < plan.cols; c++) {
      const cell = grid[r][c];
      if (cell === 'roadR') draws.push(tile(TILES.road, c, r));
      else if (cell === 'roadC') draws.push(tile(TILES.road, c, r, true));
      else if (cell === 'cross') draws.push(tile(TILES.cross, c, r));
      else {
        const nearRoad = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dc, dr]) => grid[r + dr]?.[c + dc] && grid[r + dr][c + dc] !== 'pave');
        if (!downtown && !nearRoad) {
          // Main Street: the town thins out into fields and trees
          draws.push(tile(TILES.grass, c, r));
          if (rand() < 0.3) draws.push(plant(pickOf(rand, TREES[season]), c + 0.5, r + 0.5));
          else if (rand() < 0.2) draws.push(plant(pickOf(rand, BUSHES[season]), c + 0.5, r + 0.5, 0.35));
          continue;
        }
        // cells just in front of a road (drawn after it) stay low, so the street and its traffic stay visible
        const inFront = grid[r][c - 1] === 'roadR' || grid[r][c - 1] === 'cross' || grid[r - 1]?.[c] === 'roadC' || grid[r - 1]?.[c] === 'cross';
        if (nearRoad && rand() < (inFront ? 0.45 : downtown ? 0.85 : 0.7)) {
          const floors = inFront ? 0 : downtown ? 1 + Math.floor(rand() * 4) : rand() < 0.3 ? 1 : 0;
          const b = building(c, r, Math.floor(rand() * STYLES.length), floors, downtown ? (rand() < 0.4 ? 'flat' : 'none') : 'pitched', rand);
          draws.push(...b);
          const p = toScreen(c + 0.5, r + 0.5);
          for (let k = 0; k <= floors; k++) if (rand() < 0.5) windows.push({ x: p.x + (rand() - 0.5) * 40, y: p.y - 40 - k * FLOOR_H });
        } else if (rand() < 0.25) draws.push(tile(TILES.planterTree, c, r));
        else if (downtown && rand() < 0.05) draws.push(tile(TILES.fountain, c, r));
        else draws.push(tile(TILES.pavement, c, r));
      }
    }
  }
  return { kind, cols: plan.cols, rows: plan.rows, draws, paths: [...carPaths(plan), ...sidewalkPaths(plan)], lamps: lampsFor(plan), windows };
}

// ---------------------------------------------------------------- the park
export function parkScene(season: IsoSeason, seed = 11): IsoScene {
  const rand = rng(seed);
  const cols = 12;
  const rows = 12;
  const draws: Draw[] = [];
  // a pond in the middle, a path ring around it
  const pond = (c: number, r: number) => c >= 5 && c <= 7 && r >= 4 && r <= 6;
  const path = (c: number, r: number) => (c === 3 || c === 9) && r >= 2 && r <= 8 || (r === 2 || r === 8) && c >= 3 && c <= 9;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pond(c, r)) draws.push(tile(TILES.water, c, r));
      else if (path(c, r)) draws.push(tile(TILES.pavement, c, r));
      else {
        draws.push(tile(TILES.grass, c, r));
        const x = rand();
        if (x < 0.32) draws.push(plant(pickOf(rand, TREES[season]), c + 0.3 + rand() * 0.4, r + 0.3 + rand() * 0.4));
        else if (x < 0.5) draws.push(plant(pickOf(rand, BUSHES[season]), c + 0.5, r + 0.5, 0.33));
      }
    }
  }
  const ring = [{ u: 3.5, v: 2.5 }, { u: 9.5, v: 2.5 }, { u: 9.5, v: 8.5 }, { u: 3.5, v: 8.5 }, { u: 3.5, v: 2.5 }];
  const paths: Path[] = [{ kind: 'walk', loop: true, points: ring }, { kind: 'walk', loop: true, points: [...ring].reverse() }];
  const lamps = [toScreen(3.95, 2.05), toScreen(9.95, 2.05), toScreen(3.95, 8.05), toScreen(9.95, 8.05)];
  return { kind: 'park', cols, rows, draws, paths, lamps, windows: [] };
}

