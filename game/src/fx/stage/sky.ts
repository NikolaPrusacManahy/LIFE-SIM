import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { GROUND_Y, SKY, W, hexCss, lerp, lerpColor, seeded, type SkyKey } from './palette';
import { glow } from './gfx';
import type { Phase } from '../../state/types';

const SUN_POS: Record<Phase, [number, number]> = {
  morning: [330, 300],
  afternoon: [900, 140],
  evening: [1120, 470],
  night: [1180, 560],
};
const KEYS: (keyof SkyKey)[] = ['top', 'mid', 'horizon', 'haze', 'tint', 'cloud'];

/** Canvas-gradient sky, twinkling stars, shooting stars, sun/moon with soft glow, solid drifting clouds. */
export class Sky {
  readonly view = new Container();
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d')!;
  private tex: Texture;
  private grad: Sprite;
  private starGroups: Graphics[] = [];
  private shooting = new Graphics();
  private shootT = -1;
  private sun = new Container();
  private moon = new Container();
  private clouds = new Container();
  private cur: SkyKey = { ...SKY.afternoon };
  private from: SkyKey = { ...SKY.afternoon };
  private to: SkyKey = { ...SKY.afternoon };
  private t = 1;
  private sunFrom: [number, number] = SUN_POS.afternoon;
  private sunTo: [number, number] = SUN_POS.afternoon;
  private time = 0;
  /** horizontal parallax offset, set by Stage */
  parallax = 0;

  constructor() {
    this.canvas.width = 2;
    this.canvas.height = 256;
    this.tex = Texture.from(this.canvas);
    this.grad = new Sprite(this.tex);
    this.grad.width = W;
    this.grad.height = GROUND_Y + 20;

    const r = seeded(7);
    for (let k = 0; k < 4; k++) {
      const g = new Graphics();
      for (let i = 0; i < 45; i++) {
        const big = r() < 0.08;
        g.circle(r() * W, r() * (GROUND_Y - 160), big ? 1.8 : r() * 1.1 + 0.4).fill({ color: r() < 0.15 ? 0xcfe0ff : 0xffffff, alpha: 0.5 + r() * 0.5 });
      }
      this.starGroups.push(g);
    }

    this.sun.addChild(glow(0, 0, 220, 0xffd27a, 0.35), glow(0, 0, 90, 0xfff0c0, 0.6), new Graphics().circle(0, 0, 32).fill(0xfff6d8));
    const disc = new Graphics().circle(0, 0, 28).fill(0xf4f1ff).circle(11, -7, 24).cut();
    const craters = new Graphics().circle(-12, 4, 4).fill({ color: 0xc9cbe6, alpha: 0.6 }).circle(-6, 14, 2.5).fill({ color: 0xc9cbe6, alpha: 0.6 });
    this.moon.addChild(glow(0, 0, 160, 0x9fb6ff, 0.3), disc, craters);

    for (let i = 0; i < 8; i++) this.clouds.addChild(cloud(r, i));

    this.view.addChild(this.grad, ...this.starGroups, this.shooting, this.moon, this.sun, this.clouds);
    this.paint();
  }

  setPhase(p: Phase, instant = false) {
    this.from = { ...this.cur };
    this.to = { ...SKY[p] };
    this.sunFrom = [this.sun.x, this.sun.y];
    this.sunTo = SUN_POS[p];
    this.t = instant ? 1 : 0;
    this.apply(instant ? 1 : 0);
  }

  get key() { return this.cur; }
  get darkness() { return this.cur.dark; }

  update(dt: number) {
    this.time += dt;
    if (this.t < 1) {
      this.t = Math.min(1, this.t + dt / 1.8);
      this.apply(this.t);
    }
    const night = Math.max(0, this.cur.dark - 0.3) * 1.6;
    this.starGroups.forEach((g, i) => (g.alpha = night * (0.65 + Math.sin(this.time * (1.3 + i * 0.4) + i * 2) * 0.35)));
    for (const c of this.clouds.children) {
      c.x += (c as any).speed * dt;
      if (c.x > W + 260) c.x = -320;
    }
    this.clouds.x = this.parallax * 0.15;
    this.updateShootingStar(dt, night);
  }

  private updateShootingStar(dt: number, night: number) {
    const g = this.shooting;
    if (this.shootT < 0) {
      if (night > 0.6 && Math.random() < dt * 0.06) {
        this.shootT = 0;
        g.position.set(200 + Math.random() * 900, 40 + Math.random() * 160);
      }
      return;
    }
    this.shootT += dt * 1.6;
    const p = this.shootT;
    g.clear();
    if (p >= 1) {
      this.shootT = -1;
      return;
    }
    const x = p * 260;
    const y = p * 110;
    g.moveTo(x - 90, y - 38).lineTo(x, y).stroke({ width: 2, color: 0xffffff, alpha: Math.sin(p * Math.PI) * 0.9 });
    g.circle(x, y, 2).fill({ color: 0xffffff, alpha: Math.sin(p * Math.PI) });
  }

  private apply(t: number) {
    const e = t * t * (3 - 2 * t);
    const next = { ...this.cur };
    for (const k of KEYS) next[k] = lerpColor(this.from[k], this.to[k], e);
    next.dark = lerp(this.from.dark, this.to.dark, e);
    this.cur = next;
    this.sun.position.set(lerp(this.sunFrom[0], this.sunTo[0], e), lerp(this.sunFrom[1], this.sunTo[1], e));
    this.moon.position.set(1060, 130);
    this.sun.alpha = Math.max(0, 1 - this.cur.dark * 1.5);
    this.moon.alpha = Math.max(0, Math.min(1, (this.cur.dark - 0.35) * 2.2));
    this.clouds.tint = this.cur.cloud;
    this.clouds.alpha = 0.95 - this.cur.dark * 0.55;
    this.paint();
  }

  private paint() {
    const c = this.cur;
    const g = this.ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, hexCss(c.top));
    g.addColorStop(0.55, hexCss(c.mid));
    g.addColorStop(1, hexCss(c.horizon));
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, 2, 256);
    this.tex.source.update();
  }
}

/** One solid puffy cloud: overlapping circles drawn opaque, transparency applied to the whole shape. */
function cloud(r: () => number, i: number) {
  const c = new Container();
  const g = new Graphics();
  const w = 140 + r() * 160;
  const puffs = 5 + Math.floor(r() * 3);
  for (let k = 0; k < puffs; k++) {
    const px = (k / (puffs - 1)) * w - w / 2;
    const py = -Math.sin((k / (puffs - 1)) * Math.PI) * (18 + r() * 14);
    g.circle(px, py, 26 + r() * 22);
  }
  g.roundRect(-w / 2 - 20, -10, w + 40, 30, 15);
  g.fill(0xffffff);
  const shadow = new Graphics().roundRect(-w / 2 - 14, 6, w + 28, 14, 7).fill({ color: 0x8090b0, alpha: 0.25 });
  c.addChild(g, shadow);
  c.position.set(r() * W, 70 + (i % 4) * 55 + r() * 30);
  c.scale.set(0.6 + r() * 0.6);
  (c as any).speed = 5 + r() * 9;
  return c;
}

