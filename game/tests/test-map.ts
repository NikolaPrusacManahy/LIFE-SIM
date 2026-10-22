// Update 0.13 — the city map: every place has a spot, nothing overlaps or sits on a road, locked places can't be
// entered, your company's tower grows with it; item icons exist for every mapped item.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { check, done } from './harness';
import { LOCATIONS } from '../src/state/data/locations';
import { cityMapScene, type MapPlace } from '../src/fx/iso/cityMap';
import { ITEM_ICON } from '../src/ui/itemIcon';
import { ITEM_BY_ID } from '../src/state/inventory/items';

const placesFor = (region: 'city' | 'country', open = true): MapPlace[] =>
  LOCATIONS.filter((l) => (!l.region || l.region === region) && l.id !== 'onrun').map((l) => ({ id: l.id, icon: l.icon, name: l.id, open }));

for (const region of ['city', 'country'] as const) {
  const places = placesFor(region);
  const { scene, pins } = cityMapScene(region, 'summer', places);
  check(`${region}: every place has a pin on the map`, places.every((p) => pins.some((q) => q.id === p.id)), places.filter((p) => !pins.some((q) => q.id === p.id)).map((p) => p.id).join(', '));
  const cells = pins.map((p) => `${p.cell.c},${p.cell.r}`);
  check(`${region}: no two places share a spot`, new Set(cells).size === cells.length);
  const roadCells = new Set(scene.draws.filter((d) => d.cell && (d.frame === 'city_086' || d.frame === 'city_089' || d.frame === 'land_082' || d.frame === 'land_090')).map((d) => `${d.cell!.c},${d.cell!.r}`));
  // (the airport's runway is drawn with road tiles: it's the airport itself, not a street)
  check(`${region}: no place sits on a road`, pins.filter((p) => p.id !== 'airport').every((p) => !roadCells.has(`${p.cell.c},${p.cell.r}`)));
  check(`${region}: cars drive the map's roads`, scene.paths.filter((p) => p.kind === 'car').length >= 2);
}

{
  const locked = placesFor('city').map((p) => ({ ...p, open: p.id === 'home' }));
  const { pins } = cityMapScene('city', 'summer', locked);
  check('locked places stay locked on the map (only open ones can be clicked)', pins.filter((p) => p.open).map((p) => p.id).join() === 'home');
}

{
  const tower = (tier: 'room' | 'office' | 'hq' | 'skyscraper') => cityMapScene('city', 'summer', placesFor('city'), { startup: { name: 'Co', tier } }).pins.find((p) => p.id === 'startup');
  check('a company still in your room is not on the map', !tower('room'));
  const o = tower('office')!;
  const h = tower('hq')!;
  const s = tower('skyscraper')!;
  check('your company grows on the map: office < HQ < skyscraper', o.y > h.y && h.y > s.y);
  const car = cityMapScene('city', 'summer', placesFor('city'), { car: true }).scene.draws.some((d) => d.frame.startsWith('car_'));
  const none = cityMapScene('city', 'summer', placesFor('city')).scene.draws.some((d) => d.frame.startsWith('car_'));
  check('your car is parked at home only if you own one', car && !none);
}

{
  const missing = Object.entries(ITEM_ICON).filter(([id, n]) => !ITEM_BY_ID[id] || !existsSync(new URL(`../public/items/item_${n}.webp`, import.meta.url)));
  check('every mapped item exists and has its icon file', missing.length === 0, missing.map(([id]) => id).join(', '));
}

{
  // regression (map → black screen): app.destroy(true) also releases Pixi's GLOBAL pools, breaking every other canvas
  const bad: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f) && /\.destroy\(true/.test(readFileSync(p, 'utf8'))) bad.push(f);
    }
  };
  walk(new URL('../src', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
  check('no Pixi app is destroyed with destroy(true) (it blacks out the other canvases)', bad.length === 0, bad.join(', '));
}

done();
