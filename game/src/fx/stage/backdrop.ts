import { Container, Graphics } from 'pixi.js';
import type { Region } from '../../state/types';
import { FOLIAGE, GRASS, GROUND_Y, W, lerpColor, seeded, type Season } from './palette';
import { LightLayer } from './lights';
import { shade, vgrad } from './gfx';

export interface DepthLayer {
  body: Container;
  lights: LightLayer;
  /** 0 = static, 1 = moves with the foreground */
  depth: number;
}

export interface Backdrop {
  layers: DepthLayer[];
  update: (dt: number, t: number) => void;
}

/** Distant scenery in depth slices, farthest first. Update 0.2 — parallax + atmospheric perspective. */
export function buildBackdrop(region: Region, season: Season): Backdrop {
  return region === 'city' ? skyline(season) : countryside(season);
}

const WIN_COLORS = [0xffd27a, 0xffc66b, 0xffe7a8, 0xa8dcff];

function skyline(season: Season): Backdrop {
  const r = seeded(42);
  const rows = [
    { base: 0x8ea6cc, minH: 180, maxH: 360, y: GROUND_Y - 70, depth: 0.15, win: 0.18 },
    { base: 0x5d7299, minH: 130, maxH: 300, y: GROUND_Y - 40, depth: 0.3, win: 0.3 },
    { base: 0x37476b, minH: 90, maxH: 230, y: GROUND_Y - 14, depth: 0.5, win: 0.42 },
  ];
  const layers: DepthLayer[] = rows.map((row) => {
    const body = new Container();
    const lights = new LightLayer();
    const g = new Graphics();
    let x = -60;
    while (x < W + 60) {
      const w = 46 + r() * 74;
      const h = row.minH + r() * (row.maxH - row.minH);
      const top = row.y - h;
      const c = shade(row.base, (r() - 0.5) * 0.12);
      g.rect(x, top, w, h + 80).fill(vgrad(shade(c, 0.08), shade(c, -0.18)));
      g.rect(x + w - 6, top, 6, h + 80).fill({ color: 0x000000, alpha: 0.12 });
      if (season === 'winter') g.rect(x, top, w, 4).fill({ color: 0xffffff, alpha: 0.75 });
      // rooftop detail
      const roll = r();
      if (roll < 0.18) {
        g.rect(x + w * 0.2, top - 26, w * 0.6, 26).fill(c);
        g.rect(x + w * 0.35, top - 44, w * 0.3, 18).fill(c);
      } else if (roll < 0.32) {
        g.rect(x + w / 2 - 1.5, top - 50, 3, 50).fill(c);
        lights.circle(x + w / 2, top - 50, 2.4, 0xff4d4d);
        lights.halo(x + w / 2, top - 50, 10, 0xff4d4d, 0.5);
      } else if (roll < 0.42) {
        g.rect(x + w * 0.25, top - 22, 18, 16).fill(shade(c, -0.1)).rect(x + w * 0.25 + 4, top - 6, 2, 6).fill(c).rect(x + w * 0.25 + 12, top - 6, 2, 6).fill(c);
      } else if (roll < 0.5) {
        g.poly([x, top, x + w / 2, top - w * 0.5, x + w, top]).fill(c);
      }
      // windows: lit ones go to the light layer of this same depth
      for (let wy = top + 12; wy < row.y + 30; wy += 15) {
        for (let wx = x + 7; wx < x + w - 9; wx += 11) {
          if (r() < row.win) lights.rect(wx, wy, 5, 7, WIN_COLORS[Math.floor(r() * WIN_COLORS.length)], 0.85);
        }
      }
      x += w + 1 + r() * 5;
    }
    body.addChild(g);
    return { body, lights, depth: row.depth };
  });
  return { layers, update: () => {} };
}

function countryside(season: Season): Backdrop {
  const r = seeded(11);
  const [grassLight, grassDark] = GRASS[season];
  const fol = FOLIAGE[season];
  const hill = (yBase: number, amp: number, freq: number, phase: number, top: number, bottom: number) => {
    const g = new Graphics();
    g.moveTo(-40, GROUND_Y + 80);
    for (let x = -40; x <= W + 40; x += 16) g.lineTo(x, yBase + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.7 + phase) * amp * 0.25);
    g.lineTo(W + 40, GROUND_Y + 80).closePath().fill(vgrad(top, bottom));
    return g;
  };
  const treeLine = (g: Graphics, yBase: number, amp: number, freq: number, phase: number, color: number, count: number, size: number) => {
    for (let i = 0; i < count; i++) {
      const x = r() * W;
      const y = yBase + Math.sin(x * freq + phase) * amp;
      const s = size * (0.7 + r() * 0.6);
      if (season === 'winter') g.poly([x, y - s * 2.2, x - s * 0.7, y, x + s * 0.7, y]).fill(color);
      else g.circle(x, y - s, s).fill(color).circle(x - s * 0.7, y - s * 0.4, s * 0.7).fill(color);
    }
  };

  // far hills (hazy)
  const far = new Container();
  const farLights = new LightLayer();
  const farTint = 0x8fa7c4;
  far.addChild(hill(GROUND_Y - 190, 46, 0.0035, 1, lerpColor(grassLight, farTint, 0.7), lerpColor(grassDark, farTint, 0.6)));
  const ft = new Graphics();
  treeLine(ft, GROUND_Y - 190, 46, 0.0035, 1, lerpColor(fol[0], farTint, 0.65), 50, 7);
  far.addChild(ft);

  // mid hills with fields and a farmhouse
  const mid = new Container();
  const midLights = new LightLayer();
  mid.addChild(hill(GROUND_Y - 110, 34, 0.005, 3, lerpColor(grassLight, farTint, 0.3), lerpColor(grassDark, farTint, 0.25)));
  const fields = new Graphics();
  const fieldColors = season === 'winter' ? [0xe6edf4, 0xdbe3ec] : season === 'autumn' ? [0xd9a94c, 0xb88a3a] : [0x9fc45a, 0x7aa848, 0xc9b85a];
  for (let i = 0; i < 7; i++) {
    const fx = 120 + i * 190 + r() * 40;
    const fy = GROUND_Y - 100 + Math.sin(fx * 0.005 + 3) * 34;
    fields.poly([fx - 70, fy + 14, fx + 50, fy + 8, fx + 80, fy + 34, fx - 50, fy + 42]).fill({ color: fieldColors[i % fieldColors.length], alpha: 0.85 });
  }
  mid.addChild(fields);
  const mt = new Graphics();
  treeLine(mt, GROUND_Y - 108, 34, 0.005, 3, lerpColor(fol[0], farTint, 0.3), 26, 11);
  mid.addChild(mt);
  const house = new Graphics();
  const hx = 1130, hy = GROUND_Y - 118;
  house.rect(hx, hy, 58, 36).fill(0xb24a3e).poly([hx - 6, hy, hx + 29, hy - 24, hx + 64, hy]).fill(0x5a2b25).rect(hx + 64, hy + 8, 30, 28).fill(0xf0e6d6).poly([hx + 62, hy + 8, hx + 79, hy - 6, hx + 96, hy + 8]).fill(0x6b4a3a);
  midLights.rect(hx + 10, hy + 12, 9, 9, 0xffd27a);
  midLights.rect(hx + 36, hy + 12, 9, 9, 0xffd27a);
  midLights.halo(hx + 30, hy + 16, 46, 0xffc66b, 0.35);
  // windmill
  const mill = new Graphics();
  const mx = 300, my = GROUND_Y - 120;
  mill.poly([mx - 10, my, mx - 5, my - 110, mx + 5, my - 110, mx + 10, my]).fill(0xe8e2d6);
  const blades = new Graphics();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    blades.poly([0, 0, Math.cos(a - 0.1) * 60, Math.sin(a - 0.1) * 60, Math.cos(a + 0.1) * 60, Math.sin(a + 0.1) * 60]).fill(0xf7f3ea);
  }
  blades.circle(0, 0, 5).fill(0x777777);
  blades.position.set(mx, my - 110);
  mid.addChild(house, mill, blades);

  return {
    layers: [
      { body: far, lights: farLights, depth: 0.15 },
      { body: mid, lights: midLights, depth: 0.32 },
    ],
    update: (dt) => (blades.rotation += dt * 0.5),
  };
}
