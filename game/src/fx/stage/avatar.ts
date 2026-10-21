import { Container, Graphics } from 'pixi.js';
import { glow, shade } from './gfx';
import { EYES, SKIN, hairColor } from '../look';
import type { AvatarSpec } from '../../state/types';

export type Outfit = 'casual' | 'student' | 'suit' | 'coat' | 'uniform' | 'army' | 'farm' | 'ragged' | 'chef';

export interface AvatarLook extends AvatarSpec {
  gender: 'male' | 'female' | 'nonbinary';
  age: number;
  mood: number;
  outfit: Outfit;
}

export { SKIN, HAIR } from '../look';

const OUTFIT: Record<Outfit, [shirt: number, pants: number, accent: number]> = {
  casual: [0x4f8ff0, 0x2f3248, 0xffffff],
  student: [0x8a4fd8, 0x3a3a55, 0xffc23d],
  suit: [0x2b2d42, 0x1f2133, 0xd62839],
  coat: [0xf4f6f8, 0x4a5a6a, 0x7ec8e3],
  uniform: [0x23406e, 0x1b3156, 0xffd166],
  army: [0x66733c, 0x4b5530, 0x3a4220],
  farm: [0xc8453a, 0x2f5f8f, 0xf2d16b],
  ragged: [0x7d7668, 0x514c42, 0x9a917f],
  chef: [0xfafafa, 0x2b2b2b, 0xe0e0e0],
};
const FEM_SHIRT: Partial<Record<Outfit, number>> = { casual: 0xff7aa2, student: 0x9b6bff };
const LINE = 0x1f1a33;
const S = { width: 3, color: LINE, alpha: 0.9 };
const HEIGHT = [0.93, 1, 1.07];
const BUILD = [0.88, 1, 1.08, 1.22];

/** Procedural cel-shaded character: male or female base, 12 hairstyles. Update 0.4. */
export class Avatar {
  readonly view = new Container();
  private shadow = glow(0, 0, 60, 0x000000, 0.45, 12);
  private rig = new Container();
  private body = new Graphics();
  private face = new Graphics();
  private look: AvatarLook | null = null;
  private key = '';
  private t = 0;
  private blink = 3;
  private walk = 0;
  private homeX = 0;
  private flip = 1;

  constructor(flip = false) {
    this.flip = flip ? -1 : 1;
    this.shadow.blendMode = 'normal';
    this.rig.addChild(this.body, this.face);
    this.view.addChild(this.shadow, this.rig);
  }

  setLook(l: AvatarLook) {
    this.look = l;
    const key = JSON.stringify({ ...l, mood: 0 });
    if (key !== this.key) {
      this.key = key;
      this.drawBody();
    }
    this.drawFace(false);
    const s = (l.age < 16 ? 0.9 : l.age < 18 ? 0.96 : 1) * 1.28;
    const h = HEIGHT[l.height ?? 1] ?? 1;
    this.view.scale.set(s * this.flip, s * h);
  }

  place(x: number, y: number) {
    this.homeX = x;
    this.view.position.set(x, y);
  }

  walkIn() {
    this.walk = 1;
    this.view.x = this.homeX - 260 * this.flip;
  }

  get headY() { return this.view.y - 200 * Math.abs(this.view.scale.y); }
  get x() { return this.view.x; }

  update(dt: number) {
    if (!this.look) return;
    this.t += dt;
    if (this.walk > 0) {
      this.walk = Math.max(0, this.walk - dt * 1.3);
      const e = 1 - this.walk;
      this.view.x = this.homeX - 260 * this.flip * (1 - e * e * (3 - 2 * e));
      this.rig.y = -Math.abs(Math.sin(this.t * 11)) * 6;
      this.rig.rotation = Math.sin(this.t * 11) * 0.03;
    } else {
      this.rig.y = Math.sin(this.t * 2 + this.flip) * 1.4;
      this.rig.rotation = 0;
    }
    this.blink -= dt;
    if (this.blink < 0) {
      this.drawFace(true);
      if (this.blink < -0.12) {
        this.blink = 2 + Math.random() * 3.5;
        this.drawFace(false);
      }
    }
  }

  private drawBody() {
    const l = this.look!;
    const g = this.body.clear();
    const fem = l.body === 'female';
    const [shirt0, pants, accent] = OUTFIT[l.outfit];
    const shirt = fem ? FEM_SHIRT[l.outfit] ?? shirt0 : shirt0;
    const skin = SKIN[l.skin % SKIN.length];
    const hair = hairColor(l.hair, l.age);
    const style = l.hairStyle % 12;
    const w = BUILD[l.build ?? 1] ?? 1;
    const sh = (fem ? 21 : 25) * w; // half shoulder width
    const hip = (fem ? 22 : 19) * w;
    const old = l.age >= 65;

    // back hair layers (long styles)
    if (style === 1) g.roundRect(-31, -180, 62, 82, 24).fill(shade(hair, -0.15)).stroke(S);
    if (style === 4) g.roundRect(18, -182, 16, 62, 8).fill(shade(hair, -0.1)).stroke(S);
    if (style === 6) g.roundRect(-30, -170, 14, 74, 7).fill(shade(hair, -0.1)).stroke(S).roundRect(16, -170, 14, 74, 7).fill(shade(hair, -0.1)).stroke(S);
    if (style === 11) g.roundRect(-34, -190, 68, 90, 30).fill(accent === 0xffffff ? 0x6a4c93 : shade(accent, -0.2)).stroke(S);

    // legs (skirt option for the female rig's casual/student/suit looks)
    const skirt = fem && ['casual', 'student', 'suit'].includes(l.outfit);
    if (skirt) {
      g.poly([-hip, -66, hip, -66, hip + 6, -34, -hip - 6, -34]).fill(pants).stroke(S);
      g.roundRect(-14, -36, 11, 34, 5).fill(skin).stroke(S).roundRect(3, -36, 11, 34, 5).fill(shade(skin, -0.08)).stroke(S);
    } else {
      g.roundRect(-hip + 2, -62, 15 * w, 60, 6).fill(pants).stroke(S);
      g.roundRect(hip - 2 - 15 * w, -62, 15 * w, 60, 6).fill(shade(pants, -0.12)).stroke(S);
    }
    g.roundRect(-21, -8, 21, 10, 5).fill(0x2a2a30).stroke(S).roundRect(0, -8, 21, 10, 5).fill(0x2a2a30).stroke(S);

    // arms
    g.roundRect(-sh - 11, -122, 13, 56, 7).fill(shade(shirt, -0.08)).stroke(S);
    g.roundRect(sh - 2, -122, 13, 56, 7).fill(shade(shirt, -0.2)).stroke(S);
    g.circle(-sh - 4.5, -64, 7).fill(skin).stroke(S).circle(sh + 4.5, -64, 7).fill(shade(skin, -0.1)).stroke(S);

    // torso: male = straight, female = taper at the waist and flare at the hips
    if (fem) g.poly([-sh, -126, sh, -126, sh - 4, -92, hip, -60, -hip, -60, -sh + 4, -92]).fill(shirt).stroke(S);
    else g.roundRect(-sh, -128, sh * 2, 72, 16).fill(shirt).stroke(S);
    g.roundRect(sh * 0.25, -122, sh * 0.6, 58, 10).fill({ color: 0x000000, alpha: 0.12 });
    if (old) g.rect(-sh, -128, sh * 2, 4).fill({ color: 0x000000, alpha: 0.08 });
    if (l.outfit === 'suit') g.poly([-6, -128, 6, -128, 3, -96, 0, -90, -3, -96]).fill(accent);
    if (l.outfit === 'coat') g.rect(-1.5, -128, 3, 70).fill(0xd0d4da);
    if (l.outfit === 'student') g.roundRect(sh - 6, -124, 14, 46, 5).fill(accent).stroke(S);
    if (l.outfit === 'uniform') g.star(-10, -108, 5, 6, 3).fill(accent);
    if (l.outfit === 'farm') for (let i = -sh + 4; i < sh; i += 10) g.rect(i, -126, 2, 66).fill({ color: 0x000000, alpha: 0.18 });
    if (fem && l.outfit === 'casual') g.poly([-8, -128, 8, -128, 0, -116]).fill(skin);

    // neck + head + ears
    g.roundRect(-7, -140, 14, 16, 4).fill(shade(skin, -0.12)).stroke(S);
    g.ellipse(0, -162, fem ? 27 : 28, 30).fill(skin).stroke(S);
    if (style !== 11) g.ellipse(-28, -160, 5, 7).fill(skin).stroke(S).ellipse(28, -160, 5, 7).fill(skin).stroke(S);

    // front hair
    const H = (pts: number[]) => g.poly(pts).fill(hair).stroke(S);
    switch (style) {
      case 0: H([-29, -162, -26, -188, -8, -198, 14, -196, 29, -182, 30, -160, 18, -178, 4, -174, -12, -180]); break;
      case 1: H([-30, -152, -27, -188, -6, -199, 18, -194, 31, -174, 32, -148, 22, -174, -2, -182, -20, -170]); break;
      case 2: g.circle(0, -200, 13).fill(hair).stroke(S); H([-29, -164, -24, -188, 0, -196, 24, -188, 29, -164, 16, -180, -16, -180]); break;
      case 3: H([-28, -170, -22, -188, 0, -194, 22, -188, 28, -170, 0, -182]); break;
      case 4: H([-29, -164, -24, -190, 0, -198, 24, -190, 29, -164, 12, -182, -14, -180]); break;
      case 5: H([-31, -146, -28, -186, -4, -198, 20, -194, 32, -176, 31, -146, 22, -150, 20, -176, -16, -178, -22, -150]); break;
      case 6: H([-29, -164, -24, -190, 0, -198, 24, -190, 29, -164, 0, -186]); break;
      case 7: for (const [x, y, r] of [[-22, -180, 14], [-6, -192, 15], [12, -190, 15], [25, -176, 13], [-28, -162, 10], [28, -160, 10]]) g.circle(x, y, r).fill(hair).stroke(S); break;
      case 8: H([-27, -168, -20, -190, 2, -196, 24, -186, 28, -168, 10, -182, -6, -176]); break;
      case 9: H([-6, -214, 6, -214, 8, -180, -8, -180]); g.rect(-24, -184, 48, 6).fill({ color: hair, alpha: 0.4 }); break;
      case 10: H([-29, -160, -26, -190, 0, -198, 26, -190, 30, -168, 10, -186, -10, -176, -20, -172]); break;
      case 11: g.ellipse(0, -176, 34, 26).fill(accent === 0xffffff ? 0x6a4c93 : shade(accent, -0.2)).stroke(S); break;
    }
    if (l.outfit === 'chef') g.roundRect(-20, -216, 40, 28, 12).fill(0xffffff).stroke(S);
    if (l.outfit === 'army') g.ellipse(0, -188, 31, 14).fill(OUTFIT.army[0]).stroke(S);
  }

  private drawFace(closed: boolean) {
    const l = this.look!;
    const f = this.face.clear();
    const eye = EYES[(l.eyes ?? 0) % EYES.length];
    if (closed) {
      f.moveTo(-15, -160).quadraticCurveTo(-10, -157, -5, -160).stroke({ width: 2.5, color: LINE });
      f.moveTo(5, -160).quadraticCurveTo(10, -157, 15, -160).stroke({ width: 2.5, color: LINE });
    } else {
      f.ellipse(-10, -161, 4.2, 5.6).fill(eye).ellipse(10, -161, 4.2, 5.6).fill(eye);
      f.circle(-10, -161, 2).fill(LINE).circle(10, -161, 2).fill(LINE);
      f.circle(-8.6, -163, 1.5).fill(0xffffff).circle(11.4, -163, 1.5).fill(0xffffff);
      if (l.body === 'female') f.moveTo(-14, -166).lineTo(-16, -168).moveTo(14, -166).lineTo(16, -168).stroke({ width: 1.5, color: LINE });
    }
    const brow = l.mood < 30 ? 3 : 0;
    f.moveTo(-15, -171 + brow).lineTo(-5, -172).moveTo(5, -172).lineTo(15, -171 + brow).stroke({ width: 2.2, color: shade(hairColor(l.hair, l.age), -0.2) });
    f.ellipse(-17, -151, 5, 3).fill({ color: 0xff7a8a, alpha: 0.3 }).ellipse(17, -151, 5, 3).fill({ color: 0xff7a8a, alpha: 0.3 });
    if (l.freckles) for (const [x, y] of [[-15, -153], [-11, -150], [-18, -149], [15, -153], [11, -150], [18, -149]]) f.circle(x, y, 0.9).fill({ color: 0x8a5a3a, alpha: 0.7 });
    if (l.glasses) f.roundRect(-17, -167, 14, 12, 4).stroke({ width: 2, color: LINE }).roundRect(3, -167, 14, 12, 4).stroke({ width: 2, color: LINE }).moveTo(-3, -162).lineTo(3, -162).stroke({ width: 2, color: LINE });
    const m = l.mood;
    if (m > 62) f.moveTo(-7, -148).quadraticCurveTo(0, -141, 7, -148).stroke({ width: 2.5, color: 0x7a2b35 });
    else if (m < 30) f.moveTo(-6, -143).quadraticCurveTo(0, -148, 6, -143).stroke({ width: 2.5, color: 0x7a2b35 });
    else f.moveTo(-5, -146).lineTo(5, -146).stroke({ width: 2.5, color: 0x7a2b35 });
    if (l.age >= 50) f.moveTo(-18, -176).lineTo(-12, -175).moveTo(12, -175).lineTo(18, -176).stroke({ width: 1, color: LINE, alpha: 0.35 });
    if (l.age >= 65) f.moveTo(-20, -156).lineTo(-16, -154).moveTo(20, -156).lineTo(16, -154).stroke({ width: 1, color: LINE, alpha: 0.35 });
  }
}
