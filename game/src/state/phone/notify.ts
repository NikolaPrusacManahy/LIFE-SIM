import type { Game } from '../Game';
import type { Note, NoteKind } from './types';
import { newId } from '../Game';

// Update 0.8 — notifications: one place for badges, banners and the notification centre.

export function pushNote(g: Game, kind: NoteKind, text: string, pid?: string, icon = '🔔') {
  // don't stack the same reminder twice in one slot
  if (g.s.notes.some((n) => n.turn === g.s.turn && n.text === text)) return;
  const n: Note = { id: newId(), kind, pid, icon, text, turn: g.s.turn, read: false, shown: false };
  g.s.notes.unshift(n);
  if (g.s.notes.length > 60) g.s.notes.length = 60;
}

/** Messages that have arrived (busy NPCs answer in a later slot — those stay hidden until then). */
export const arrived = (g: Game, turn: number) => turn <= g.s.turn;

/** People (or groups) with at least one unread incoming message. */
export function unreadThreads(g: Game): string[] {
  return Object.entries(g.s.chats)
    .filter(([, msgs]) => msgs.some((m) => m.from !== 'me' && !m.read && arrived(g, m.turn)))
    .map(([id]) => id);
}

/** The single badge number used everywhere (HUD phone, Messages tile, inbox). */
// Update 0.12 — the unknown number counts too
export const badgeCount = (g: Game) => unreadThreads(g).length + (g.s.stalker && !g.s.stalker.read ? 1 : 0);

export const unreadIn = (g: Game, threadId: string) => (g.s.chats[threadId] ?? []).filter((m) => m.from !== 'me' && !m.read && arrived(g, m.turn)).length;

/** Notes waiting to slide in as banners (shown only when the action pipeline flushes). */
export const pendingBanners = (g: Game) => g.s.notes.filter((n) => !n.shown && arrived(g, n.turn));

export function markShown(g: Game, id: string) {
  const n = g.s.notes.find((x) => x.id === id);
  if (n) n.shown = true;
}

export function readThread(g: Game, threadId: string) {
  for (const m of g.s.chats[threadId] ?? []) if (m.from !== 'me' && arrived(g, m.turn)) m.read = true;
  for (const m of g.s.inbox) if (m.pid === threadId) m.read = true;
  for (const n of g.s.notes) if (n.pid === threadId) n.read = true;
}
