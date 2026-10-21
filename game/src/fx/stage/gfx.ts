import { FillGradient, Sprite, Texture } from 'pixi.js';

// Update 0.2 — shared drawing helpers: cached gradients and soft glow sprites (no blur filters).

const grads = new Map<string, FillGradient>();

/** Vertical gradient in the shape's local space (top → bottom). Cached by colour pair. */
export function vgrad(top: number, bottom: number): FillGradient {
  const key = `${top}-${bottom}`;
  let g = grads.get(key);
  if (!g) {
    g = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: top },
        { offset: 1, color: bottom },
      ],
      textureSpace: 'local',
    });
    grads.set(key, g);
  }
  return g;
}

/** Lighten (amt > 0) or darken (amt < 0) a colour. */
export function shade(c: number, amt: number) {
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  return (Math.round(r + (t - r) * p) << 16) | (Math.round(g + (t - g) * p) << 8) | Math.round(b + (t - b) * p);
}

function canvasTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d')!);
  return Texture.from(c);
}

let glowTex: Texture | null = null;
let fadeTex: Texture | null = null;

/** White radial falloff, tinted per use. */
export function glowTexture() {
  if (!glowTex) {
    glowTex = canvasTexture(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.22, 'rgba(255,255,255,0.55)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.14)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    });
  }
  return glowTex;
}

/** White vertical falloff: opaque at the bottom, clear at the top. */
export function fadeTexture() {
  if (!fadeTex) {
    fadeTex = canvasTexture(4, 128, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(255,255,255,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 4, 128);
    });
  }
  return fadeTex;
}

/** Soft additive glow centred on (x, y). */
export function glow(x: number, y: number, rx: number, color: number, alpha = 0.6, ry = rx) {
  const s = new Sprite(glowTexture());
  s.anchor.set(0.5);
  s.position.set(x, y);
  s.width = rx * 2;
  s.height = ry * 2;
  s.tint = color;
  s.alpha = alpha;
  s.blendMode = 'add';
  return s;
}

/** Vertical fade band, solid at the bottom edge (y + h). Flip with `down`. */
export function fade(x: number, y: number, w: number, h: number, color: number, alpha = 1, down = false) {
  const s = new Sprite(fadeTexture());
  s.position.set(x, down ? y + h : y);
  s.width = w;
  s.height = h;
  if (down) s.scale.y *= -1;
  s.tint = color;
  s.alpha = alpha;
  return s;
}
