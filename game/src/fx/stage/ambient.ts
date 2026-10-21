import { Container, Graphics } from 'pixi.js';
import type { Region } from '../../state/types';
import { GROUND_Y, W, type Season } from './palette';
import { glow } from './gfx';
import { carShape } from './scene';
import type { WeatherKind } from './weather';

// Update 0.2 — ambient life: traffic, birds, fireflies, falling leaves.

export interface AmbientConfig {
  roadY: number | null;
  region: Region;
  season: Season;
  weather: WeatherKind;
}

interface Car { body: Graphics; lights: Container; v: number }
interface Bird { g: Graphics; v: number; phase: number; y0: number }
interface Fly { s: ReturnType<typeof glow>; ox: number; oy: number; phase: number }
interface Leaf { g: Graphics; v: number; sway: number; spin: number }

const CAR_COLORS = [0xe63946, 0x457b9d, 0xf4a261, 0x2a9d8f, 0xf1f1f1, 0x6a4c93, 0x1d3557, 0xffb703];

export class Ambient {
  /** tinted with the world (car bodies) */
  readonly traffic = new Container();
  /** untinted lights in front of traffic */
  readonly trafficLights = new Container();
  readonly birds = new Container();
  readonly front = new Container();
  private cars: Car[] = [];
  private flock: Bird[] = [];
  private flies: Fly[] = [];
  private leaves: Leaf[] = [];
  private cfg: AmbientConfig = { roadY: null, region: 'city', season: 'summer', weather: 'clear' };
  private nextCar = 1;
  private nextBirds = 4;
  private t = 0;

  configure(cfg: AmbientConfig) {
    const prev = this.cfg;
    this.cfg = cfg;
    if (prev.roadY !== cfg.roadY) this.clearCars();
    if (prev.season !== cfg.season || prev.region !== cfg.region || !this.front.children.length) this.rebuildFront();
  }

  update(dt: number, dark: number) {
    this.t += dt;
    this.updateCars(dt, dark);
    this.updateBirds(dt, dark);
    for (const f of this.flies) {
      f.s.x = f.ox + Math.sin(this.t * 0.7 + f.phase) * 40;
      f.s.y = f.oy + Math.cos(this.t * 0.9 + f.phase * 1.3) * 18;
      f.s.alpha = Math.max(0, (dark - 0.35) * 1.6) * (0.5 + Math.sin(this.t * 3 + f.phase * 5) * 0.5);
    }
    for (const l of this.leaves) {
      l.g.y += l.v * dt;
      l.g.x += Math.sin(this.t * 1.5 + l.sway) * 30 * dt - 12 * dt;
      l.g.rotation += l.spin * dt;
      if (l.g.y > GROUND_Y + 140) {
        l.g.y = -20;
        l.g.x = Math.random() * W;
      }
    }
  }

  private clearCars() {
    for (const c of this.cars) {
      c.body.destroy();
      c.lights.destroy({ children: true });
    }
    this.cars = [];
  }

  private updateCars(dt: number, dark: number) {
    const roadY = this.cfg.roadY;
    if (roadY !== null) {
      this.nextCar -= dt;
      if (this.nextCar <= 0) {
        this.nextCar = 2.5 + Math.random() * 5;
        this.spawnCar(roadY);
      }
    }
    for (const c of [...this.cars]) {
      c.body.x += c.v * dt;
      c.lights.x = c.body.x;
      c.lights.alpha = Math.min(1, dark * 1.4);
      if (c.body.x < -200 || c.body.x > W + 200) {
        c.body.destroy();
        c.lights.destroy({ children: true });
        this.cars.splice(this.cars.indexOf(c), 1);
      }
    }
  }

  private spawnCar(roadY: number) {
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const y = dir === 1 ? roadY + 34 : roadY - 6;
    const body = new Graphics();
    carShape(body, 0, y, CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)], dir);
    body.x = dir === 1 ? -150 : W + 150;
    const lights = new Container();
    lights.addChild(glow(66 * dir, y - 22, 6, 0xffffff, 0.9), glow(150 * dir, y - 10, 110, 0xfff1c1, 0.22, 26), glow(-64 * dir, y - 22, 10, 0xff3030, 0.8));
    lights.x = body.x;
    // farther lane sits behind the nearer one
    if (dir === -1) {
      this.traffic.addChildAt(body, 0);
      this.trafficLights.addChildAt(lights, 0);
    } else {
      this.traffic.addChild(body);
      this.trafficLights.addChild(lights);
    }
    this.cars.push({ body, lights, v: dir * (170 + Math.random() * 110) });
  }

  private updateBirds(dt: number, dark: number) {
    this.nextBirds -= dt;
    if (this.nextBirds <= 0 && dark < 0.3 && this.cfg.weather === 'clear') {
      this.nextBirds = 10 + Math.random() * 14;
      const n = 3 + Math.floor(Math.random() * 4);
      const y0 = 110 + Math.random() * 160;
      for (let i = 0; i < n; i++) {
        const g = new Graphics();
        g.position.set(-40 - i * 30, y0 + (i % 2) * 14 + i * 4);
        this.birds.addChild(g);
        this.flock.push({ g, v: 70 + Math.random() * 20, phase: Math.random() * 6, y0: g.y });
      }
    }
    for (const b of [...this.flock]) {
      b.g.x += b.v * dt;
      b.g.y = b.y0 + Math.sin(this.t * 0.8 + b.phase) * 6;
      const flap = Math.sin(this.t * 9 + b.phase) * 5;
      b.g.clear().moveTo(-9, -flap).quadraticCurveTo(-4, -2, 0, 0).quadraticCurveTo(4, -2, 9, -flap).stroke({ width: 2, color: 0x2a2a3a });
      if (b.g.x > W + 60) {
        b.g.destroy();
        this.flock.splice(this.flock.indexOf(b), 1);
      }
    }
  }

  private rebuildFront() {
    this.front.removeChildren().forEach((c) => c.destroy());
    this.flies = [];
    this.leaves = [];
    const { region, season } = this.cfg;
    if (region === 'country' && (season === 'summer' || season === 'spring')) {
      for (let i = 0; i < 26; i++) {
        const s = glow(0, 0, 9, 0xd8ff7a, 0);
        const fly = { s, ox: Math.random() * W, oy: GROUND_Y - 20 - Math.random() * 160, phase: Math.random() * 10 };
        this.front.addChild(s);
        this.flies.push(fly);
      }
    }
    if (season === 'autumn') {
      const cols = [0xe07a2c, 0xd9a13b, 0xb5502a, 0xf2b84b];
      for (let i = 0; i < 16; i++) {
        const g = new Graphics().ellipse(0, 0, 6, 3).fill(cols[i % cols.length]);
        g.position.set(Math.random() * W, Math.random() * GROUND_Y);
        this.front.addChild(g);
        this.leaves.push({ g, v: 30 + Math.random() * 40, sway: Math.random() * 6, spin: (Math.random() - 0.5) * 4 });
      }
    }
  }
}
