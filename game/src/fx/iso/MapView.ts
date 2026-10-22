import { Application, Container, Graphics, Text } from 'pixi.js';
import { cityMapScene, MAP_SIZE, type MapExtras, type MapPin, type MapPlace } from './cityMap';
import { renderIso, preloadIso } from './IsoView';
import { toScreen, type IsoSeason } from './layout-core';

// Update 0.13 — the city map window: the town drawn with the isometric engine (traffic included) and a pin over
// every place. Open places are clickable; places you can't go to yet are greyed out with a lock.

export interface MapCallbacks {
  onPick: (id: string) => void;
  onHover: (pin: MapPin | null) => void;
}

export const MAP_W = 1000;
export const MAP_H = 560;

export class CityMapView {
  private app = new Application();
  private dead = false;
  private tick: ((dt: number) => void) | null = null;

  async init(host: HTMLElement, region: 'city' | 'country', season: IsoSeason, places: MapPlace[], extras: MapExtras, cb: MapCallbacks) {
    await preloadIso();
    await this.app.init({ width: MAP_W, height: MAP_H, backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
    if (this.dead) {
      this.app.destroy({ removeView: true });
      return;
    }
    host.appendChild(this.app.canvas);
    const { scene, pins } = cityMapScene(region, season, places, extras);
    const scale = 0.5;
    const centre = toScreen(MAP_SIZE / 2, MAP_SIZE / 2);
    const at = { x: MAP_W / 2 - centre.x * scale, y: MAP_H / 2 + 40 - centre.y * scale, scale };
    const built = renderIso(scene, season, false, {}, at);
    this.app.stage.addChild(built.body);
    // pins above the buildings
    const layer = new Container();
    for (const p of pins) layer.addChild(pin(p, at, cb));
    this.app.stage.addChild(layer);
    let t = 0;
    this.tick = (dt) => {
      t += dt;
      built.update(dt, t);
      layer.children.forEach((c, i) => (c.y = (c as any).baseY + Math.sin(t * 2 + i) * 2.5));
    };
    this.app.ticker.add((tk) => this.tick?.(Math.min(0.05, tk.deltaMS / 1000)));
  }

  destroy() {
    this.dead = true;
    this.tick = null;
    try {
      this.app.destroy({ removeView: true }, { children: true }); // not `true`: that also releases Pixi's global pools and blacks out the other canvases
    } catch {
      /* not initialised yet */
    }
  }
}

function pin(p: MapPin, at: { x: number; y: number; scale: number }, cb: MapCallbacks): Container {
  const c = new Container();
  const x = at.x + p.x * at.scale;
  const y = at.y + p.y * at.scale;
  c.position.set(x, y);
  (c as any).baseY = y;
  const g = new Graphics();
  const col = p.id === 'startup' ? 0xffd166 : p.open ? 0xffffff : 0x9aa0aa;
  g.poly([-5, -4, 5, -4, 0, 4]).fill(col);
  g.circle(0, -18, 15).fill(col).stroke({ width: 2, color: p.open ? 0x8e6bd8 : 0x6a707a });
  const icon = new Text({ text: p.open || p.id === 'startup' ? p.icon : '🔒', style: { fontSize: 16 } });
  icon.anchor.set(0.5);
  icon.position.set(0, -18);
  icon.alpha = p.open || p.id === 'startup' ? 1 : 0.7;
  c.addChild(g, icon);
  c.eventMode = 'static';
  c.cursor = p.open || p.id === 'startup' ? 'pointer' : 'default';
  c.on('pointerover', () => {
    c.scale.set(1.15);
    cb.onHover(p);
  });
  c.on('pointerout', () => {
    c.scale.set(1);
    cb.onHover(null);
  });
  c.on('pointertap', () => (p.open || p.id === 'startup') && cb.onPick(p.id));
  return c;
}
