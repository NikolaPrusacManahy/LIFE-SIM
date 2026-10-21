import type { Gender } from '../types';

const MALE = [
  'Liam', 'Noah', 'Mateo', 'Elijah', 'Lucas', 'Marcus', 'Dante', 'Jaylen', 'Ezra', 'Caleb', 'Owen', 'Luca', 'Theo',
  'Andre', 'Mikhail', 'Kai', 'Darius', 'Rafael', 'Wyatt', 'Jesse', 'Tommy', 'Vincent', 'Malik', 'Hugo', 'Nikola',
  'Sal', 'Frankie', 'Cole', 'Bo', 'Hank', 'Reggie', 'Omar', 'Felix', 'Ivan', 'Dmitri', 'Kenji', 'Silas',
];
const FEMALE = [
  'Olivia', 'Emma', 'Sofia', 'Mia', 'Ava', 'Zara', 'Luna', 'Maya', 'Nia', 'Chloe', 'Isla', 'Gianna', 'Rosa',
  'Valentina', 'Tasha', 'Jade', 'Ruby', 'Daisy', 'Lena', 'Kira', 'Amara', 'Bella', 'Carmen', 'Dolly', 'June',
  'Mae', 'Priya', 'Yuki', 'Ines', 'Sasha', 'Elena', 'Lucia', 'Nora', 'Hazel', 'Wren', 'Teresa', 'Ana',
];
const NEUTRAL = ['Alex', 'Sam', 'Jordan', 'Riley', 'Quinn', 'Avery', 'Rowan', 'Skyler', 'Charlie', 'Emery', 'River', 'Sage'];
const LAST = [
  'Rivera', 'Novak', 'Kowalski', 'Johnson', 'Moretti', 'Carter', 'Nguyen', 'Okafor', 'Silva', 'Petrov', 'Walsh',
  'Brooks', 'Hayes', 'Romano', 'Kim', 'Garcia', 'Delgado', 'Whitaker', 'Mills', 'Sato', 'Bianchi', 'Stone', 'Price',
  'Holloway', 'Jovanovic', 'Abara', 'Reyes', 'McCoy', 'Dunn', 'Vega', 'Fischer', 'Harlow', 'Banks', 'Cruz',
];
const NICK = ['Ace', 'Smoke', 'Lucky', 'Tiny', 'Knuckles', 'Ghost', 'Razor', 'Sly', 'Bones', 'Junior', 'Rook', 'Fats', 'Duke', 'Viper'];

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function firstName(g: Gender): string {
  if (g === 'male') return pick(MALE);
  if (g === 'female') return pick(FEMALE);
  return Math.random() < 0.6 ? pick(NEUTRAL) : pick([...MALE, ...FEMALE]);
}
export const lastName = () => pick(LAST);
export const nickname = () => pick(NICK);
export const randomGender = (): Gender => (Math.random() < 0.48 ? 'male' : Math.random() < 0.92 ? 'female' : 'nonbinary');
