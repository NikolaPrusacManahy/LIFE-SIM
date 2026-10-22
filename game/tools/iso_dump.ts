// Update 0.13 — dump an isometric scene as JSON for tools/iso_preview.py (a visual check without a browser).
// npx tsx tools/iso_dump.ts <sceneKind> <season> <out.json>
import { writeFileSync } from 'node:fs';
import { isoScene } from '../src/fx/iso/scenes';
import type { SceneKind } from '../src/state/data/locations';
import type { IsoSeason } from '../src/fx/iso/layout-core';

const [kind = 'downtown', season = 'summer', out = 'iso.json'] = process.argv.slice(2);
const hh = kind === 'apartment' || kind === 'home' || kind === 'mansion' || kind === 'farmhouse' ? [{ kind: 'adult' as const, color: 0xe8505b }, { kind: 'kid' as const, color: 0x3a7bd5 }, { kind: 'pet' as const, color: 0xb5864f }] : [];
writeFileSync(out, JSON.stringify(isoScene(kind as SceneKind, season as IsoSeason, hh)));
console.log(`wrote ${out}`);
