import { Application, Container, Graphics, Text } from 'pixi.js';

// Update 0.12 — the gym minigame's gauge: a glowing ring that fills with every correct press and
// loops forever (no combo cap), the key to press in the middle, sparks on every hit.

const W = 420;
const H = 320;
const CX = W / 2;
const CY = 150;
const R = 104;

interface Spark { g: Graphics; vx: number; vy: number; life: number }

export class GymGauge {
  private app = new Application();
  private root = new Container();
  private ring = new Graphics();
  private track = new Graphics();
  private glow = new Graphics();
  private keyText = new Text({ text: '', style: { fontFamily: 'Space Grotesk, sans-serif', fontSize: 64, fontWeight: '700', fill: 0xffffff } });
  private comboText = new Text({ text: '', style: { fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: '800', fill: 0x8fe8ff } });
  private sparks: Spark[] = [];
  private shown = 0;
  private target = 0;
  private pulse = 0;
  private ready = false;
  private dead = false;

  async init(host: HTMLElement) {
    await this.app.init({ width: W, height: H, backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
    if (this.dead) {
      this.app.destroy({ removeView: true });
      return;
    }
    host.appendChild(this.app.canvas);
    this.keyText.anchor.set(0.5);
    this.keyText.position.set(CX, CY - 6);
    this.comboText.anchor.set(0.5);
    this.comboText.position.set(CX, CY + 48);
    this.root.addChild(this.glow, this.track, this.ring, this.keyText, this.comboText);
    this.app.stage.addChild(this.root);
    this.app.ticker.add((t) => this.update(Math.min(0.05, t.deltaMS / 1000)));
    this.ready = true;
  }

  /** presses so far, the key to press, and the presses per full ring */
  set(presses: number, key: string, perRing = 20) {
    this.target = presses / perRing;
    this.keyText.text = key === 'SPACE' ? '␣' : key;
    this.comboText.text = presses ? `×${presses}` : 'GO!';
  }

  hit() {
    this.pulse = 1;
    if (!this.ready) return;
    const a = (this.target % 1) * Math.PI * 2 - Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const g = new Graphics().circle(0, 0, 2 + Math.random() * 3).fill(Math.random() < 0.5 ? 0x8fe8ff : 0xc49bff);
      g.position.set(CX + Math.cos(a) * R, CY + Math.sin(a) * R);
      const s = 80 + Math.random() * 140;
      const d = a + (Math.random() - 0.5) * 1.6;
      this.root.addChild(g);
      this.sparks.push({ g, vx: Math.cos(d) * s, vy: Math.sin(d) * s, life: 0.5 });
    }
  }

  miss() {
    this.pulse = -1;
  }

  private update(dt: number) {
    this.shown += (this.target - this.shown) * Math.min(1, dt * 14);
    this.pulse *= Math.pow(0.02, dt);
    const lap = Math.floor(this.shown);
    const frac = this.shown - lap;
    // every lap the ring changes colour: cyan → violet → pink → gold → …
    const colours = [0x37d6ff, 0x9b6bff, 0xff5ca8, 0xffc04a, 0x5dffa0];
    const c = colours[lap % colours.length];
    const prev = lap ? colours[(lap - 1) % colours.length] : 0x1e2a55;
    const scale = 1 + Math.max(0, this.pulse) * 0.06;
    this.track.clear().circle(CX, CY, R).stroke({ width: 18, color: prev, alpha: lap ? 0.9 : 0.6 });
    this.ring.clear().arc(CX, CY, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2).stroke({ width: 18, color: c, cap: 'round' });
    this.glow.clear().circle(CX, CY, R + 14).stroke({ width: 10, color: this.pulse < -0.05 ? 0xff3b4f : c, alpha: 0.12 + Math.abs(this.pulse) * 0.35 });
    this.root.scale.set(scale);
    this.root.position.set((W - W * scale) / 2, (H - H * scale) / 2);
    this.keyText.style.fill = this.pulse < -0.05 ? 0xff7b8a : 0xffffff;
    for (const s of this.sparks) {
      s.life -= dt;
      s.g.x += s.vx * dt;
      s.g.y += s.vy * dt;
      s.g.alpha = Math.max(0, s.life * 2);
    }
    for (const s of this.sparks.filter((x) => x.life <= 0)) s.g.destroy();
    this.sparks = this.sparks.filter((x) => x.life > 0);
  }

  destroy() {
    this.dead = true;
    if (this.ready) {
      this.app.destroy({ removeView: true }, { children: true }); // not `true`: that also releases Pixi's global pools and blacks out the other canvases
      this.ready = false;
    }
  }
}
