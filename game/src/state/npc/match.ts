import type { Game } from '../Game';
import type { Gender, Person, Role, Sexuality } from '../types';
import { attractedTo, pronounsFor } from './identity';
import { randomAvatar } from './generator';
import { firstName } from '../data/names';

// Update 0.4 — generate someone who could plausibly be into the player (and vice versa).

const GENDERS: Gender[] = ['male', 'female', 'nonbinary'];

export function makeMatch(g: Game, role: Role, ageRange: [number, number], o: Partial<Person> = {}): Person {
  const [lo, hi] = ageRange;
  const age = g.rand(lo, Math.max(lo, hi));
  const wanted = GENDERS.filter((x) => attractedTo(g.s.sexuality, g.s.gender, x));
  const gender = o.gender ?? g.pick(wanted.length ? wanted : GENDERS);
  const options: Sexuality[] = (['straight', 'gay', 'bi', 'pan'] as Sexuality[]).filter((s) => attractedTo(s, gender, g.s.gender));
  const p = g.addPerson(role, { age, gender, name: firstName(gender), ...o });
  p.sexuality = options.length ? g.pick(options) : 'bi';
  p.pronouns = pronounsFor(gender);
  p.look = randomAvatar(gender);
  return p;
}
