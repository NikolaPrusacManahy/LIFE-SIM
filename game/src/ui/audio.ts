import { settings } from '../state/settings';

// Update 0.5.1 — music & sound effects. DOM-only; game rules never import this.
export type SfxId = 'click' | 'message' | 'camera' | 'nomoney' | 'notify';

const url = (f: string) => `${import.meta.env.BASE_URL}audio/${f}.mp3`;
const VOL: Record<SfxId, number> = { click: 0.45, message: 0.6, camera: 0.7, nomoney: 0.6, notify: 0.6 };
const cache: Partial<Record<SfxId, HTMLAudioElement>> = {};
let bgm: HTMLAudioElement | null = null;
let unlocked = false;

/** `rate` pitches a sound (Update 0.8 — partner / family / unknown notifications until dedicated files exist). */
export function sfx(id: SfxId, rate = 1) {
  if (!settings.sound || !unlocked) return;
  const base = (cache[id] ??= Object.assign(new Audio(url(id)), { preload: 'auto' }));
  const a = base.cloneNode() as HTMLAudioElement;
  a.volume = VOL[id];
  a.playbackRate = rate;
  a.preservesPitch = false;
  a.play().catch(() => undefined);
}

export const NOTIFY_RATE: Record<'partner' | 'family' | 'other', number> = { partner: 1.18, family: 0.88, other: 1 };

/** Background music loops once the browser allows audio (after the first input). */
export function syncMusic() {
  if (!unlocked) return;
  if (!bgm) {
    bgm = new Audio(url('bgm'));
    bgm.loop = true;
    bgm.volume = 0.3;
  }
  if (settings.music) bgm.play().catch(() => undefined);
  else bgm.pause();
}

/** Result texts and lock reasons that mean "you can't afford it" (tested). */
export const isMoneyText = (text: string | null | undefined) => !!text && /^(Not enough (money|cash)|You couldn’t afford|Need \$)/i.test(text.trim());
export const SFX_FILES: (SfxId | 'bgm')[] = ['click', 'message', 'camera', 'nomoney', 'notify', 'bgm'];

/** Plays the "can't afford it" sound when a result or lock reason is about money. */
export function sfxForText(text: string | null | undefined) {
  if (isMoneyText(text)) sfx('nomoney');
}

/**
 * One listener for the whole UI: buttons click, money-locked buttons buzz.
 * `data-sfx="none"` on a button (or a parent) skips the click — that UI plays its own sound.
 */
export function installAudio() {
  const onInput = (e: Event) => {
    if (!unlocked) {
      unlocked = true;
      syncMusic();
    }
    if (e.type !== 'pointerdown') return;
    const el = (e.target as Element | null)?.closest?.('button, [role="button"]') as HTMLButtonElement | null;
    if (!el) return;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return sfxForText(el.title);
    if (el.closest('[data-sfx="none"]')) return;
    sfx('click');
  };
  document.addEventListener('pointerdown', onInput, true);
  document.addEventListener('keydown', onInput, true);
  return () => {
    document.removeEventListener('pointerdown', onInput, true);
    document.removeEventListener('keydown', onInput, true);
  };
}
