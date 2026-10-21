import type { Game } from '../Game';
import type { Gender } from '../types';
import { firstName, randomGender } from '../data/names';
import { ageGate } from '../rules/us';
import { makeMatch } from '../npc/match';
import { attractedTo } from '../npc/identity';
import { sendText } from '../phone/texts';

// Update 0.3 — dating app (18+). Every profile is an adult.

export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  bio: string;
  icon: string;
  match: number;
}

const BIOS = [
  'Coffee snob. Will judge your playlist.', 'Looking for someone to hike with.', 'Dog parent. Dog first, you second.',
  'Ask me about my sourdough.', 'Bad at texting, great at brunch.', 'Here for a good time and a long time.',
  'Gym, books, repeat.', 'Fluent in sarcasm.', 'Let’s get tacos and argue about movies.', 'Plant collector. 47 and counting.',
];
const ICONS = ['😎', '🌻', '🎧', '📚', '🏄', '🎨', '🍕', '🐶', '🌙', '⚽'];
export const SWIPES_PER_MONTH = 10;

export function swipesLeft(g: Game) {
  return g.flag('swipeMonth') === g.s.clock ? Math.max(0, SWIPES_PER_MONTH - g.flag('swipes')) : SWIPES_PER_MONTH;
}

export function nextProfile(g: Game): Profile {
  const lo = Math.max(18, g.age - 6);
  const hi = Math.max(lo, g.age + 8);
  const wanted = (['male', 'female', 'nonbinary'] as Gender[]).filter((x) => attractedTo(g.s.sexuality, g.s.gender, x));
  const gender = wanted.length ? g.pick(wanted) : randomGender();
  const match = Math.max(0.05, Math.min(0.9, 0.22 + g.s.stats.looks / 220 + g.s.stats.charm / 350 + (Math.random() - 0.5) * 0.2));
  return { name: firstName(gender), age: g.rand(lo, hi), gender, bio: g.pick(BIOS), icon: g.pick(ICONS), match };
}

export function swipe(g: Game, p: Profile, like: boolean): { matched: boolean; text: string } {
  if (!ageGate('dating', g).allowed) return { matched: false, text: 'Must be 18.' };
  if (swipesLeft(g) <= 0) return { matched: false, text: 'Out of swipes this month.' };
  if (g.flag('swipeMonth') !== g.s.clock) {
    g.setFlag('swipeMonth', g.s.clock);
    g.setFlag('swipes', 0);
  }
  g.inc('swipes');
  if (!like) return { matched: false, text: '' };
  if (p.age < 18 || !g.chance(p.match)) return { matched: false, text: `No match with ${p.name}.` };
  const m = makeMatch(g, 'talking', [p.age, p.age], { name: p.name, gender: p.gender, rel: 30, met: 'Spark', where: 'Spark (dating app)' });
  m.hasNumber = true;
  m.theyHaveNumber = true;
  m.attraction = 50;
  m.tags.push('stranger');
  sendText(g, m, 'appmatch', `${m.name}: "hey! we matched 😊 wanna grab coffee?"`);
  g.burst('hearts');
  return { matched: true, text: `It’s a match with ${p.name}! Find them in Messages.` };
}
