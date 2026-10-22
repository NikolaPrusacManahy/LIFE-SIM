import { Application, ColorMatrixFilter, Container, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import type { FxKind, Phase, Region } from '../../state/types';
import type { SceneKind } from '../../state/data/locations';
import { GROUND_Y, H, SCENE_X, W, seasonOf } from './palette';
import { Sky } from './sky';
import { buildBackdrop, type Backdrop } from './backdrop';
import { buildScene, type SceneBuild } from './scene';
import { Avatar, type AvatarLook } from './avatar';
import { Particles } from './particles';
import { Weather, type WeatherKind } from './weather';
import { Ambient } from './ambient';
import { fade } from './gfx';
import { buildIso, isoReady, preloadIso } from '../iso/IsoView';
import type { Member } from '../iso/layout-core';

export interface StageView {
  region: Region;
  scene: SceneKind;
  phase: Phase;
  month: number;
  weather: WeatherKind;
  look: AvatarLook | null;
  /** Update 0.4 — NPC standing beside the player during an encounter/event */
  npc?: AvatarLook | null;
  /** Update 0.5 — greyscale world while incarcerated */
  prison?: boolean;
  /** Update 0.6 — a levelled city: scorched sepia */
  ruins?: boolean;
  /** Update 0.13 — who's home with you (shown in the home scene) */
  household?: Member[];
  /** Update 0.13 — Reduced effects: fewer people, no club lights */
  reduced?: boolean;
  /** Update 0.13 — contacts who are here (clickable) */
  people?: Member[];
  /** Update 0.13 — the classic flat scene (title and character creation) */
  classic?: boolean;
}

const DELTA_COLOR = { up: 0x5be37d, down: 0xff6b7a, money: 0xffcf4a, energy: 0x6fd3ff };
const PARALLAX = 22;

interface DepthGroup {
  view: Container;
  depth: number;
}

/**
 * PixiJS world behind the UI. Pure presentation: it never reads or writes game state.
 * Update 0.2 — depth-correct layer order: every body is followed by its own lights, so nothing glows through what's in front.
 *   sky → birds → [backdrop body+lights]… → haze → [scene body, lights, neon, traffic, avatar] → front ambient → weather → vignette → particles
 */
export class Stage {
  private app = new Application();
  private ready = false;
  private dead = false;
  private root = new Container();
  private sky = new Sky();
  private ambient = new Ambient();
  private backGroups: DepthGroup[] = [];
  private backLayer = new Container();
  private haze = fade(0, GROUND_Y - 280, W, 300, 0xffffff, 0.5);
  private sceneGroup = new Container();
  private sceneBody = new Container();
  private sceneLights = new Container();
  private sceneNeon = new Container();
  private avatar = new Avatar();
  private npcAvatar = new Avatar(true);
  private npcKey = '';
  private scorch = (() => {
    const f = new ColorMatrixFilter();
    f.sepia(false);
    f.brightness(0.75, true);
    return f;
  })();
  private grey = (() => {
    const f = new ColorMatrixFilter();
    f.desaturate();
    return f;
  })();
  private weather = new Weather();
  private vignette: Sprite;
  private particles = new Particles();
  private backdrop: Backdrop | null = null;
  private scene: SceneBuild | null = null;
  private view: StageView | null = null;
  /** Update 0.13 — indoors: no sky tint, no weather */
  private indoor = false;
  /** Update 0.13 — someone you know was clicked on the stage */
  onPick: ((pid: string) => void) | null = null;
  private time = 0;
  private mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  private onMove = (e: PointerEvent) => {
    this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };

  constructor() {
    this.vignette = new Sprite(vignetteTexture());
    this.vignette.width = W;
    this.vignette.height = H;
  }

  async init(host: HTMLElement) {
    // signs and floating text are Pixi Text: wait for webfonts so they don't bake in a fallback face
    await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
    // Update 0.13 — the isometric atlases (a failed load just keeps the old scenes)
    await preloadIso();
    await this.app.init({ width: W, height: H, backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
    if (this.dead) {
      this.app.destroy({ removeView: true });
      return;
    }
    host.appendChild(this.app.canvas);
    this.sceneGroup.addChild(this.sceneBody, this.sceneLights, this.sceneNeon, this.ambient.traffic, this.ambient.trafficLights, this.npcAvatar.view, this.avatar.view);
    this.npcAvatar.view.visible = false;
    this.npcAvatar.place(SCENE_X + 60, GROUND_Y - 8); // Update 0.13 — feet inside the stage window
    this.root.addChild(this.sky.view, this.ambient.birds, this.backLayer, this.haze, this.sceneGroup, this.ambient.front, this.weather.view, this.vignette, this.particles.view);
    this.app.stage.addChild(this.root);
    this.avatar.place(SCENE_X + 210, GROUND_Y - 8);
    this.app.ticker.add((t) => this.update(Math.min(0.05, t.deltaMS / 1000)));
    window.addEventListener('pointermove', this.onMove);
    this.ready = true;
    // Update 0.13 — the Kenney sky art (clouds, sun, moon)
    if (isoReady()) this.sky.useArt(this.view?.month ?? 0);
    if (this.view) {
      const v = this.view;
      this.view = null;
      this.setView(v, true);
    }
  }

  setView(v: StageView, instant = false) {
    if (!this.ready) {
      this.view = v;
      return;
    }
    const prev = this.view;
    this.view = v;
    const season = seasonOf(v.month);
    const prevSeason = prev ? seasonOf(prev.month) : null;
    if (!prev || prev.region !== v.region || prevSeason !== season) this.rebuildBackdrop(v.region, season);
    const sceneChanged = !prev || prev.scene !== v.scene || prev.region !== v.region || prevSeason !== season || (prev.weather === 'rain') !== (v.weather === 'rain')
      || JSON.stringify(prev.household ?? []) !== JSON.stringify(v.household ?? []) || JSON.stringify(prev.people ?? []) !== JSON.stringify(v.people ?? []) || !!prev.reduced !== !!v.reduced || !!prev.classic !== !!v.classic;
    if (prev && prev.month !== v.month) this.sky.useArt(v.month);
    if (sceneChanged) this.rebuildScene(v, season, !instant && !!prev && prev.scene !== v.scene);
    if (!prev || prev.phase !== v.phase) this.sky.setPhase(v.phase, instant || !prev);
    this.weather.set(v.weather);
    this.root.filters = v.prison ? [this.grey] : v.ruins ? [this.scorch] : [];
    if (v.look) this.avatar.setLook(v.look);
    this.avatar.view.visible = !!v.look;
    const key = v.npc ? JSON.stringify(v.npc) : '';
    if (key !== this.npcKey) {
      const appearing = !this.npcKey && !!key;
      this.npcKey = key;
      this.npcAvatar.view.visible = !!v.npc;
      if (v.npc) {
        this.npcAvatar.setLook(v.npc);
        if (appearing) this.npcAvatar.walkIn();
      }
    }
  }

  play(fx: FxKind[]) {
    if (!this.ready) return;
    const hx = this.avatar.x;
    const hy = this.avatar.headY;
    for (const f of fx) {
      if (f.type === 'burst') this.particles.burst(f.kind, hx, hy + 30);
      if (f.type === 'banner') this.particles.banner(f.text, f.color);
      if (f.type === 'flash') this.particles.flash(f.color);
      if (f.type === 'police') this.particles.police();
      if (f.type === 'shake') this.shake(f.power ?? 5);
    }
  }

  floatDeltas(deltas: Record<string, number>, label: (k: string, v: number) => string) {
    if (!this.ready) return;
    const items = Object.entries(deltas).filter(([k, v]) => (k === 'money' ? Math.abs(v) >= 1 : Math.abs(v) >= 0.5)).slice(0, 7);
    for (const [k, v] of items) {
      const color = k === 'money' ? (v > 0 ? DELTA_COLOR.money : DELTA_COLOR.down) : k === 'energy' ? DELTA_COLOR.energy : v > 0 ? DELTA_COLOR.up : DELTA_COLOR.down;
      this.particles.float(label(k, v), color, this.avatar.x, this.avatar.headY);
    }
  }

  destroy() {
    this.dead = true;
    window.removeEventListener('pointermove', this.onMove);
    if (this.ready) {
      gsap.killTweensOf(this.root);
      gsap.killTweensOf(this.sceneGroup);
      this.app.destroy({ removeView: true }, { children: true }); // not `true`: that also releases Pixi's global pools and blacks out the other canvases
      this.ready = false;
    }
  }

  private shake(power: number) {
    gsap.killTweensOf(this.root.position);
    const st = { p: power };
    gsap.to(st, {
      p: 0,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => this.root.position.set((Math.random() - 0.5) * st.p * 2, (Math.random() - 0.5) * st.p * 2),
      onComplete: () => this.root.position.set(0, 0),
    });
  }

  private rebuildBackdrop(region: Region, season: ReturnType<typeof seasonOf>) {
    this.backLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.backdrop = buildBackdrop(region, season);
    this.backGroups = this.backdrop.layers.map((l) => {
      const view = new Container();
      view.addChild(l.body, l.lights.view);
      (view as any).body = l.body;
      (view as any).lights = l.lights.view;
      this.backLayer.addChild(view);
      return { view, depth: l.depth };
    });
  }

  private rebuildScene(v: StageView, season: ReturnType<typeof seasonOf>, animate: boolean) {
    const swap = () => {
      for (const c of [this.sceneBody, this.sceneLights, this.sceneNeon]) c.removeChildren().forEach((x) => x.destroy({ children: true }));
      // Update 0.13 — places with an isometric diorama draw that instead (the flat skyline hides behind it)
      const iso = isoReady() && !v.classic ? buildIso(v.scene, season, v.weather === 'rain', { household: v.household, people: v.people, reduced: v.reduced, onPick: (pid) => this.onPick?.(pid) }) : null;
      this.scene = iso ?? buildScene(v.scene, v.region, season, v.weather === 'rain');
      this.indoor = !!iso?.indoor;
      this.backLayer.visible = !iso;
      this.haze.visible = !iso;
      this.weather.view.visible = !this.indoor;
      this.ambient.birds.visible = !this.indoor;
      this.sceneBody.addChild(this.scene.body);
      this.sceneLights.addChild(this.scene.lights.view);
      this.sceneNeon.addChild(this.scene.neon.view);
      this.ambient.configure({ roadY: this.scene.roadY, region: v.region, season, weather: v.weather });
    };
    if (!animate) {
      swap();
      return;
    }
    gsap.killTweensOf(this.sceneGroup);
    gsap.to(this.sceneGroup, {
      alpha: 0,
      duration: 0.16,
      onComplete: () => {
        swap();
        this.avatar.walkIn();
        gsap.to(this.sceneGroup, { alpha: 1, duration: 0.32 });
      },
    });
  }

  private update(dt: number) {
    this.time += dt;
    this.sky.update(dt);
    const key = this.sky.key;
    const dark = key.dark;
    const lightA = Math.min(1, Math.max(0, (dark - 0.12) * 1.7));

    // parallax
    const m = this.mouse;
    const k = Math.min(1, dt * 3);
    m.x += (m.tx - m.x) * k;
    m.y += (m.ty - m.y) * k;
    this.sky.parallax = -m.x * PARALLAX;
    for (const g of this.backGroups) {
      g.view.position.set(-m.x * PARALLAX * g.depth, -m.y * 5 * g.depth);
      (g.view as any).body.tint = key.tint;
      (g.view as any).lights.alpha = lightA;
    }
    this.sceneGroup.position.set(-m.x * PARALLAX, -m.y * 5);

    // sky-lit surfaces take the sky tint; lights fade in with darkness
    this.sceneBody.tint = this.indoor ? 0xffffff : key.tint;
    this.ambient.traffic.tint = key.tint;
    this.avatar.view.tint = key.tint === 0xffffff ? 0xffffff : mixTint(key.tint);
    this.sceneLights.alpha = lightA;
    const flicker = Math.random() < 0.015 ? 0.55 : 1;
    this.sceneNeon.alpha = (0.55 + dark * 0.45) * flicker;
    this.haze.tint = key.haze;
    this.haze.alpha = 0.32 + (1 - dark) * 0.28;
    this.vignette.alpha = 0.35 + dark * 0.4;

    this.backdrop?.update(dt, this.time);
    this.scene?.update(dt, this.time);
    this.ambient.update(dt, dark);
    this.avatar.update(dt);
    this.npcAvatar.update(dt);
    this.npcAvatar.view.tint = this.avatar.view.tint;
    this.weather.update(dt);
  }
}

/** The avatar is lit a bit more than the world at night so the player stays readable. */
function mixTint(t: number) {
  const r = (t >> 16) & 255, g = (t >> 8) & 255, b = t & 255;
  const up = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.45));
  return (up(r) << 16) | (up(g) << 8) | up(b);
}

let vig: Texture | null = null;
function vignetteTexture() {
  if (vig) return vig;
  const c = document.createElement('canvas');
  c.width = 360;
  c.height = 215;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(180, 100, 60, 180, 108, 230);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.15)');
  g.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 360, 215);
  vig = Texture.from(c);
  return vig;
}
