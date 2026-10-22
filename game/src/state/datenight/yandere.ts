import type { Person } from '../types';

// Update 0.12 — dating a yandere: possessive lines on dates, the spark fills twice as fast,
// a jealous text if you leave early, and morning outfit selfies.

export const isYandere = (p: Person | null | undefined) => p?.persona === 'yandere';
export const YANDERE_SPARK = 2;

export const YANDERE_DATE_LINES = [
  'You’re not looking at anyone else, right? Good ♡',
  'The waiter smiled at you. Should I be worried about the waiter~?',
  'I memorized your order. And your schedule. And your shoe size ♡',
  'If you ever leave me, I’ll just find you again~',
  'I could stare at you all night. I usually do ♡',
  'Say my name again. Just once more ♡',
  'Every second of you is mine, okay? Okay ♡',
];

export const YANDERE_LEAVE_TEXTS = [
  'you left early. who are you going to see? ♡',
  'it’s fine. I’m fine. I’ll just watch your location until you’re home~',
  'you didn’t even finish your dessert. someone more important? ♡',
];

export const YANDERE_OUTFITS = [
  '📷 {name}’s morning outfit: your hoodie and fuzzy socks',
  '📷 {name}’s morning outfit: a new look, posing in the mirror',
  '📷 {name}’s morning outfit: matching pajamas with your initials on them',
  '📷 {name}’s morning outfit: a T-shirt with your face printed on it',
];
export const YANDERE_MORNING = 'good morning my love~ I hope you get a nosebleed ♡';
