// Update 0.13 — isometric dioramas: every frame exists in the atlases, buildings stack correctly, cars stay on the
// roads, walkers on sidewalks and paths, the street stays visible, and a place always looks the same.
import { readFileSync } from 'node:fs';
import { check, done } from './harness';
import { FLOOR_H, ROOF_BASE, STYLES, TILES, TILE_BASE, building, rng, toScreen, allFrames, type IsoSeason } from '../src/fx/iso/layout';
import { SCENES, isoScene } from '../src/fx/iso/scenes';
import type { SceneKind } from '../src/state/data/locations';

const frames: Record<string, { w: number; h: number }> = {};
for (const a of ['city', 'buildings', 'land', 'cars', 'foliage', 'interior', 'animals', 'sky', 'items']) {
  const meta = JSON.parse(readFileSync(new URL(`../public/iso/${a}.json`, import.meta.url), 'utf8'));
  for (const [k, v] of Object.entries<{ frame: { w: number; h: number } }>(meta.frames)) frames[k] = v.frame;
}

const KINDS = Object.keys(SCENES) as SceneKind[];
const SEASONS: IsoSeason[] = ['spring', 'summer', 'autumn', 'winter'];

{
  const missing = new Set<string>();
  for (const k of KINDS) for (const s of SEASONS) for (const f of allFrames(isoScene(k, s))) if (!frames[f]) missing.add(f);
  check(`every frame a scene uses exists in the atlases (all ${KINDS.length} places, all seasons)`, missing.size === 0, [...missing].join(', '));
  for (const car of ['taxi', 'police', 'ambulance', 'garbage']) for (const d of ['NE', 'NW', 'SE', 'SW']) if (!frames[`car_${car}_${d}`]) missing.add(`car_${car}_${d}`);
  check('every car has all four road directions', missing.size === 0, [...missing].join(', '));
}

{
  // the curated building styles really are ground floors (133×127, with a base) and upper floors (99 wide)
  // ground floors: 132–133 wide, 127–130 tall (with signs/awnings); upper floors: 99–100 wide, 85 tall
  const badGround = STYLES.flatMap((s) => s.ground).filter((g) => !(frames[g]?.w >= 132 && frames[g].h >= 127 && frames[g].h <= 130));
  const badFloor = STYLES.flatMap((s) => s.floors).filter((f) => !(frames[f]?.w >= 99 && frames[f].w <= 100 && frames[f].h === 85));
  check('ground floors are ground-floor pieces; upper floors are floor pieces', !badGround.length && !badFloor.length, [...badGround, ...badFloor].join(', '));
  const b = building(2, 3, 0, 3, 'flat', rng(1));
  const p = toScreen(2, 3);
  const groundTop = p.y + TILE_BASE - 126;
  const floors = b.filter((d) => d.ay === 0);
  check('floors stack 36px apart above the ground floor', floors.length === 3 && floors.every((f, i) => f.y === groundTop - FLOOR_H * (i + 1)));
  const roof = b[b.length - 1];
  check('the roof sits on the top floor', roof.y === floors[2].y + ROOF_BASE && roof.z > floors[2].z);
  check('a building draws bottom to top', b.every((d, i) => i === 0 || d.z > b[i - 1].z));
}

{
  for (const kind of ['downtown', 'mainstreet'] as const) {
    const s = isoScene(kind, 'summer');
    const roads = new Set(s.draws.filter((d) => d.cell && (d.frame === TILES.road || d.frame === TILES.cross)).map((d) => `${d.cell!.c},${d.cell!.r}`));
    let off = 0;
    let samples = 0;
    for (const path of s.paths.filter((x) => x.kind === 'car')) {
      const [a, b] = path.points;
      for (let t = 0; t <= 1; t += 0.02) {
        const u = a.u + (b.u - a.u) * t;
        const v = a.v + (b.v - a.v) * t;
        if (u < 0 || v < 0 || u >= s.cols || v >= s.rows) continue;
        samples++;
        if (!roads.has(`${Math.floor(u)},${Math.floor(v)}`)) off++;
      }
    }
    check(`${kind}: cars only ever drive on road tiles`, samples > 50 && off === 0, `${off}/${samples} off-road`);
    // a cell just in front of a road (the road's right/left neighbour on screen) never has upper floors
    const inFront = (c: number, r: number) => roads.has(`${c - 1},${r}`) || roads.has(`${c},${r - 1}`);
    const tall = s.draws.filter((d) => d.ay === 0 && d.cell && !roads.has(`${d.cell.c},${d.cell.r}`) && inFront(d.cell.c, d.cell.r));
    check(`${kind}: the street isn't hidden behind tall buildings`, tall.length === 0, `${tall.length}`);
  }
}

{
  const park = isoScene('park', 'summer');
  const paveAt = new Set(park.draws.filter((d) => d.cell && d.frame === TILES.pavement).map((d) => `${d.cell!.c},${d.cell!.r}`));
  let off = 0;
  for (const path of park.paths) {
    for (let i = 1; i < path.points.length; i++) {
      const a = path.points[i - 1];
      const b = path.points[i];
      for (let t = 0; t <= 1; t += 0.1) {
        const u = a.u + (b.u - a.u) * t;
        const v = a.v + (b.v - a.v) * t;
        if (!paveAt.has(`${Math.floor(u)},${Math.floor(v)}`)) off++;
      }
    }
  }
  check('park walkers stay on the path around the pond', off === 0, `${off} off-path`);
  check('the park has a pond', park.draws.some((d) => d.frame === TILES.water));
}

{
  const a = JSON.stringify(isoScene('downtown', 'summer'));
  const b = JSON.stringify(isoScene('downtown', 'summer'));
  check('a place always looks the same', a === b);
  const w = isoScene('mainstreet', 'winter').draws.map((d) => d.frame);
  const s = isoScene('mainstreet', 'summer').draws.map((d) => d.frame);
  check('trees follow the seasons (snowy in winter)', w.some((f) => ['fol_027', 'fol_028', 'fol_029'].includes(f)) && !s.some((f) => ['fol_027', 'fol_028', 'fol_029'].includes(f)));
  check('downtown has lamps and lit windows for the night', isoScene('downtown', 'summer').lamps.length > 6 && isoScene('downtown', 'summer').windows.length > 6);
}

{
  // every place: something to draw, and every person's path or spot stays inside the scene
  let empty = 0;
  let outside = 0;
  for (const k of KINDS) {
    const sc = isoScene(k, 'summer');
    if (sc.draws.reduce((n, d) => n + (d.prims ? d.prims.length : 1), 0) < 20) empty++;
    for (const p of sc.paths) if (p.kind !== 'car') for (const q of p.points) if (q.u < -0.01 || q.v < -0.01 || q.u > sc.cols + 0.01 || q.v > sc.rows + 0.01) outside++;
  }
  check('every place has a scene', empty === 0, `${empty} empty`);
  check('people walk, sit and dance inside the scene', outside === 0, `${outside} outside`);
  const indoor: SceneKind[] = ['library', 'club', 'bar', 'gym', 'hospital', 'casino', 'church', 'jail', 'school', 'office', 'home', 'apartment', 'mansion', 'farmhouse'];
  check('interiors have a backdrop instead of the sky', indoor.every((k) => !!isoScene(k, 'summer').backdrop));
  check('outdoor places show the sky', (['downtown', 'park', 'farm', 'lake'] as SceneKind[]).every((k) => !isoScene(k, 'summer').backdrop));
  const club = isoScene('club', 'summer');
  check('the club has a disco ball and people dancing', !!club.disco && club.paths.filter((p) => p.kind === 'dance').length >= 6);
  const hh = [{ kind: 'adult' as const, color: 1 }, { kind: 'kid' as const, color: 2 }, { kind: 'pet' as const, color: 3 }];
  const home = isoScene('apartment', 'summer', hh);
  check('your household is at home (spouse, kids, pets take the home spots)', home.household?.length === 3 && home.paths.filter((p) => p.kind !== 'walk' && p.kind !== 'car').length >= 3);
  check('nobody from your household shows up in other places', !isoScene('club', 'summer', hh).household);
  const farmFrames = (season: IsoSeason) => isoScene('farm', season).draws.map((d) => d.frame);
  check("the farm's corn grows with the seasons (none in winter)", farmFrames('spring').includes('farm_cornYoung_S') && farmFrames('summer').includes('farm_corn_S') && !farmFrames('winter').some((f) => f.startsWith('farm_corn')));
}

done();
