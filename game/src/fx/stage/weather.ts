import { Container, Graphics } from 'pixi.js';
import { GROUND_Y, H, W } from './palette';

export type WeatherKind = 'clear' | 'rain' | 'snow';

interface Drop {
  g: Graphics;
  v: number;
  sway: number;
  floor: number;
}
interface Splash {
  g: Graphics;
  t: number;
}

const WIND = 0.22;

/** Rain streaks with ground splashes, or drifting snow. Update 0.2 — depth-sized drops + splashes. */
export class Weather {
  readonly view = new Container();
  private drops: Drop[] = [];
  private splashes: Splash[] = [];
  private kind: WeatherKind = 'clear';
  private t = 0;

  set(kind: WeatherKind) {
    if (kind === this.kind) return;
    this.kind = kind;
    this.view.removeChildren().forEach((c) => c.destroy());
    this.drops = [];
    this.splashes = [];
    if (kind === 'clear') return;
    const n = kind === 'rain' ? 220 : 150;
    for (let i = 0; i < n; i++) {
      const near = Math.random();
      const g = new Graphics();
      if (kind === 'rain') {
        const len = 10 + near * 18;
        g.moveTo(0, 0).lineTo(-len * WIND, len).stroke({ width: 1 + near, color: 0xc8dcff, alpha: 0.18 + near * 0.32 });
      } else {
        g.circle(0, 0, 1.2 + near * 3).fill({ color: 0xffffff, alpha: 0.55 + near * 0.4 });
      }
      g.position.set(Math.random() * (W + 200), Math.random() * H);
      this.view.addChild(g);
      this.drops.push({
        g,
        v: kind === 'rain' ? 650 + near * 500 : 30 + near * 60,
        sway: Math.random() * 6,
        floor: GROUND_Y + 10 + near * 200,
      });
    }
  }

  update(dt: number) {
    this.t += dt;
    for (const d of this.drops) {
      d.g.y += d.v * dt;
      if (this.kind === 'rain') d.g.x -= d.v * WIND * dt;
      else d.g.x += Math.sin(this.t * 0.8 + d.sway) * 22 * dt;
      if (d.g.y > d.floor) {
        if (this.kind === 'rain' && this.splashes.length < 40 && Math.random() < 0.5) this.splash(d.g.x, d.floor);
        d.g.y = -30 - Math.random() * 60;
        d.g.x = Math.random() * (W + 200);
      }
    }
    for (const s of [...this.splashes]) {
      s.t += dt * 3;
      s.g.scale.set(0.4 + s.t);
      s.g.alpha = Math.max(0, 1 - s.t);
      if (s.t >= 1) {
        s.g.destroy();
        this.splashes.splice(this.splashes.indexOf(s), 1);
      }
    }
  }

  private splash(x: number, y: number) {
    const g = new Graphics().ellipse(0, 0, 7, 2).stroke({ width: 1, color: 0xd8e6ff, alpha: 0.6 });
    g.position.set(x, y);
    this.view.addChild(g);
    this.splashes.push({ g, t: 0 });
  }
}
