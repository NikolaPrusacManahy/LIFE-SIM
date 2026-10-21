import type { Game } from '../Game';
import type { Role } from '../types';
import { lastName } from '../data/names';
import { relabel } from '../npc/labels';
import { sendText } from '../phone/texts';
import { ensureGroups } from '../phone/chat';

export { interact, interactionsFor } from '../npc/interactions';

export const ROLE_LABEL: Record<Role, string> = {
  mother: 'Mother', father: 'Father', sibling: 'Sibling', friend: 'Friend', crush: 'Crush', partner: 'Partner',
  spouse: 'Spouse', ex: 'Ex', child: 'Child', crew: 'Crew', rival: 'Rival', mentor: 'Mentor', coworker: 'Coworker', fling: 'Fling',
  acquaintance: 'Acquaintance', talking: 'Talking', dating: 'Dating', engaged: 'Engaged', teacher: 'Teacher', professor: 'Professor',
};
export const ROLE_ICON: Record<Role, string> = {
  mother: '👩', father: '👨', sibling: '🧒', friend: '🤝', crush: '💘', partner: '❤️', spouse: '💍', ex: '💔',
  child: '👶', crew: '🕶️', rival: '😠', mentor: '🧓', coworker: '💼', fling: '🌙',
  acquaintance: '👋', talking: '💬', dating: '🌹', engaged: '💍', teacher: '🍎', professor: '🎓',
};

const FAMILY: Role[] = ['mother', 'father', 'sibling', 'child'];

/** Monthly: decay, neglect, birthdays, NPC life events, deaths, babies. */
export function relationshipsMonth(g: Game) {
  const s = g.s;
  ensureGroups(g);
  for (const p of s.people) {
    if (!p.alive) continue;
    const age = g.ageOf(p);
    const sinceContact = s.clock - (p.lastContact ?? s.clock);
    // friends fade faster than family
    if (!FAMILY.includes(p.role) && p.role !== 'spouse' && p.rel > 25) p.rel -= sinceContact > 2 ? 1.6 : 0.6;
    if (FAMILY.includes(p.role) && sinceContact > 6 && p.rel > 30) p.rel -= 0.4;
    if (['partner', 'spouse', 'engaged', 'dating'].includes(p.role)) {
      p.romance = Math.max(0, p.romance - (sinceContact > 1 ? 2 : 0.5));
      if ((p.romance < 15 || p.rel < 15) && !g.queued('breakup')) g.queue('breakup', { pid: p.id });
    }
    if (p.role === 'acquaintance' && sinceContact > 6 && p.rel < 20) p.status = 'moved';
    p.mood = Math.max(10, Math.min(95, p.mood + (Math.random() - 0.5) * 30));
    relabel(g, p);

    // birthdays of people who matter
    if (p.birthMonth === g.month && p.status === 'alive' && (FAMILY.includes(p.role) || ['partner', 'spouse', 'engaged', 'dating'].includes(p.role) || p.tags.includes('bestie'))) {
      sendText(g, p, 'birthday', `🎂 It’s ${p.name}’s birthday today!`);
    }

    // NPC life goes on
    if (p.status === 'alive' && !FAMILY.includes(p.role) && p.hasNumber && g.chance(0.008)) npcLifeEvent(g, p.id);

    // natural death of older people
    if (age >= 60) {
      const pDie = 0.0012 * Math.pow(1.11, age - 60);
      if (g.chance(pDie)) {
        p.alive = false;
        p.status = 'dead';
        if (FAMILY.includes(p.role) || p.role === 'spouse') g.queue('death_in_family', { pid: p.id });
      }
    }
  }
  // baby arrives
  if (g.flag('babyPending') && s.clock >= g.flag('pregnantUntil')) {
    s.flags.babyPending = 0;
    g.queue('baby_born', {}, true);
  }
}

function npcLifeEvent(g: Game, pid: string) {
  const p = g.personById(pid)!;
  const age = g.ageOf(p);
  const r = Math.random();
  if (r < 0.3 && age >= 17) {
    p.status = 'moved';
    sendText(g, p, 'news', `${p.name}: "Big news — I’m moving across the country! I’ll miss you."`);
  } else if (r < 0.5 && age >= 22 && !p.tags.includes('married')) {
    p.tags.push('married');
    sendText(g, p, 'news', `${p.name}: "I’m getting married!! 💍"`);
  } else if (r < 0.65 && age >= 22 && age <= 45) {
    sendText(g, p, 'news', `${p.name}: "We had a baby! 👶"`);
  } else if (r < 0.75 && age >= 18) {
    p.status = 'jail';
    sendText(g, p, 'news', `${p.name}: "Got arrested. Long story. Don’t tell anyone."`);
  } else if (age >= 17 && age <= 25) {
    sendText(g, p, 'news', `${p.name}: "I got into college!! 🎓"`);
  }
}

export function makeBaby(g: Game, name: string) {
  const kid = g.addPerson('child', { name, age: 0, bornMonths: g.s.clock, rel: 80, surname: g.s.familyName, met: 'Birth' });
  g.achieve('parent');
  g.milestone(`Became a parent to ${kid.name}`);
  return kid;
}

export const surname = () => lastName();
