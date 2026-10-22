import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { LightLayer } from '../stage/lights';
import type { SceneBuild } from '../stage/scene';
import { SCENE_X } from '../stage/palette';
import type { SceneKind } from '../../state/data/locations';
import { DX, DY, depthOf, toScreen, type IsoScene, type IsoSeason, type Member, type Path } from './layout-core';
import type { Prim } from './furniture';
import { isoScene } from './scenes';

// Update 0.13 — the isometric scene on the stage (Kenney art from public/iso atlases + furniture drawn in code):
// cars on the roads, people walking, dancing, sitting; your household at home; lamps and lit windows at night,
// snow and ice in winter, a disco ball in the club.

const ATLASES = ['city', 'buildings', 'land', 'cars', 'foliage', 'interior', 'animals', 'sky', 'items'];
let loaded: Promise<boolean> | null = null;

/** Load the atlases once. Resolves false if they can't load (the stage then keeps the old scenes). */
export function loadIso(): Promise<boolean> {
  loaded ??= Assets.load(ATLASES.map((a) => `${import.meta.env.BASE_URL}iso/${a}.json`))
    .then(() => true)
    .catch(() => false);
  return loaded;
}
let ready = false;
export const isoReady = () => ready;
export async function preloadIso() {
  ready = await loadIso();
  return ready;
}

const VIEW = { scale: 0.6, centreY: 330 };
/** the stage window (stage coordinates), for indoor backdrops */
const WINDOW = { x: 316, y: 0, w: 860, h: 600 };

const SERVICE = ['taxi', 'police', 'ambulance', 'garbage'];
const CIVIL = ['black', 'blue', 'green', 'red', 'silver'].flatMap((c) => ['sedan1', 'sedan2', 'pickup1', 'truck1'].map((m) => `${c}_${m}`));
const CLOTHES = [0xe8505b, 0x3a7bd5, 0xf2b134, 0x4caf7a, 0x8e6bd8, 0x333a48, 0xf5f0e6, 0xff8fc4, 0x2bb3a8];
const SKIN = [0xf6d3b3, 0xe0ac85, 0xb07a52, 0x7a4b2e];

const tex = (name: string) => (Assets.cache.has(name) ? Texture.from(name) : Texture.EMPTY);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

interface Mover {
  view: Container;
  path: Path;
  /** distance travelled along the path, in grid units */
  d: number;
  speed: number;
  car?: string;
  sprite?: Sprite;
  bob?: Graphics;
  phase: number;
}

function pathLength(p: Path) {
  let len = 0;
  for (let i = 1; i < p.points.length; i++) len += Math.hypot(p.points[i].u - p.points[i - 1].u, p.points[i].v - p.points[i - 1].v);
  return len;
}

/** Position and heading at distance d along a path. */
function along(p: Path, d: number): { u: number; v: number; du: number; dv: number; done: boolean } {
  let left = d;
  for (let i = 1; i < p.points.length; i++) {
    const a = p.points[i - 1];
    const b = p.points[i];
    const seg = Math.hypot(b.u - a.u, b.v - a.v);
    if (left <= seg) {
      const t = seg ? left / seg : 0;
      return { u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t, du: Math.sign(b.u - a.u), dv: Math.sign(b.v - a.v), done: false };
    }
    left -= seg;
  }
  const z = p.points[p.points.length - 1];
  return { u: z.u, v: z.v, du: 0, dv: 0, done: !p.loop && p.points.length > 1 };
}

/** Kenney car sprites are named by screen direction. */
const carDir = (du: number, dv: number) => (du > 0 ? 'SE' : du < 0 ? 'NW' : dv > 0 ? 'SW' : 'NE');

/** A tiny flat person (feet at 0,0, world scale). Kids are smaller; pets are four-legged. */
function figure(who: Member | null, seated = false): { view: Container; bob: Graphics } {
  const view = new Container();
  const bob = new Graphics();
  if (who?.kind === 'pet') {
    bob.roundRect(-6, -9, 12, 6, 3).fill(who.color).circle(6, -10, 3.4).fill(who.color);
    for (const x of [-5, -2, 2, 5]) bob.rect(x, -4, 1.4, 4).fill(who.color);
  } else {
    const shirt = who?.color ?? pick(CLOTHES);
    const skin = who?.skin ?? pick(SKIN);
    if (!seated) bob.roundRect(-3, -9, 2.4, 9, 1).fill(0x2a2f3d).roundRect(0.6, -9, 2.4, 9, 1).fill(0x2a2f3d);
    const y0 = seated ? 6 : 0;
    bob.roundRect(-4.5, -21 + y0, 9, 13, 3).fill(shirt);
    bob.circle(0, -25.5 + y0, 4.4).fill(skin);
    if (who?.kind === 'kid') bob.scale.set(0.72);
  }
  const shadow = new Graphics().ellipse(0, 0, 6, 2.4).fill({ color: 0x000000, alpha: 0.18 });
  view.addChild(shadow, bob);
  return { view, bob };
}

function drawPrims(prims: Prim[]): Graphics {
  const g = new Graphics();
  for (const p of prims) {
    if (p.kind === 'poly') g.poly(p.pts).fill({ color: p.color, alpha: p.alpha ?? 1 });
    else g.circle(p.x, p.y, p.r).fill({ color: p.color, alpha: p.alpha ?? 1 });
  }
  return g;
}

function gradient(top: number, bottom: number): Graphics {
  const g = new Graphics();
  const bands = 24;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const mix = (s: number) => Math.round(((top >> s) & 255) + (((bottom >> s) & 255) - ((top >> s) & 255)) * t);
    g.rect(WINDOW.x, WINDOW.y + (WINDOW.h / bands) * i, WINDOW.w, WINDOW.h / bands + 1).fill((mix(16) << 16) | (mix(8) << 8) | mix(0));
  }
  return g;
}

export interface IsoOptions {
  household?: Member[];
  /** contacts who are here: they join the crowd and can be clicked */
  people?: Member[];
  onPick?: (pid: string) => void;
  /** "Reduced effects": fewer people, no club lights */
  reduced?: boolean;
}

/** Build the scene for a place (sync: the atlases are preloaded by the Stage). */
export function buildIso(kind: SceneKind, season: IsoSeason, wet: boolean, opts: IsoOptions = {}): SceneBuild & { indoor: boolean } {
  const scene: IsoScene = isoScene(kind, season, opts.household ?? []);
  const view = scene.view ?? VIEW;
  const centre = toScreen(scene.cols / 2, scene.rows / 2);
  return renderIso(scene, season, wet, opts, { x: SCENE_X - centre.x * view.scale, y: view.centreY - centre.y * view.scale, scale: view.scale });
}

/** Draw any isometric scene (a place, or the city map) at a given position and scale. */
export function renderIso(scene: IsoScene, season: IsoSeason, wet: boolean, opts: IsoOptions, at: { x: number; y: number; scale: number }): SceneBuild & { indoor: boolean; world: Container } {
  const view = { scale: at.scale };
  const indoor = !!scene.backdrop;
  const body = new Container();
  if (scene.backdrop) body.addChild(gradient(scene.backdrop[0], scene.backdrop[1]));
  const world = new Container();
  world.sortableChildren = true;
  world.scale.set(at.scale);
  world.position.set(at.x, at.y);
  body.addChild(world);

  for (const d of scene.draws) {
    if (d.prims) {
      const g = drawPrims(d.prims);
      g.zIndex = d.z;
      world.addChild(g);
      continue;
    }
    const s = new Sprite(tex(d.frame));
    s.anchor.set(d.ax, d.ay);
    s.position.set(d.x, d.y);
    const k = d.scale ?? 1;
    s.scale.set(d.flip ? -k : k, k);
    s.zIndex = d.z;
    // winter: the lake freezes over
    if (season === 'winter' && d.frame === 'land_066') s.tint = 0xe3f1ff;
    world.addChild(s);
    // winter: snow settles on the grass
    if (season === 'winter' && d.frame === 'land_067') {
      const top = d.y - 98;
      const g = new Graphics().poly([d.x, top, d.x + DX, top + DY, d.x, top + DY * 2, d.x - DX, top + DY]).fill({ color: 0xffffff, alpha: 0.72 });
      g.zIndex = d.z + 1;
      world.addChild(g);
    }
  }
  if (wet && !indoor) {
    // rain: a cool, glossy film over the whole diorama
    const sheen = new Graphics().rect(-3000, -3000, 6000, 6000).fill({ color: 0x5577aa, alpha: 0.08 });
    sheen.zIndex = 1e6;
    world.addChild(sheen);
  }

  // night lights live in stage space (the Stage fades them in with darkness)
  const lights = new LightLayer();
  const neon = new LightLayer();
  const toStage = (p: { x: number; y: number }) => ({ x: world.position.x + p.x * view.scale, y: world.position.y + p.y * view.scale });
  for (const l of scene.lamps) {
    const p = toStage(l);
    lights.circle(p.x, p.y - 22, 2.2, 0xfff1c4);
    lights.halo(p.x, p.y - 22, 26, 0xffd27a, 0.55);
    lights.halo(p.x, p.y + 4, 30, 0xffd27a, 0.18, 12);
  }
  for (const w of scene.windows) {
    const p = toStage(w);
    lights.rect(p.x - 3, p.y - 4, 6, 7, 0xffe7a3, 0.9);
    lights.halo(p.x, p.y, 12, 0xffcf7a, 0.35);
  }

  // the club: rotating disco spots on the floor and a beat pulse
  let disco: ((t: number) => void) | null = null;
  if (scene.disco && !opts.reduced) {
    const spots = new Graphics();
    spots.blendMode = 'add';
    spots.zIndex = 50;
    world.addChild(spots);
    const { u, v } = scene.disco;
    const COLORS = [0xff4fd8, 0x4fd8ff, 0xffe066, 0x7cff6b, 0xff8a4f, 0xffffff];
    disco = (t) => {
      spots.clear();
      for (let i = 0; i < 14; i++) {
        const a = t * 0.9 + (i / 14) * Math.PI * 2;
        const rad = 1.2 + (i % 3) * 0.9;
        const p = toScreen(u + Math.cos(a) * rad, v + Math.sin(a) * rad);
        spots.ellipse(p.x, p.y, 16, 8).fill({ color: COLORS[i % COLORS.length], alpha: 0.32 + 0.18 * Math.sin(t * 6 + i) });
      }
    };
  }

  // people and cars
  const movers: Mover[] = [];
  const carPaths = scene.paths.filter((p) => p.kind === 'car');
  const walkPaths = scene.paths.filter((p) => p.kind === 'walk');
  const spots = scene.paths.filter((p) => p.kind !== 'car' && p.kind !== 'walk');
  const add = (path: Path, who: Member | null, d = 0) => {
    const f = figure(who, path.kind === 'sit');
    world.addChild(f.view);
    if (who?.pid && opts.onPick) {
      const pid = who.pid;
      f.view.eventMode = 'static';
      f.view.cursor = 'pointer';
      f.view.hitArea = { contains: (x: number, y: number) => x > -9 && x < 9 && y > -32 && y < 3 };
      f.view.on('pointertap', () => opts.onPick?.(pid));
      // a small marker so you can tell who you know
      f.view.addChild(new Graphics().circle(0, -36, 2.6).fill(0xffe066));
    }
    movers.push({ view: f.view, path, d, speed: path.kind === 'walk' ? 0.45 + Math.random() * 0.35 : 0, bob: f.bob, phase: Math.random() * 6 });
  };
  // the household takes the first spots at home
  const household = scene.household ?? [];
  household.forEach((m, i) => spots[i] && add(spots[i], m));
  const free = spots.slice(household.length);
  // contacts who are here take the next spots, or walk
  for (const m of opts.people ?? []) {
    const s = free.shift();
    if (s) add(s, m);
    else if (walkPaths.length) add(pick(walkPaths), m, Math.random() * 3);
  }
  const crowd = Math.round((scene.crowd ?? 6) * (opts.reduced ? 0.5 : 1));
  for (let i = 0; i < crowd; i++) {
    if (i < free.length && (i % 3 !== 2 || !walkPaths.length)) add(free[i], null);
    else if (walkPaths.length) {
      const p = pick(walkPaths);
      add(p, null, Math.random() * pathLength(p));
    }
  }
  const spawnCar = () => {
    if (!carPaths.length || movers.filter((m) => m.car).length >= (opts.reduced ? 3 : 6)) return;
    const car = Math.random() < 0.72 ? pick(CIVIL) : pick(SERVICE);
    const sprite = new Sprite(tex(`car_${car}_SE`));
    sprite.anchor.set(0.5, 0.75);
    const v = new Container();
    v.addChild(sprite);
    world.addChild(v);
    movers.push({ view: v, path: pick(carPaths), d: 0, speed: 1.6 + Math.random() * 1.2, car, sprite, phase: 0 });
  };
  let carClock = 0;
  let t0 = 0;

  const update = (dt: number) => {
    t0 += dt;
    disco?.(t0);
    carClock -= dt;
    if (carClock <= 0) {
      spawnCar();
      carClock = 0.8 + Math.random() * 1.6;
    }
    for (let i = movers.length - 1; i >= 0; i--) {
      const m = movers[i];
      m.d += m.speed * dt;
      const len = pathLength(m.path);
      if (m.path.loop && len && m.d > len) m.d -= len;
      const at = along(m.path, m.d);
      if (at.done) {
        m.view.destroy({ children: true });
        movers.splice(i, 1);
        if (!m.car && walkPaths.length) add(pick(walkPaths), null);
        continue;
      }
      const p = toScreen(at.u, at.v);
      m.view.position.set(p.x, p.y);
      m.view.zIndex = depthOf(at.u, at.v, 45);
      if (m.sprite && m.car) m.sprite.texture = tex(`car_${m.car}_${carDir(at.du, at.dv)}`);
      if (!m.bob) continue;
      const k = m.path.kind;
      if (k === 'walk') m.bob.y = -Math.abs(Math.sin(t0 * 9 + m.phase)) * 1.6;
      else if (k === 'dance') {
        m.bob.y = -Math.abs(Math.sin(t0 * 8 + m.phase)) * 4;
        m.bob.rotation = Math.sin(t0 * 4 + m.phase) * 0.18;
      } else if (k === 'stand') m.bob.y = Math.sin(t0 * 1.6 + m.phase) * 0.6;
    }
  };

  return { body, lights, neon, roadY: null, update, indoor, world };
}
