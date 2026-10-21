import { Container, Graphics, type ContainerChild } from 'pixi.js';
import { glow } from './gfx';

/**
 * A light layer that sits directly in front of the body it belongs to (depth-correct).
 * Sharp shapes for the light source + soft additive glow sprites. Stage fades it by darkness.
 * Update 0.2 — replaced blur filters with glow sprites.
 */
export class LightLayer {
  readonly view = new Container();
  private sharp = new Graphics();
  private soft = new Container();

  constructor() {
    this.soft.blendMode = 'add';
    this.view.addChild(this.soft, this.sharp);
  }

  rect(x: number, y: number, w: number, h: number, color: number, alpha = 1) {
    this.sharp.rect(x, y, w, h).fill({ color, alpha });
  }
  circle(x: number, y: number, r: number, color: number, alpha = 1) {
    this.sharp.circle(x, y, r).fill({ color, alpha });
  }
  /** soft halo only */
  halo(x: number, y: number, r: number, color: number, alpha = 0.5, ry = r) {
    this.soft.addChild(glow(x, y, r, color, alpha, ry));
  }
  add(child: ContainerChild) {
    this.view.addChild(child);
  }
}
