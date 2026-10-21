import { Container, Graphics, Text } from 'pixi.js';
import type { SceneKind } from '../../state/data/locations';
import type { Region } from '../../state/types';
import { FOLIAGE, GRASS, GROUND_Y, SCENE_X, W, seeded, type Season } from './palette';
import { LightLayer } from './lights';
import { shade, vgrad } from './gfx';

// Update 0.2 — 2.5D buildings, framed windows, light pools, wet reflections, richer props.

type Roof = 'flat' | 'gable' | 'dome' | 'steeple' | 'barn';

interface Bld {
  dx: number;
  w: number;
  h: number;
  color: number;
  roof?: Roof;
  roofColor?: number;
  rows?: number;
  cols?: number;
  sign?: string;
  signColor?: number;
  neon?: boolean;
  awning?: number;
  columns?: boolean;
  cross?: boolean;
  door?: number;
  brick?: boolean;
}
type PropKind = 'tree' | 'pine' | 'bench' | 'lamp' | 'fence' | 'car' | 'water' | 'field' | 'hay' | 'flag' | 'box' | 'beams' | 'bus' | 'crane' | 'bush' | 'hydrant' | 'mailbox';
type Prop = [kind: PropKind, dx: number, scale?: number];
type Ground = 'street' | 'grass' | 'dirt' | 'plaza';

interface Recipe {
  b: Bld[];
  props: Prop[];
  ground: Ground;
}

const R: Partial<Record<SceneKind, Recipe>> = {
  home: { b: [{ dx: -70, w: 270, h: 190, color: 0xe2cfb4, roof: 'gable', roofColor: 0x8a4632, rows: 2, cols: 3, door: 0x6b3f2a }], props: [['tree', -300, 1.2], ['bush', 90, 1], ['fence', 120], ['mailbox', 240], ['lamp', 330]], ground: 'grass' },
  farmhouse: { b: [{ dx: -70, w: 290, h: 180, color: 0xf3efe6, roof: 'gable', roofColor: 0x3f5a6b, rows: 2, cols: 3, door: 0x7a4b2a }], props: [['tree', -320, 1.3], ['fence', 130], ['hay', 280], ['bush', 80]], ground: 'grass' },
  apartment: { b: [{ dx: -80, w: 250, h: 380, color: 0x9a6f5e, rows: 8, cols: 4, door: 0x2e2e3a, brick: true }], props: [['lamp', 120], ['hydrant', 200], ['car', 300]], ground: 'street' },
  mansion: { b: [{ dx: -80, w: 440, h: 240, color: 0xf3ede2, roof: 'flat', rows: 2, cols: 6, columns: true, door: 0x3b2b1f }], props: [['tree', -380, 1.4], ['bush', -200, 1.2], ['bush', 160, 1.2], ['tree', 260, 1.2], ['lamp', 200]], ground: 'grass' },
  homeless: { b: [], props: [['tree', -320, 1.1], ['bench', -60, 1.3], ['box', -180], ['lamp', 60], ['hydrant', 200]], ground: 'plaza' },
  school: { b: [{ dx: -80, w: 420, h: 220, color: 0xc65a3f, roofColor: 0x8a3a28, rows: 2, cols: 6, sign: 'HIGH SCHOOL', signColor: 0xf6e7c6, door: 0x3a2a2a, brick: true }], props: [['tree', -360, 1.2], ['flag', 180], ['bus', 300]], ground: 'plaza' },
  campus: { b: [{ dx: -80, w: 420, h: 250, color: 0xe8decd, roof: 'dome', roofColor: 0x6d8a9c, rows: 2, cols: 5, columns: true, sign: 'STATE UNIVERSITY', signColor: 0x2b3a55 }], props: [['tree', -380, 1.3], ['tree', 230, 1.1], ['lamp', 190]], ground: 'plaza' },
  office: { b: [{ dx: -80, w: 260, h: 460, color: 0x4f7396, rows: 13, cols: 5, sign: 'CORP', signColor: 0x9fd8ff, neon: true }], props: [['lamp', 120], ['car', 280]], ground: 'street' },
  shop: { b: [{ dx: -80, w: 340, h: 180, color: 0xeee8de, rows: 1, cols: 4, awning: 0x2a9d8f, sign: 'MART', signColor: 0x2ec4b6, neon: true }], props: [['lamp', 170], ['car', 290]], ground: 'street' },
  downtown: { b: [{ dx: -300, w: 180, h: 330, color: 0x8a5e52, rows: 9, cols: 3, brick: true }, { dx: -80, w: 220, h: 220, color: 0xbd6447, rows: 3, cols: 3, awning: 0xe76f51, sign: 'CAFÉ', signColor: 0xffd166, neon: true, door: 0x3a2018 }, { dx: 140, w: 170, h: 400, color: 0x5d6f95, rows: 11, cols: 3 }], props: [['lamp', 40], ['hydrant', 250], ['car', 330]], ground: 'street' },
  mainstreet: { b: [{ dx: -270, w: 180, h: 160, color: 0xcfa572, roof: 'flat', rows: 1, cols: 2, awning: 0xb23a48, sign: 'FEED & SEED', signColor: 0xf6e7c1, door: 0x5a3a22 }, { dx: -60, w: 220, h: 150, color: 0xe8d9bb, rows: 1, cols: 3, awning: 0x3d6b8c, sign: 'DINER', signColor: 0xff4d6d, neon: true, door: 0x2a2a2a }], props: [['lamp', 120], ['car', 260], ['tree', 360, 1.1]], ground: 'street' },
  park: { b: [], props: [['water', -180, 1], ['tree', -360, 1.4], ['tree', -110, 1.15], ['bush', -10, 1], ['bench', 60], ['lamp', 150], ['tree', 300, 1.5]], ground: 'grass' },
  gym: { b: [{ dx: -80, w: 320, h: 190, color: 0x3d4250, rows: 1, cols: 4, sign: 'GYM', signColor: 0xff6b35, neon: true, door: 0x15171c }], props: [['lamp', 160], ['car', 290]], ground: 'street' },
  library: { b: [{ dx: -80, w: 340, h: 220, color: 0xdccdaa, roof: 'flat', columns: true, rows: 2, cols: 4, sign: 'PUBLIC LIBRARY', signColor: 0x3b3b3b, door: 0x4a3420 }], props: [['tree', -340, 1.1], ['bush', 150], ['lamp', 200]], ground: 'plaza' },
  hospital: { b: [{ dx: -80, w: 320, h: 330, color: 0xf0f3f6, rows: 7, cols: 5, cross: true, sign: 'HOSPITAL', signColor: 0xe63946, neon: true, door: 0x9fd8ff }], props: [['lamp', 160], ['car', 290]], ground: 'street' },
  club: { b: [{ dx: -80, w: 320, h: 210, color: 0x221a3a, rows: 0, cols: 0, sign: 'NEON PULSE', signColor: 0xff3cac, neon: true, door: 0x05030a }], props: [['beams', -80], ['lamp', 170], ['car', 290]], ground: 'street' },
  bar: { b: [{ dx: -80, w: 280, h: 190, color: 0x553428, rows: 1, cols: 3, sign: 'RUSTY ANCHOR', signColor: 0xffb347, neon: true, door: 0x241510, brick: true }], props: [['lamp', 150], ['car', 280]], ground: 'street' },
  roadhouse: { b: [{ dx: -80, w: 320, h: 170, color: 0x8b5a3c, roof: 'gable', roofColor: 0x4b2e1f, rows: 1, cols: 3, sign: "DUSTY'S", signColor: 0xff9f1c, neon: true, door: 0x2a1a10 }], props: [['fence', -360], ['car', 230], ['lamp', 160]], ground: 'dirt' },
  church: { b: [{ dx: -80, w: 240, h: 220, color: 0xf3efe7, roof: 'steeple', roofColor: 0x5b6475, rows: 2, cols: 2, door: 0x6b3e26 }], props: [['tree', -300, 1.2], ['bush', 90], ['tree', 170, 1.05], ['lamp', 250]], ground: 'grass' },
  farm: { b: [{ dx: -150, w: 240, h: 190, color: 0xb23a2e, roof: 'barn', roofColor: 0x6e231b, rows: 0, cols: 0, door: 0xf2efe6 }], props: [['field', 140], ['hay', -360], ['fence', 110], ['tree', 360, 1.2]], ground: 'grass' },
  woods: { b: [], props: [['pine', -380, 1.5], ['pine', -260, 1.15], ['pine', -120, 1.6], ['bush', -30, 1], ['pine', 40, 1.25], ['pine', 200, 1.7], ['pine', 340, 1.3]], ground: 'grass' },
  lake: { b: [], props: [['water', 0, 3], ['pine', -380, 1.3], ['pine', 330, 1.4], ['tree', -250, 1.1]], ground: 'grass' },
  diner: { b: [{ dx: -80, w: 320, h: 160, color: 0xeae3d7, rows: 1, cols: 4, awning: 0xd62828, sign: 'BURGER BARN', signColor: 0xffd60a, neon: true, door: 0x2a2a2a }], props: [['lamp', 170], ['car', 290]], ground: 'street' },
  police: { b: [{ dx: -80, w: 340, h: 240, color: 0x34466a, rows: 3, cols: 5, sign: 'POLICE', signColor: 0x8ecae6, neon: true, door: 0x1a2236 }], props: [['flag', 180], ['car', 300]], ground: 'street' },
  construction: { b: [{ dx: -80, w: 280, h: 280, color: 0x9aa0a6, rows: 5, cols: 4 }], props: [['crane', -270], ['box', 170], ['fence', 220]], ground: 'dirt' },
  warehouse: { b: [{ dx: -80, w: 400, h: 190, color: 0x6c757d, roof: 'flat', rows: 1, cols: 6, sign: 'LOGIX', signColor: 0xffb703, door: 0x3a3f45 }], props: [['box', 210], ['box', 250], ['lamp', 320]], ground: 'street' },
  garage: { b: [{ dx: -80, w: 300, h: 180, color: 0xb8b8aa, rows: 1, cols: 2, sign: 'TORQUE AUTO', signColor: 0xe63946, door: 0x444444 }], props: [['car', 180], ['lamp', 290]], ground: 'street' },
  studio: { b: [{ dx: -80, w: 380, h: 240, color: 0xf0e6d2, rows: 1, cols: 4, sign: 'SILVER SCREEN', signColor: 0xffd166, neon: true, door: 0x3a2a1a }], props: [['beams', -80], ['car', 290]], ground: 'street' },
  stadium: { b: [{ dx: -80, w: 480, h: 180, color: 0x5c677d, roof: 'dome', roofColor: 0x9aa5b8, rows: 0, cols: 0, sign: 'STADIUM', signColor: 0xffffff, neon: true }], props: [['beams', -220], ['beams', 60], ['flag', 230]], ground: 'plaza' },
  base: { b: [{ dx: -80, w: 340, h: 160, color: 0x6b705c, rows: 1, cols: 5, sign: 'FORT STEEL', signColor: 0xe9edc9, door: 0x3f4234 }], props: [['flag', 170], ['fence', 250], ['fence', -370]], ground: 'dirt' },
  station: { b: [{ dx: -80, w: 380, h: 200, color: 0xa08e7c, roof: 'dome', roofColor: 0x4f6d7a, rows: 1, cols: 5, sign: 'STATION', signColor: 0xffffff, door: 0x2e2e2e, brick: true }], props: [['bus', 290], ['lamp', 190]], ground: 'plaza' },
};

const FALLBACK: Recipe = { b: [{ dx: -80, w: 280, h: 220, color: 0x6c6c7a, rows: 3, cols: 4, door: 0x333333 }], props: [['lamp', 160]], ground: 'street' };

export interface SceneBuild {
  body: Container;
  lights: LightLayer;
  neon: LightLayer;
  /** y of the drivable lane, if this scene has a road */
  roadY: number | null;
  update: (dt: number, t: number) => void;
}

const DEPTH = 26;
const RISE = 0.6;

/** Midground for a location: ground, buildings, props, and their lights. */
export function buildScene(kind: SceneKind, region: Region, season: Season, wet: boolean): SceneBuild {
  const recipe = R[kind] ?? FALLBACK;
  const body = new Container();
  const lights = new LightLayer();
  const neon = new LightLayer();
  const anims: ((dt: number, t: number) => void)[] = [];
  const r = seeded(kind.length * 97 + kind.charCodeAt(0));
  const ctx: Ctx = { lights, neon, season, wet, r, anims, body };

  body.addChild(ground(recipe.ground, region, season, wet));
  for (const b of recipe.b) building(b, ctx);
  for (const p of recipe.props) prop(p, ctx);
  return { body, lights, neon, roadY: recipe.ground === 'street' ? GROUND_Y + 118 : null, update: (dt, t) => anims.forEach((a) => a(dt, t)) };
}

interface Ctx {
  lights: LightLayer;
  neon: LightLayer;
  season: Season;
  wet: boolean;
  r: () => number;
  anims: ((dt: number, t: number) => void)[];
  body: Container;
}

/** Light pool on the ground + a vertical streak reflection when the street is wet. */
function pool(c: Ctx, x: number, color: number, strength = 1) {
  c.lights.halo(x, GROUND_Y + 22, 90 * strength, color, 0.32, 26 * strength);
  if (c.wet) c.lights.halo(x, GROUND_Y + 90, 18 * strength, color, 0.32, 80 * strength);
}

function ground(kind: Ground, region: Region, season: Season, wet: boolean) {
  const g = new Graphics();
  const y = GROUND_Y;
  const snow = season === 'winter';
  if (kind === 'street') {
    g.rect(0, y, W, 44).fill(vgrad(snow ? 0xeef2f6 : 0xb8b6b0, snow ? 0xd6dde6 : 0x9c9a95));
    for (let x = 0; x < W; x += 56) g.rect(x, y, 1.5, 44).fill({ color: 0x000000, alpha: 0.08 });
    g.rect(0, y + 44, W, 8).fill(0x6f6d68);
    g.rect(0, y + 52, W, 230).fill(vgrad(wet ? 0x2a3040 : 0x3a3d45, wet ? 0x161a24 : 0x24262c));
    for (let x = 20; x < W; x += 110) g.roundRect(x, y + 128, 56, 5, 2).fill({ color: 0xf2d16b, alpha: 0.85 });
    if (wet) for (let i = 0; i < 18; i++) g.ellipse(((i * 977) % W) + 20, y + 70 + ((i * 53) % 150), 40 + (i % 3) * 18, 4).fill({ color: 0x8fa3c8, alpha: 0.12 });
    if (snow) g.rect(0, y + 52, W, 6).fill({ color: 0xffffff, alpha: 0.5 });
  } else if (kind === 'plaza') {
    g.rect(0, y, W, 230).fill(vgrad(snow ? 0xeef2f6 : 0xc9c0b0, snow ? 0xd6dde6 : 0xa89e8c));
    for (let x = 0; x < W; x += 64) g.rect(x, y, 1.5, 230).fill({ color: 0x000000, alpha: 0.06 });
    for (let yy = y + 30; yy < y + 230; yy += 34) g.rect(0, yy, W, 1.5).fill({ color: 0x000000, alpha: 0.06 });
    if (wet) g.rect(0, y, W, 230).fill({ color: 0x2a3550, alpha: 0.18 });
  } else {
    const [light, dark] = kind === 'dirt' ? (snow ? [0xe6e0d6, 0xcfc6b8] : [0xb08d63, 0x8a6a45]) : GRASS[season];
    g.rect(0, y, W, 230).fill(vgrad(light, dark));
    if (kind === 'grass' && !snow) {
      for (let i = 0; i < 160; i++) {
        const gx = (i * 613) % W;
        const gy = y + 6 + ((i * 37) % 200);
        g.moveTo(gx, gy).lineTo(gx - 2, gy - 7).moveTo(gx + 3, gy).lineTo(gx + 4, gy - 6).stroke({ width: 1.5, color: shade(dark, -0.15), alpha: 0.5 });
      }
    }
    if (region === 'country' && kind === 'grass') g.poly([SCENE_X + 120, y, SCENE_X + 200, y, SCENE_X + 300, y + 230, SCENE_X + 60, y + 230]).fill(snow ? 0xd8d2c6 : 0xb99a6e);
  }
  // soft contact shade where ground meets the buildings
  g.rect(0, y, W, 6).fill({ color: 0x000000, alpha: 0.12 });
  return g;
}

function building(b: Bld, c: Ctx) {
  const g = new Graphics();
  const { lights, neon, r } = c;
  const x = SCENE_X + b.dx - b.w / 2;
  const top = GROUND_Y - b.h;
  const base = GROUND_Y;
  const side = shade(b.color, -0.32);
  const rc = b.roofColor ?? shade(b.color, -0.45);

  // ground shadow, side face, front face
  g.poly([x + b.w, base, x + b.w + DEPTH + 40, base, x + b.w + DEPTH, base - DEPTH * RISE]).fill({ color: 0x000000, alpha: 0.18 });
  g.poly([x + b.w, top, x + b.w + DEPTH, top - DEPTH * RISE, x + b.w + DEPTH, base - DEPTH * RISE, x + b.w, base]).fill(vgrad(side, shade(side, -0.2)));
  g.rect(x, top, b.w, b.h).fill(vgrad(shade(b.color, 0.06), shade(b.color, -0.14)));
  if (b.brick) {
    for (let yy = top + 8; yy < base; yy += 9) g.rect(x, yy, b.w, 1).fill({ color: 0x000000, alpha: 0.07 });
  }
  // plinth + cornice
  g.rect(x, base - 14, b.w, 14).fill(shade(b.color, -0.25));
  g.rect(x - 4, top, b.w + 8, 9).fill(shade(b.color, 0.15)).rect(x - 4, top + 9, b.w + 8, 3).fill({ color: 0x000000, alpha: 0.15 });

  // roofs
  if (!b.roof || b.roof === 'flat' || b.roof === 'dome') {
    g.poly([x - 4, top, x - 4 + DEPTH, top - DEPTH * RISE, x + b.w + 4 + DEPTH, top - DEPTH * RISE, x + b.w + 4, top]).fill(shade(b.color, 0.22));
  }
  if (b.roof === 'gable') {
    const peak = top - b.h * 0.42;
    g.poly([x + b.w / 2, peak, x + b.w / 2 + DEPTH, peak - DEPTH * RISE, x + b.w + 18 + DEPTH, top - DEPTH * RISE, x + b.w + 18, top]).fill(shade(rc, -0.2));
    g.poly([x - 18, top, x + b.w / 2, peak, x + b.w + 18, top]).fill(vgrad(shade(rc, 0.1), shade(rc, -0.1)));
    g.rect(x + b.w * 0.7, peak + 20, 22, 46).fill(shade(rc, -0.3));
  }
  if (b.roof === 'barn') {
    g.poly([x - 12, top, x + b.w * 0.18, top - 64, x + b.w / 2, top - 96, x + b.w * 0.82, top - 64, x + b.w + 12, top]).fill(vgrad(shade(rc, 0.1), rc));
    g.rect(x + b.w / 2 - 22, top - 60, 44, 40).fill(shade(b.color, -0.1)).rect(x + b.w / 2 - 2, top - 60, 4, 40).fill(0xf2efe6).rect(x + b.w / 2 - 22, top - 42, 44, 4).fill(0xf2efe6);
  }
  if (b.roof === 'dome') {
    g.ellipse(x + b.w / 2 + 8, top - 8, b.w * 0.2, 62).fill(vgrad(shade(rc, 0.25), shade(rc, -0.15)));
    g.rect(x + b.w / 2 + 6, top - 92, 5, 26).fill(rc);
  }
  if (b.roof === 'steeple') {
    const sx = x + b.w / 2;
    g.rect(sx - 30, top - 96, 60, 96).fill(vgrad(shade(b.color, 0.04), shade(b.color, -0.1)));
    g.poly([sx - 38, top - 96, sx, top - 200, sx + 38, top - 96]).fill(vgrad(shade(rc, 0.15), rc));
    g.rect(sx - 2, top - 234, 4, 36).fill(0xd4af37).rect(sx - 12, top - 222, 24, 4).fill(0xd4af37);
    g.roundRect(sx - 12, top - 80, 24, 34, 12).fill(0x2a3550);
    lights.circle(sx, top - 63, 9, 0xffd27a, 0.9);
    lights.halo(sx, top - 63, 40, 0xffc66b, 0.4);
  }
  if (b.columns) for (let cx = x + 20; cx < x + b.w - 12; cx += 48) g.rect(cx, top + 26, 12, b.h - 40).fill(vgrad(0xffffff, 0xd8d0c2)).rect(cx - 3, top + 22, 18, 6).fill(0xf7f2ea);

  // windows
  const rows = b.rows ?? 2;
  const cols = b.cols ?? 3;
  if (rows && cols) {
    const pad = 24;
    const ww = (b.w - pad * 2) / cols;
    const wh = Math.min(38, (b.h - 86) / rows);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const w = ww * 0.62;
        const wx = x + pad + j * ww + (ww - w) / 2;
        const wy = top + 30 + i * (wh + 14);
        if (wy + wh > base - 74 && b.door !== undefined && Math.abs(wx + w / 2 - (x + b.w / 2)) < 40) continue;
        if (wy + wh > base - 18) continue;
        g.rect(wx - 3, wy - 3, w + 6, wh + 6).fill(shade(b.color, 0.18));
        g.rect(wx, wy, w, wh).fill(vgrad(0x2c4466, 0x16223a));
        g.poly([wx + w * 0.15, wy + wh, wx + w * 0.55, wy, wx + w * 0.75, wy, wx + w * 0.35, wy + wh]).fill({ color: 0xffffff, alpha: 0.07 });
        g.rect(wx - 5, wy + wh + 3, w + 10, 4).fill(shade(b.color, -0.2));
        if (r() < 0.65) {
          const lc = r() < 0.85 ? 0xffd27a : 0xa8dcff;
          lights.rect(wx, wy, w, wh, lc, 0.9);
          if (r() < 0.5) lights.rect(wx, wy, w * 0.22, wh, shade(lc, -0.35), 0.9);
          if (r() < 0.35) lights.halo(wx + w / 2, wy + wh / 2, w * 1.1, lc, 0.25);
        }
      }
    }
  }
  if (b.awning !== undefined) {
    const ay = base - 96;
    for (let i = 0; i < 10; i++) g.rect(x + (i * b.w) / 10, ay, b.w / 10, 20).fill(i % 2 ? b.awning : 0xfaf7f0);
    for (let i = 0; i < 10; i++) g.circle(x + (i + 0.5) * (b.w / 10), ay + 20, b.w / 20).fill(i % 2 ? b.awning : 0xfaf7f0);
    g.rect(x, ay + 20, b.w, 6).fill({ color: 0x000000, alpha: 0.12 });
  }
  if (b.door !== undefined) {
    const dx = x + b.w / 2;
    g.rect(dx - 34, base - 6, 68, 6).fill(shade(b.color, -0.35));
    g.roundRect(dx - 26, base - 72, 52, 66, 8).fill(shade(b.color, -0.25));
    g.roundRect(dx - 22, base - 68, 44, 62, 6).fill(vgrad(shade(b.door, 0.1), shade(b.door, -0.2)));
    g.circle(dx + 14, base - 36, 2.5).fill(0xd4af37);
    g.rect(dx - 4, base - 92, 8, 8).fill(0x333333);
    lights.circle(dx, base - 84, 4, 0xfff1c1);
    lights.halo(dx, base - 80, 46, 0xffd27a, 0.45);
    pool(c, dx, 0xffd27a, 0.8);
  }
  if (b.cross) {
    const cx = x + b.w - 50;
    neon.rect(cx - 7, top + 18, 14, 40, 0xff4d5e);
    neon.rect(cx - 20, top + 31, 40, 14, 0xff4d5e);
    neon.halo(cx, top + 38, 60, 0xff4d5e, 0.4);
  }
  if (b.sign) {
    const col = b.signColor ?? 0xffffff;
    const t = new Text({ text: b.sign, style: { fontFamily: 'Fredoka, sans-serif', fontWeight: '600', fontSize: 24, fill: col, letterSpacing: 3 } });
    t.anchor.set(0.5);
    const sy = b.roof === 'steeple' ? top + 18 : b.awning !== undefined ? base - 118 : top - 24;
    t.position.set(x + b.w / 2, sy);
    if (b.neon) {
      const plate = new Graphics().roundRect(t.x - t.width / 2 - 14, sy - 18, t.width + 28, 36, 10).fill({ color: 0x0c0a16, alpha: 0.85 });
      g.addChild(plate);
      neon.halo(t.x, sy, t.width * 0.75, col, 0.45, 34);
      neon.add(t);
      pool(c, t.x, col, 0.9);
    } else {
      const plate = new Graphics().roundRect(t.x - t.width / 2 - 14, sy - 18, t.width + 28, 36, 10).fill(0x23222b);
      t.style.fill = col;
      g.addChild(plate, t);
    }
  }
  c.body.addChild(g);
}

function tree(g: Graphics, x: number, y: number, s: number, season: Season) {
  const [dark, mid, light] = FOLIAGE[season];
  g.poly([x - 8 * s, y, x - 5 * s, y - 80 * s, x + 5 * s, y - 80 * s, x + 8 * s, y]).fill(vgrad(0x7a5638, 0x5a3e28));
  if (season === 'winter') {
    for (const [ax, ay, bx, by] of [[0, -70, -34, -122], [0, -78, 30, -132], [-18, -100, -40, -110], [14, -108, 36, -150]]) {
      g.moveTo(x + ax * s, y + ay * s).lineTo(x + bx * s, y + by * s).stroke({ width: 5 * s, color: 0x6a4a32 });
      g.circle(x + bx * s, y + by * s, 6 * s).fill(0xffffff);
    }
    return;
  }
  const blobs: [number, number, number][] = [[-30, -92, 34], [28, -96, 36], [0, -128, 40], [-18, -150, 26], [22, -146, 24], [0, -84, 30]];
  for (const [bx, by, br] of blobs) g.circle(x + bx * s, y + by * s + 4 * s, br * s).fill(dark);
  for (const [bx, by, br] of blobs) g.circle(x + bx * s - 3 * s, y + by * s - 2 * s, br * s * 0.88).fill(mid);
  for (const [bx, by, br] of blobs.slice(1, 5)) g.circle(x + bx * s - 10 * s, y + by * s - 10 * s, br * s * 0.42).fill({ color: light, alpha: 0.9 });
  g.ellipse(x + 10 * s, y + 2, 46 * s, 8 * s).fill({ color: 0x000000, alpha: 0.15 });
}

function prop([kind, dx, s = 1]: Prop, c: Ctx) {
  const { lights, neon, season, r, anims } = c;
  const x = SCENE_X + dx;
  const y = GROUND_Y + 8;
  const g = new Graphics();
  const fol = FOLIAGE[season];
  switch (kind) {
    case 'tree':
      tree(g, x, y, s, season);
      break;
    case 'pine': {
      g.rect(x - 6 * s, y - 34 * s, 12 * s, 34 * s).fill(0x5a3d2b);
      const pc = season === 'winter' ? 0x3e6655 : 0x2d6a4f;
      for (let i = 0; i < 4; i++) {
        const w = (50 - i * 10) * s, by = y - (26 + i * 36) * s, ty = y - (92 + i * 36) * s;
        g.poly([x - w, by, x, ty, x + w, by]).fill(vgrad(shade(pc, 0.12), shade(pc, -0.18)));
        g.poly([x, ty, x + w, by, x + w * 0.2, by]).fill({ color: 0x000000, alpha: 0.12 });
        if (season === 'winter') g.poly([x - w * 0.5, by - (by - ty) * 0.5, x, ty, x + w * 0.4, by - (by - ty) * 0.55]).fill({ color: 0xffffff, alpha: 0.85 });
      }
      break;
    }
    case 'bush': {
      const [d, m, l] = fol;
      g.circle(x - 18 * s, y - 16 * s, 20 * s).fill(d).circle(x + 14 * s, y - 18 * s, 22 * s).fill(d).circle(x - 2 * s, y - 28 * s, 22 * s).fill(m).circle(x - 8 * s, y - 34 * s, 9 * s).fill(l);
      break;
    }
    case 'bench':
      g.roundRect(x - 44 * s, y - 34 * s, 88 * s, 9 * s, 3).fill(0x9a6532).roundRect(x - 44 * s, y - 56 * s, 88 * s, 8 * s, 3).fill(0x9a6532).roundRect(x - 44 * s, y - 45 * s, 88 * s, 7 * s, 3).fill(0x8a5a2b);
      g.rect(x - 38 * s, y - 34 * s, 5 * s, 34 * s).fill(0x2f2f36).rect(x + 33 * s, y - 34 * s, 5 * s, 34 * s).fill(0x2f2f36);
      break;
    case 'lamp': {
      g.rect(x - 3.5, y - 150, 7, 150).fill(vgrad(0x40404a, 0x24242a)).rect(x - 9, y - 6, 18, 6).fill(0x24242a);
      g.moveTo(x, y - 150).quadraticCurveTo(x, y - 168, x + 22, y - 166).stroke({ width: 5, color: 0x40404a });
      g.roundRect(x + 12, y - 168, 24, 10, 4).fill(0x30303a);
      lights.circle(x + 24, y - 156, 6, 0xfff4cf);
      lights.halo(x + 24, y - 150, 90, 0xffd27a, 0.5);
      pool(c, x + 24, 0xffd27a, 1.1);
      break;
    }
    case 'fence':
      for (let i = 0; i < 7; i++) g.roundRect(x + i * 22, y - 44, 7, 44, 2).fill(0xf6f2ea).poly([x + i * 22, y - 44, x + i * 22 + 3.5, y - 50, x + i * 22 + 7, y - 44]).fill(0xf6f2ea);
      g.rect(x - 4, y - 34, 150, 5).fill(0xe8e2d6).rect(x - 4, y - 16, 150, 5).fill(0xe8e2d6);
      break;
    case 'hydrant':
      g.roundRect(x - 9, y - 30, 18, 30, 4).fill(0xd62828).roundRect(x - 13, y - 22, 26, 6, 3).fill(0xb51f1f).circle(x, y - 32, 7).fill(0xd62828);
      break;
    case 'mailbox':
      g.rect(x - 2, y - 46, 4, 46).fill(0x6b4a32).roundRect(x - 14, y - 64, 28, 20, 8).fill(0x3a6ea5).rect(x + 12, y - 70, 3, 14).fill(0xe63946);
      break;
    case 'car': {
      const col = [0xe63946, 0x457b9d, 0xf4a261, 0x2a9d8f, 0xf1f1f1, 0x6a4c93][Math.floor(r() * 6)];
      const cy = GROUND_Y + 66;
      carShape(g, x, cy, col, 1);
      lights.circle(x + 62, cy - 24, 4, 0xfff1c1);
      lights.halo(x + 66, cy - 24, 26, 0xfff1c1, 0.4);
      lights.circle(x - 62, cy - 24, 3.5, 0xff3b3b);
      break;
    }
    case 'bus':
      g.roundRect(x - 100, y - 82, 200, 72, 14).fill(vgrad(0xf8cf55, 0xe6b032));
      for (let i = 0; i < 5; i++) g.roundRect(x - 86 + i * 36, y - 72, 28, 24, 4).fill(vgrad(0x3a5070, 0x22324a));
      g.rect(x - 100, y - 40, 200, 5).fill(0x2b2b2b);
      g.circle(x - 60, y - 8, 14).fill(0x1b1b1b).circle(x + 60, y - 8, 14).fill(0x1b1b1b).circle(x - 60, y - 8, 6).fill(0x777777).circle(x + 60, y - 8, 6).fill(0x777777);
      lights.circle(x + 96, y - 26, 4, 0xfff1c1);
      break;
    case 'water': {
      const w = 230 * s;
      const water = new Graphics();
      water.ellipse(x, y + 46, w, 40).fill(season === 'winter' ? vgrad(0xe2eef8, 0xbcd4e6) : vgrad(0x5aa0c8, 0x2d6d94));
      water.ellipse(x, y + 46, w, 40).stroke({ width: 4, color: season === 'winter' ? 0xffffff : 0x9a8a6a, alpha: 0.6 });
      const shimmer = new Graphics();
      for (let i = 0; i < 14; i++) shimmer.roundRect(x - w * 0.75 + r() * w * 1.5, y + 28 + r() * 34, 20 + r() * 34, 2.5, 1).fill({ color: 0xffffff, alpha: 0.7 });
      anims.push((_dt, t) => {
        shimmer.alpha = 0.35 + Math.sin(t * 1.8) * 0.25;
        shimmer.x = Math.sin(t * 0.6) * 6;
      });
      lights.halo(x, y + 46, w * 0.6, 0x9fb6ff, 0.12, 20);
      g.addChild(water, shimmer);
      break;
    }
    case 'field':
      for (let i = 0; i < 7; i++) g.rect(x - 20, y + 10 + i * 18, 360, 7).fill(season === 'winter' ? 0xe3e8ee : season === 'autumn' ? 0xd4a24c : 0x7cb342);
      if (season !== 'winter') for (let i = 0; i < 14; i++) g.roundRect(x + i * 24, y - 36, 4, 36, 2).fill(season === 'autumn' ? 0xe0b052 : 0x8bc34a).circle(x + i * 24 + 2, y - 38, 5).fill(season === 'autumn' ? 0xf2c46a : 0x9ccf5a);
      break;
    case 'hay':
      g.roundRect(x - 38, y - 52, 76, 52, 14).fill(vgrad(0xf0cc78, 0xc99a44));
      for (let i = 0; i < 4; i++) g.rect(x - 38, y - 44 + i * 12, 76, 2).fill({ color: 0x8a6a2a, alpha: 0.35 });
      break;
    case 'flag': {
      g.rect(x - 2.5, y - 210, 5, 210).fill(vgrad(0xf0f0f0, 0xa8a8a8)).circle(x, y - 212, 5).fill(0xd4af37);
      const cloth = new Graphics();
      cloth.position.set(x + 2, y - 206);
      g.addChild(cloth);
      anims.push((_dt, t) => {
        cloth.clear();
        const top: number[] = [];
        const bot: number[] = [];
        for (let i = 0; i <= 10; i++) {
          const wave = Math.sin(t * 4 + i * 0.6) * 3.5 * (i / 10);
          top.push(i * 8, wave);
          bot.unshift(i * 8, 44 + wave);
        }
        cloth.poly([...top, ...bot]).fill(0x3a6ea5);
        cloth.rect(0, 0, 30, 20).fill({ color: 0xffffff, alpha: 0.25 });
      });
      break;
    }
    case 'box':
      g.rect(x - 28, y - 48, 56, 48).fill(vgrad(0xc8996a, 0xa27a4c)).rect(x - 28, y - 26, 56, 4).fill({ color: 0x000000, alpha: 0.15 }).poly([x + 28, y - 48, x + 40, y - 56, x + 40, y - 8, x + 28, y]).fill(0x8a6640);
      break;
    case 'crane':
      g.rect(x - 7, y - 380, 14, 380).fill(0xf4a300);
      for (let yy = y - 370; yy < y; yy += 24) g.moveTo(x - 7, yy).lineTo(x + 7, yy + 24).stroke({ width: 2, color: 0xc98600 });
      g.rect(x - 130, y - 380, 290, 12).fill(0xf4a300).rect(x - 140, y - 370, 30, 24).fill(0x666666);
      g.moveTo(x + 110, y - 368).lineTo(x + 110, y - 220).stroke({ width: 2, color: 0x333333 });
      g.rect(x + 100, y - 222, 20, 14).fill(0x9aa0a6);
      neon.circle(x + 156, y - 380, 4, 0xff3b3b);
      neon.halo(x + 156, y - 380, 16, 0xff3b3b, 0.6);
      break;
    case 'beams': {
      const beams = new Container();
      const colors = [0xff3cac, 0x2bd2ff, 0xffe66d];
      colors.forEach((col, i) => {
        const b = new Graphics().poly([0, 0, -36 - i * 18, -560, 36 + i * 18, -560]).fill({ color: col, alpha: 0.1 });
        b.rotation = (i - 1) * 0.35;
        beams.addChild(b);
      });
      beams.position.set(x, GROUND_Y - 150);
      neon.add(beams);
      anims.push((_dt, t) => beams.children.forEach((b, i) => (b.rotation = Math.sin(t * (0.6 + i * 0.25) + i) * 0.55)));
      break;
    }
  }
  c.body.addChild(g);
}

/** Side-view car centred on x with wheels on y. Used by props and traffic. */
export function carShape(g: Graphics, x: number, y: number, col: number, dir: 1 | -1) {
  g.ellipse(x, y + 2, 70, 7).fill({ color: 0x000000, alpha: 0.25 });
  g.roundRect(x - 64, y - 34, 128, 26, 10).fill(vgrad(shade(col, 0.12), shade(col, -0.2)));
  g.poly([x - 40 * dir, y - 32, x - 26 * dir, y - 56, x + 26 * dir, y - 56, x + 44 * dir, y - 32]).fill(shade(col, 0.05));
  g.poly([x - 34 * dir, y - 33, x - 22 * dir, y - 51, x - 2 * dir, y - 51, x - 2 * dir, y - 33]).fill(vgrad(0xb9e2ff, 0x5a8ab0));
  g.poly([x + 4 * dir, y - 33, x + 4 * dir, y - 51, x + 22 * dir, y - 51, x + 36 * dir, y - 33]).fill(vgrad(0xb9e2ff, 0x5a8ab0));
  g.rect(x - 64, y - 22, 128, 2).fill({ color: 0xffffff, alpha: 0.25 });
  for (const wx of [-38, 38]) g.circle(x + wx, y - 8, 12).fill(0x161616).circle(x + wx, y - 8, 5).fill(0x9a9a9a);
}

