// Update 0.13 — dump the city map (all places open) for tools/iso_preview.py.
// npx tsx tools/map_dump.ts <city|country> <season> <out.json>
import { writeFileSync } from 'node:fs';
import { LOCATIONS } from '../src/state/data/locations';
import { cityMapScene } from '../src/fx/iso/cityMap';
import type { IsoSeason } from '../src/fx/iso/layout-core';

const [region = 'city', season = 'summer', out = 'map.json'] = process.argv.slice(2);
const places = LOCATIONS.filter((l) => !l.region || l.region === region).map((l) => ({ id: l.id, icon: l.icon, name: l.id, open: true }));
const { scene, pins } = cityMapScene(region as 'city' | 'country', season as IsoSeason, places, { startup: { name: 'Co', tier: 'hq' }, car: true });
writeFileSync(out, JSON.stringify({ ...scene, pins }));
console.log(`wrote ${out}: ${pins.length} pins`);
