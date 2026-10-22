// Update 0.13 — quiz cards: 5 questions, 4 answers each, a timer per card.

export const QUIZ_CARDS = 5;
export const CARD_SECONDS = 12;

export interface Question { q: string; a: [string, string, string, string]; right: number }
const Q = (q: string, a: [string, string, string, string], right: number): Question => ({ q, a, right });

export const QUESTIONS: Record<string, Question[]> = {
  mixed: [
    Q('7 × 8 = ?', ['54', '56', '63', '48'], 1),
    Q('What is 15% of 200?', ['15', '20', '30', '35'], 2),
    Q('Solve: 3x + 4 = 19', ['x = 3', 'x = 5', 'x = 6', 'x = 7'], 1),
    Q('The capital of France is…', ['Lyon', 'Marseille', 'Paris', 'Nice'], 2),
    Q('Which planet is closest to the Sun?', ['Venus', 'Mercury', 'Mars', 'Earth'], 1),
    Q('A haiku has how many lines?', ['3', '4', '5', '14'], 0),
    Q('Water freezes at…', ['0 °C', '10 °C', '-10 °C', '32 °C'], 0),
    Q('Which is a prime number?', ['21', '27', '29', '33'], 2),
    Q('Who wrote "Romeo and Juliet"?', ['Dickens', 'Shakespeare', 'Austen', 'Homer'], 1),
    Q('The largest ocean is the…', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3),
    Q('√81 = ?', ['8', '9', '7', '81'], 1),
    Q('What gas do plants take in?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], 2),
    Q('Which word is a verb?', ['quickly', 'run', 'happy', 'blue'], 1),
    Q('The Great Wall is in…', ['Japan', 'India', 'China', 'Mongolia'], 2),
    Q('0.5 as a fraction is…', ['1/5', '1/2', '2/5', '5/1'], 1),
    Q('How many continents are there?', ['5', '6', '7', '8'], 2),
    Q('The angles of a triangle add up to…', ['90°', '180°', '270°', '360°'], 1),
    Q('Opposite of "ancient"?', ['old', 'modern', 'broken', 'tiny'], 1),
    Q('12² = ?', ['124', '144', '122', '24'], 1),
    Q('Which is a mammal?', ['Shark', 'Dolphin', 'Trout', 'Octopus'], 1),
  ],
  science: [
    Q('H₂O is…', ['salt', 'water', 'oxygen', 'hydrogen'], 1),
    Q('The powerhouse of the cell is the…', ['nucleus', 'ribosome', 'mitochondria', 'membrane'], 2),
    Q('Speed = distance ÷ …', ['mass', 'time', 'force', 'area'], 1),
    Q('Which is a noble gas?', ['Neon', 'Iron', 'Sodium', 'Carbon'], 0),
    Q('Sound travels fastest through…', ['air', 'vacuum', 'water', 'steel'], 3),
    Q('DNA is shaped like a…', ['circle', 'double helix', 'cube', 'triangle'], 1),
    Q('The pH of pure water is…', ['1', '5', '7', '14'], 2),
    Q('Newton’s third law: every action has…', ['no reaction', 'an equal and opposite reaction', 'twice the reaction', 'a delay'], 1),
  ],
  sat: [
    Q('"Benevolent" most nearly means…', ['kind', 'angry', 'lazy', 'loud'], 0),
    Q('"Ephemeral" most nearly means…', ['lasting', 'short-lived', 'heavy', 'shiny'], 1),
    Q('If 2x = 18, then x + 3 = ?', ['9', '12', '15', '21'], 1),
    Q('"Candid" most nearly means…', ['sweet', 'honest', 'hidden', 'brave'], 1),
    Q('A shirt costs $40 after a 20% discount. Original price?', ['$48', '$50', '$52', '$60'], 1),
    Q('"Meticulous" most nearly means…', ['careless', 'careful', 'quick', 'bored'], 1),
    Q('The average of 4, 8 and 12 is…', ['6', '8', '10', '12'], 1),
    Q('"Ubiquitous" most nearly means…', ['rare', 'everywhere', 'ugly', 'unknown'], 1),
  ],
  driving: [
    Q('A red octagon sign means…', ['Yield', 'Stop', 'Slow', 'No entry'], 1),
    Q('At a yellow light you should…', ['speed up', 'stop if it is safe', 'honk', 'turn'], 1),
    Q('You must signal…', ['never', 'before turning or changing lanes', 'only at night', 'after turning'], 1),
    Q('A solid line between lanes means…', ['pass freely', 'do not cross', 'bus lane', 'parking'], 1),
    Q('Headlights are needed…', ['only in snow', 'from dusk to dawn', 'never in cities', 'at noon'], 1),
    Q('A school bus with flashing red lights…', ['go around', 'stop', 'honk', 'flash back'], 1),
    Q('Following distance should be at least…', ['1 second', '3 seconds', '10 seconds', 'a car length'], 1),
  ],
};

export function pickQuestions(skin: string, seed: number): Question[] {
  const bank = QUESTIONS[skin] ?? QUESTIONS.mixed;
  const idx = bank.map((_, i) => i);
  let s = seed >>> 0;
  for (let i = idx.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, QUIZ_CARDS).map((i) => bank[i]);
}

export const quizScore = (right: number) => right / QUIZ_CARDS;
