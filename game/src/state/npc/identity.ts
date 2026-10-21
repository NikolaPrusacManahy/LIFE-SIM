import type { Game } from '../Game';
import type { Gender, Person, Pronouns, Sexuality } from '../types';

// Update 0.4 — identity: pronouns, sexuality, mutual attraction, romance eligibility.

export const PRONOUNS: Record<'he' | 'she' | 'they', Pronouns> = {
  he: { subj: 'he', obj: 'him', poss: 'his', plural: false, label: 'he/him' },
  she: { subj: 'she', obj: 'her', poss: 'her', plural: false, label: 'she/her' },
  they: { subj: 'they', obj: 'them', poss: 'their', plural: true, label: 'they/them' },
};

export const pronounsFor = (g: Gender): Pronouns => ({ ...(g === 'male' ? PRONOUNS.he : g === 'female' ? PRONOUNS.she : PRONOUNS.they) });

export const GENDER_SYMBOL: Record<Gender, string> = { male: '♂', female: '♀', nonbinary: '⚧' };
export const GENDER_NOUN: Record<Gender, string> = { male: 'guy', female: 'girl', nonbinary: 'non-binary people' };

export const SEXUALITY_LABEL: Record<Sexuality, string> = {
  straight: 'Straight', gay: 'Gay / Lesbian', bi: 'Bisexual', pan: 'Pansexual', ace: 'Asexual', unsure: 'Unsure',
};

/** NPC sexuality distribution. */
export function rollSexuality(r = Math.random()): Sexuality {
  if (r < 0.72) return 'straight';
  if (r < 0.8) return 'gay';
  if (r < 0.92) return 'bi';
  if (r < 0.96) return 'pan';
  return 'ace';
}

/** Is someone with this sexuality and gender attracted to `other`? */
export function attractedTo(sexuality: Sexuality, self: Gender, other: Gender): boolean {
  switch (sexuality) {
    case 'straight':
      if (self === 'nonbinary') return other !== 'nonbinary';
      return other !== self && other !== 'nonbinary';
    case 'gay':
      return other === self;
    case 'bi':
    case 'pan':
    case 'unsure':
      return true;
    case 'ace':
      return true; // romantic attraction is possible; intimacy consent is lower (see intimacy.ts)
  }
}

export const isTeacher = (p: Person) => p.role === 'teacher' || p.labels.includes('teacher');
const FAMILY = new Set(['mother', 'father', 'sibling', 'child']);

/**
 * Romance needs: mutual attraction, a safe age band (both under 18 within ±2 years, or both 18+),
 * never family, never a high-school teacher. Professors are adults and follow the adult rule.
 */
export function isRomanceEligible(g: Game, p: Person): boolean {
  if (!p.alive || FAMILY.has(p.role) || isTeacher(p) || p.status !== 'alive') return false;
  // Update 0.8 — online contacts: only after meeting in person; a revealed minor is never an option again
  if (p.tags.includes('noRomance') || (p.tags.includes('online') && !p.tags.includes('verified'))) return false;
  const a = g.age;
  const b = g.ageOf(p);
  const bandOk = (a < 18 && b < 18 && Math.abs(a - b) <= 2) || (a >= 18 && b >= 18);
  if (!bandOk) return false;
  return attractedTo(g.s.sexuality, g.s.gender, p.gender) && attractedTo(p.sexuality, p.gender, g.s.gender);
}

/** Why romance isn't possible — used for rejection flavour. */
export function romanceBlock(g: Game, p: Person): string | null {
  if (isTeacher(p)) return 'Teachers are off-limits';
  const a = g.age;
  const b = g.ageOf(p);
  if (!((a < 18 && b < 18 && Math.abs(a - b) <= 2) || (a >= 18 && b >= 18))) return 'Not appropriate';
  if (!attractedTo(p.sexuality, p.gender, g.s.gender)) return `${cap(p.pronouns.subj)}${p.pronouns.plural ? '’re' : '’s'} not into ${GENDER_NOUN[g.s.gender]}${g.s.gender === 'nonbinary' ? '' : 's'}`;
  if (!attractedTo(g.s.sexuality, g.s.gender, p.gender)) return 'You’re not into them';
  return null;
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Resolve pronoun tokens: {name} {They} {they} {them} {their} {Their} {is} {s} (verb agreement) and {player}. */
export function say(text: string, p: { name: string; pronouns: Pronouns } | null, playerName = 'you'): string {
  if (!p) return text.replace(/\{player\}/g, playerName);
  const pr = p.pronouns;
  return text
    .replace(/\{name\}/g, p.name)
    .replace(/\{They\}/g, cap(pr.subj))
    .replace(/\{they\}/g, pr.subj)
    .replace(/\{Them\}/g, cap(pr.obj))
    .replace(/\{them\}/g, pr.obj)
    .replace(/\{Their\}/g, cap(pr.poss))
    .replace(/\{their\}/g, pr.poss)
    .replace(/\{is\}/g, pr.plural ? 'are' : 'is')
    .replace(/\{was\}/g, pr.plural ? 'were' : 'was')
    .replace(/\{s\}/g, pr.plural ? '' : 's')
    .replace(/\{es\}/g, pr.plural ? '' : 'es')
    .replace(/\{have\}/g, pr.plural ? 'have' : 'has')
    .replace(/\{do\}/g, pr.plural ? 'do' : 'does')
    .replace(/\{player\}/g, playerName);
}
