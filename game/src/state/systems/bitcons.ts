import type { Game } from '../Game';

// Update 0.12 final touch — the Bitcons wallet (a desktop app). The price moves every month; buying and selling
// costs a 1% fee. PC mining now pays into the wallet in Bitcons.

export interface Wallet {
  coins: number;
  price: number;
  /** price at the end of each month, newest last */
  history: number[];
}

export const BTC_START = 40000;
export const BTC_FLOOR = 1500;
export const BTC_FEE = 0.01;
export const BTC_HISTORY = 24;
/** smallest amount you can trade */
export const BTC_MIN = 0.0001;

export const blankWallet = (): Wallet => ({ coins: 0, price: BTC_START, history: [BTC_START] });

export const roundCoins = (n: number) => Math.floor(n / BTC_MIN + 1e-6) * BTC_MIN;
export const walletValue = (g: Game) => g.s.wallet.coins * g.s.wallet.price;
export const fmtCoins = (n: number) => `₿${n.toFixed(4)}`;

/** Monthly: a volatile random walk, with the odd crash or moon. */
export function bitconsMonth(g: Game) {
  const w = g.s.wallet;
  const r = Math.random();
  let move = 1.01 + (Math.random() - 0.5) * 0.24;
  if (r < 0.03) move = 0.55 + Math.random() * 0.15;
  else if (r > 0.97) move = 1.4 + Math.random() * 0.3;
  w.price = Math.max(BTC_FLOOR, Math.round(w.price * move));
  w.history = [...w.history, w.price].slice(-BTC_HISTORY);
  if (w.coins > 0 && move < 0.75) g.log(`📉 Bitcons crashed ${Math.round((1 - move) * 100)}%. Your wallet bled.`, 'bad');
  else if (w.coins > 0 && move > 1.35) g.log(`🚀 Bitcons mooned +${Math.round((move - 1) * 100)}%!`, 'money');
}

export function buyLock(g: Game, usd: number): string | null {
  if (usd <= 0) return 'Enter an amount';
  if (!g.canAfford(usd)) return 'Not enough money';
  if (roundCoins((usd * (1 - BTC_FEE)) / g.s.wallet.price) < BTC_MIN) return 'Too small';
  return null;
}

export function buyBitcons(g: Game, usd: number): string {
  if (buyLock(g, usd)) return '';
  const coins = roundCoins((usd * (1 - BTC_FEE)) / g.s.wallet.price);
  g.money(-usd);
  g.s.wallet.coins = roundCoins(g.s.wallet.coins + coins);
  return `Bought ${fmtCoins(coins)}.`;
}

export function sellLock(g: Game, coins: number): string | null {
  if (coins < BTC_MIN) return 'Enter an amount';
  if (coins > g.s.wallet.coins + 1e-9) return 'Not enough Bitcons';
  return null;
}

export function sellBitcons(g: Game, coins: number): string {
  if (sellLock(g, coins)) return '';
  const w = g.s.wallet;
  const usd = Math.round(coins * w.price * (1 - BTC_FEE));
  w.coins = Math.max(0, roundCoins(w.coins - coins));
  g.money(usd);
  return `Sold ${fmtCoins(coins)} for $${usd.toLocaleString()}.`;
}

/** Mining (and anything else that pays in coins): dollars → Bitcons at today's price. */
export function depositUsd(g: Game, usd: number): number {
  const coins = roundCoins(usd / g.s.wallet.price);
  g.s.wallet.coins = roundCoins(g.s.wallet.coins + coins);
  return coins;
}
