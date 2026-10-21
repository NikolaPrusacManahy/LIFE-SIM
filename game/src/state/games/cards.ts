// Update 0.8 — Golf Solitaire and Word Duel: pure rules (tested).

// ---------------- Golf Solitaire: 7 columns of 5; play the top card of any column if it's one rank above/below the pile.
export interface GolfState {
  cols: number[][];
  stock: number[];
  pile: number;
}

export function dealGolf(rnd = Math.random): GolfState {
  const deck = Array.from({ length: 52 }, (_, i) => (i % 13) + 1);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const cols = Array.from({ length: 7 }, (_, c) => deck.slice(c * 5, c * 5 + 5));
  const stock = deck.slice(35);
  return { cols, pile: stock.pop()!, stock };
}

export const canPlay = (s: GolfState, col: number) => {
  const top = s.cols[col][s.cols[col].length - 1];
  return top !== undefined && Math.abs(top - s.pile) === 1;
};

export function playCol(s: GolfState, col: number): boolean {
  if (!canPlay(s, col)) return false;
  s.pile = s.cols[col].pop()!;
  return true;
}

export function drawStock(s: GolfState): boolean {
  if (!s.stock.length) return false;
  s.pile = s.stock.pop()!;
  return true;
}

export const golfLeft = (s: GolfState) => s.cols.reduce((a, c) => a + c.length, 0);
export const golfStuck = (s: GolfState) => !s.stock.length && !s.cols.some((_, i) => canPlay(s, i));

// ---------------- Word Duel: Wordle-style marks, you vs a friend's guesses.
export const WORDS = ['APPLE', 'BRAVE', 'CRANE', 'DREAM', 'EAGLE', 'FLAME', 'GHOST', 'HEART', 'JUICE', 'LEMON', 'MANGO', 'NIGHT', 'OCEAN', 'PIANO', 'QUEEN', 'RIVER', 'STORM', 'TIGER', 'UNCLE', 'VOICE', 'WATER', 'YOUTH', 'ZEBRA', 'CLOUD', 'PLANT', 'SMILE', 'TRAIN', 'BREAD', 'CHAIR', 'MUSIC'];

export type Mark = 'hit' | 'near' | 'miss';

export function markGuess(guess: string, answer: string): Mark[] {
  const g = guess.toUpperCase().split('');
  const a = answer.toUpperCase().split('');
  const out: Mark[] = g.map(() => 'miss');
  const left: Record<string, number> = {};
  g.forEach((ch, i) => {
    if (ch === a[i]) out[i] = 'hit';
    else left[a[i]] = (left[a[i]] ?? 0) + 1;
  });
  g.forEach((ch, i) => {
    if (out[i] !== 'hit' && left[ch]) {
      out[i] = 'near';
      left[ch]--;
    }
  });
  return out;
}

/** How many guesses the NPC friend needs (smarter friends are quicker). */
export const friendGuesses = (smarts: number, rnd = Math.random) => Math.max(2, Math.min(6, Math.round(5.5 - smarts / 40 + (rnd() - 0.5) * 2)));
