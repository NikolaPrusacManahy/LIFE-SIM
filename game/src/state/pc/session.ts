import type { Game } from '../Game';
import type { Device } from './types';
import { pcReady } from './build';

// Update 0.8 — sitting at a computer takes no time, but you get one sitting (a few actions) per time slot.

/** Update 0.12 — your own laptop / PC: 12 actions a sitting (was 6). */
export const SESSION_ACTIONS: Record<Device, number> = { library: 4, laptop: 12, pc: 12 };
export const DEVICE_NAME: Record<Device, string> = { library: 'Library PC', laptop: 'Laptop', pc: 'Your PC' };

export function deviceLock(g: Game, d: Device): string | null {
  if (g.usedNow('computer')) return 'Once per time of day';
  if (d === 'pc') return pcReady(g) ? null : g.has('pc') ? 'Your PC is missing a part' : 'Build a PC first';
  if (d === 'laptop') return g.has('laptop') ? null : 'Needs a laptop';
  return null;
}

/** Called from the activity's run (the activity itself spends the slot). */
export function openSession(g: Game, d: Device): string {
  g.markUsed('computer');
  g.s.session = { device: d, left: SESSION_ACTIONS[d], max: SESSION_ACTIONS[d], log: [] };
  return d === 'library' ? 'You log into a public library computer. Someone is reading over your shoulder.' : `You open ${d === 'pc' ? 'your PC' : 'your laptop'}. Doors boots up.`;
}

export const inSession = (g: Game) => !!g.s.session;
export const isPublic = (g: Game) => g.s.session?.device === 'library';

/** Update 0.12 — computer energy is only for Hackr and START-UP; everything else is free and just logged. */
export function noteAction(g: Game, line: string) {
  g.s.session?.log.push(line);
}

/** Spend one action of the session (Hackr and START-UP only). Returns false if none are left. */
export function spendAction(g: Game, line: string): boolean {
  const s = g.s.session;
  if (!s || s.left <= 0) return false;
  s.left--;
  s.log.push(line);
  return true;
}

/** Shut down: returns the summary for the result card. */
export function closeSession(g: Game): string {
  const s = g.s.session;
  g.s.session = null;
  if (!s) return '';
  if (!s.log.length) return 'You stared at the desktop wallpaper, then shut it down.';
  return s.log.slice(-4).join(' ');
}
