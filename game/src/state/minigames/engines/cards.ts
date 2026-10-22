// Update 0.13 — real casino games. Blackjack (dealer hits to 17), five-card draw poker (one draw, ranked hands)
// and three-reel slots. Each returns a score: 1 = win, 0.5 = push/small, 0 = loss; the casino activity pays on it.

export interface Card { rank: number; suit: number }
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const cardLabel = (c: Card) => `${RANKS[c.rank]}${SUITS[c.suit]}`;
export const isRed = (c: Card) => c.suit === 1 || c.suit === 2;

export function deck(seed: number): Card[] {
  const d: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) d.push({ rank: r, suit: s });
  let x = seed >>> 0;
  for (let i = d.length - 1; i > 0; i--) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1);
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ---------------------------------------------------------------- blackjack
const bjValue = (c: Card) => (c.rank === 12 ? 11 : c.rank >= 8 ? 10 : c.rank + 2);
export function handValue(h: Card[]) {
  let v = h.reduce((a, c) => a + bjValue(c), 0);
  let aces = h.filter((c) => c.rank === 12).length;
  while (v > 21 && aces--) v -= 10;
  return v;
}
/** The dealer draws to 17. */
export function dealerPlay(hand: Card[], d: Card[]): Card[] {
  const h = [...hand];
  while (handValue(h) < 17 && d.length) h.push(d.pop()!);
  return h;
}
export function blackjackResult(player: Card[], dealer: Card[]): 'win' | 'push' | 'lose' {
  const p = handValue(player);
  const q = handValue(dealer);
  if (p > 21) return 'lose';
  if (q > 21 || p > q) return 'win';
  return p === q ? 'push' : 'lose';
}

// ---------------------------------------------------------------- poker (five-card draw)
export const HANDS = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];
export function pokerRank(h: Card[]): number {
  const ranks = h.map((c) => c.rank).sort((a, b) => a - b);
  const counts = Object.values(ranks.reduce<Record<number, number>>((m, r) => ((m[r] = (m[r] ?? 0) + 1), m), {})).sort((a, b) => b - a);
  const flush = h.every((c) => c.suit === h[0].suit);
  const straight = new Set(ranks).size === 5 && (ranks[4] - ranks[0] === 4 || ranks.join() === '0,1,2,3,12');
  if (straight && flush) return 8;
  if (counts[0] === 4) return 7;
  if (counts[0] === 3 && counts[1] === 2) return 6;
  if (flush) return 5;
  if (straight) return 4;
  if (counts[0] === 3) return 3;
  if (counts[0] === 2 && counts[1] === 2) return 2;
  if (counts[0] === 2) return 1;
  return 0;
}
/** win with two pair or better, push with a pair */
export const pokerScore = (rank: number) => (rank >= 2 ? 1 : rank === 1 ? 0.5 : 0);

// ---------------------------------------------------------------- slots
export const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎'];
/** three of a kind = 1, a pair = 0.5 */
export function slotScore(reels: number[]) {
  const [a, b, c] = reels;
  if (a === b && b === c) return 1;
  return a === b || b === c || a === c ? 0.5 : 0;
}
