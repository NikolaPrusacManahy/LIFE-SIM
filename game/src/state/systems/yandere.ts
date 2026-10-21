import type { Game } from '../Game';
import type { Person } from '../types';
import { yanderePartner } from '../npc/persona';
import { darkCrimeOn } from '../crime/consent';
import { pushMsg, sentThisMonth } from '../phone/convo';

// Update 0.12 — a yandere partner doesn't share. Text someone of their own sex too much and that person is gone:
// dead with Dark Crime on (the police never find a thing), scared out of town with it off. Adults only, never family.

/** Messages to one person in a month before your yandere notices. */
export const YANDERE_WARN = 2;
export const YANDERE_LIMIT = 4;
const FAMILY = ['mother', 'father', 'sibling', 'child'];

/** Someone your yandere would consider a rival. */
export function isRivalFor(g: Game, y: Person, p: Person): boolean {
  return p.id !== y.id && p.alive && p.status === 'alive' && p.gender === y.gender && g.ageOf(p) >= 18 && !FAMILY.includes(p.role) && p.persona !== 'yandere';
}

/** Called after you text someone. */
export function yandereNotices(g: Game, p: Person) {
  const y = yanderePartner(g);
  if (!y || !isRivalFor(g, y, p)) return;
  const n = sentThisMonth(g, p.id);
  if (n === YANDERE_WARN) {
    pushMsg(g, y.id, { from: y.id, text: `who’s ${p.name}? ♡ just asking~`, turn: g.s.turn + 1, kind: 'reaction' });
  } else if (n >= YANDERE_LIMIT && !g.flag(`ystrike:${p.id}`)) {
    g.setFlag(`ystrike:${p.id}`);
    yandereStrike(g, y, p);
  }
}

/** The rival disappears. Nobody is ever caught. */
export function yandereStrike(g: Game, y: Person, p: Person): string {
  const dark = darkCrimeOn();
  if (dark) {
    p.alive = false;
    p.status = 'dead';
    g.log(`🕯️ ${p.name} was found dead. The police have no leads.`, 'bad', p.id);
  } else {
    p.status = 'moved';
    g.log(`📦 ${p.name} suddenly moved away. They seemed terrified.`, 'bad', p.id);
  }
  p.memory.unshift({ clock: g.s.clock, text: dark ? 'Died. No suspects.' : 'Left town in a hurry', tone: 'bad' });
  pushMsg(g, y.id, { from: y.id, text: dark ? `${p.name} won’t bother us anymore ♡` : `${p.name} won’t be texting you again ♡`, turn: g.s.turn + 1, kind: 'reaction' });
  g.queue('yandere_news', { pid: p.id, yid: y.id, dark: dark ? 1 : 0 });
  return p.id;
}
