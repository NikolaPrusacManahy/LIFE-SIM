import type { Game } from '../Game';
import type { Gender, Person } from '../types';
import { makeMatch } from './match';

// Update 0.12 — personas: people who sound (and want) like who they are. Shown on profiles and on Spark.
// Yanderes are adults only, always the opposite sex to you, and always stunning. Their profile says only
// "maybe a bit passionate" — the truth is hidden.

// Update 0.12 (activity additions) — book nerd, gamer, gyaru, gold digger
export type Persona = 'yandere' | 'shy' | 'otaku' | 'nerd' | 'booknerd' | 'gamer' | 'gyaru' | 'golddigger';

export const PERSONA: Record<Persona, { name: string; icon: string; /** what other people (and Spark) see */ shown: string; desc: string }> = {
  yandere: { name: 'Yandere', icon: '💗', shown: '💗 Maybe a bit passionate', desc: 'Loves you. Only you. Forever.' },
  shy: { name: 'Shy', icon: '🙈', shown: '🙈 Shy', desc: 'Stutters, blushes, means every word.' },
  otaku: { name: 'Otaku', icon: '🎌', shown: '🎌 Otaku', desc: 'Anime, manga, Japan. Desu.' },
  nerd: { name: 'Tech nerd', icon: '🖥️', shown: '🖥️ Tech nerd', desc: 'Builds PCs, speaks in benchmarks.' },
  booknerd: { name: 'Book nerd', icon: '📚', shown: '📚 Book nerd', desc: 'Lives in books. Talks like one.' },
  gamer: { name: 'Gamer', icon: '🎮', shown: '🎮 Gamer', desc: 'GG. Would rather call on Discorb.' },
  gyaru: { name: 'Gyaru', icon: '💅', shown: '💅 Gyaru', desc: 'Blonde, glam, popular — and judging you.' },
  golddigger: { name: 'Gold digger', icon: '💰', shown: '💰 Gold digger', desc: 'Everything has a price. Even love.' },
};

/** Update 0.12 — gyaru are college-age women only. */
export const gyaruOk = (age: number, gender: Gender) => gender === 'female' && age >= 18 && age <= 24;

/** The persona label people see (a yandere's real one stays hidden). */
export const personaShown = (p: Pick<Person, 'persona'>) => (p.persona ? PERSONA[p.persona].shown : '');

/** The opposite sex to you (a yandere's only target). Non-binary lives: either. */
export const oppositeOf = (g: Game): Gender => (g.s.gender === 'male' ? 'female' : g.s.gender === 'female' ? 'male' : g.pick(['male', 'female']));

/** Can this person have this persona? (yandere: adults, opposite sex; gyaru: college-age women; gold digger: adults) */
export function personaOk(g: Game, persona: Persona, age: number, gender: Gender): boolean {
  if (persona === 'yandere') return age >= 18 && g.age >= 18 && gender === oppositeOf(g);
  if (persona === 'gyaru') return gyaruOk(age, gender);
  if (persona === 'golddigger') return age >= 18;
  return true;
}

/** Roll a persona for someone new (minors are never yanderes). `bias`: who you'd expect to meet here. */
export function rollPersona(g: Game, age: number, gender: Gender, allowYandere = true, bias: Persona[] = []): Persona | undefined {
  const fits = bias.filter((x) => personaOk(g, x, age, gender) && (x !== 'yandere' || allowYandere));
  if (fits.length && g.chance(0.65)) return g.pick(fits);
  const r = Math.random();
  if (allowYandere && personaOk(g, 'yandere', age, gender) && r < 0.04) return 'yandere';
  if (r < 0.11) return 'shy';
  if (r < 0.16) return 'otaku';
  if (r < 0.21) return 'nerd';
  if (r < 0.26) return 'booknerd';
  if (r < 0.32) return 'gamer';
  if (r < 0.35 && personaOk(g, 'golddigger', age, gender)) return 'golddigger';
  if (r < 0.38 && gyaruOk(age, gender)) return 'gyaru';
  return undefined;
}

/** Make a yandere: an adult of the opposite sex, attracted to you, stunning. */
export function makeYandere(g: Game, role: Person['role'], where: string): Person | null {
  if (g.age < 18) return null;
  const lo = Math.max(18, g.age - 5);
  const p = makeMatch(g, role, [lo, Math.max(lo, g.age + 6)], { gender: oppositeOf(g), met: g.dateLabel, where });
  p.persona = 'yandere';
  p.attraction = 85;
  p.mood = 70;
  if (!p.tags.includes('stunning')) p.tags.push('stunning');
  return p;
}

/** Give someone a persona (and the look that goes with it). */
export function setPersona(p: Person, persona: Persona | undefined) {
  p.persona = persona;
  if (persona === 'yandere' && !p.tags.includes('stunning')) p.tags.push('stunning');
  // gyaru: always blonde, always accessorised
  if (persona === 'gyaru' && p.look) {
    p.look.hair = 5;
    p.look.accessory = 'kurt';
  }
}

/** Committed roles a yandere treats as "theirs". */
export const YANDERE_HOLD = ['talking', 'dating', 'partner', 'engaged', 'spouse'];
/** Your yandere partner, if you have one. */
export const yanderePartner = (g: Game) =>
  g.s.people.find((p) => p.persona === 'yandere' && p.alive && p.status === 'alive' && YANDERE_HOLD.includes(p.role)) ?? null;
