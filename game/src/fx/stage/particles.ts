import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import type { FxKind } from '../../state/types';
import { H, W } from './palette';

type BurstKind = Extract<FxKind, { type: 'burst' }>['kind'];

const GLYPH: Partial<Record<BurstKind, { chars: string[]; colors: number[] }>> = {
  coins: { chars: ['$', '●'], colors: [0xffd166, 0xf4a261] },
  sparkle: { chars: ['✦', '✧', '★'], colors: [0xfff3b0, 0xffffff, 0xffd6ff] },
  hearts: { chars: ['❤', '♥'], colors: [0xff5d8f, 0xff8fab] },
  zzz: { chars: ['z', 'Z'], colors: [0xc8d6ff, 0xffffff] },
  hit: { chars: ['✖', '✸'], colors: [0xff4d4d, 0xffffff] },
  smoke: { chars: ['●'], colors: [0x9a9a9a, 0xcccccc] },
};

/** Floating numbers, particle bursts, banners, screen flash. */
export class Particles {
  readonly view = new Container();
  private floatQueue = 0;

  float(text: string, color: number, x: number, y: number) {
    const delay = this.floatQueue++ * 0.14;
    const t = new Text({ text, style: { fontFamily: 'Fredoka, sans-serif', fontWeight: '700', fontSize: 22, fill: color, stroke: { color: 0x0b0d17, width: 4 } } });
    t.anchor.set(0.5);
    t.position.set(x + (Math.random() - 0.5) * 50, y);
    t.alpha = 0;
    this.view.addChild(t);
    gsap.timeline({ delay, onComplete: () => { t.destroy(); this.floatQueue = Math.max(0, this.floatQueue - 1); } })
      .to(t, { alpha: 1, duration: 0.15 })
      .to(t, { y: y - 90, duration: 1.4, ease: 'power2.out' }, 0)
      .to(t, { alpha: 0, duration: 0.4 }, 1.0);
  }

  burst(kind: BurstKind, x: number, y: number) {
    if (kind === 'confetti') return this.confetti(x, y);
    const spec = GLYPH[kind]!;
    const n = kind === 'zzz' ? 4 : 16;
    for (let i = 0; i < n; i++) {
      const t = new Text({ text: spec.chars[i % spec.chars.length], style: { fontFamily: 'Fredoka, sans-serif', fontWeight: '700', fontSize: 14 + Math.random() * 14, fill: spec.colors[i % spec.colors.length] } });
      t.anchor.set(0.5);
      t.position.set(x, y);
      this.view.addChild(t);
      const a = kind === 'zzz' ? -Math.PI / 2 + (Math.random() - 0.5) * 0.6 : Math.random() * Math.PI * 2;
      const d = kind === 'zzz' ? 80 + i * 20 : 60 + Math.random() * 90;
      gsap.to(t, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d - 30, alpha: 0, rotation: (Math.random() - 0.5) * 2, duration: kind === 'zzz' ? 2 : 1.1, delay: kind === 'zzz' ? i * 0.3 : 0, ease: 'power2.out', onComplete: () => t.destroy() });
    }
  }

  private confetti(x: number, y: number) {
    const colors = [0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93, 0xff8fab];
    for (let i = 0; i < 46; i++) {
      const g = new Graphics().rect(-4, -2, 8, 4).fill(colors[i % colors.length]);
      g.position.set(x, y);
      this.view.addChild(g);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const v = 160 + Math.random() * 220;
      gsap.to(g, { x: x + Math.cos(a) * v, duration: 1.8, ease: 'power1.out' });
      gsap.to(g, { y: y + Math.sin(a) * v + 260, rotation: Math.random() * 12, alpha: 0, duration: 1.8, ease: 'power1.in', onComplete: () => g.destroy() });
    }
  }

  banner(text: string, color = 0xffffff) {
    const t = new Text({ text, style: { fontFamily: 'Fredoka, sans-serif', fontWeight: '700', fontSize: 56, fill: color, stroke: { color: 0x0b0d17, width: 8 }, letterSpacing: 2 } });
    t.anchor.set(0.5);
    t.position.set(760, 230);
    t.scale.set(0.3);
    t.alpha = 0;
    this.view.addChild(t);
    gsap.timeline({ onComplete: () => t.destroy() })
      .to(t, { alpha: 1, duration: 0.2 })
      .to(t.scale, { x: 1, y: 1, duration: 0.5, ease: 'back.out(2.2)' }, 0)
      .to(t, { y: 200, alpha: 0, duration: 0.6, delay: 1.3 });
  }

  flash(color: number, alpha = 0.35) {
    const g = new Graphics().rect(0, 0, W, H).fill(color);
    g.alpha = alpha;
    this.view.addChild(g);
    gsap.to(g, { alpha: 0, duration: 0.6, onComplete: () => g.destroy() });
  }

  police() {
    const g = new Graphics();
    this.view.addChild(g);
    const st = { t: 0 };
    gsap.to(st, {
      t: 1,
      duration: 2.2,
      onUpdate: () => {
        const on = Math.floor(st.t * 14) % 2 === 0;
        g.clear().rect(0, 0, W, H).fill({ color: on ? 0xff1e3c : 0x1e5bff, alpha: 0.22 * (1 - st.t) });
      },
      onComplete: () => g.destroy(),
    });
  }
}
