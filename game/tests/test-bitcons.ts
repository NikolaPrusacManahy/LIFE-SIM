// Update 0.12 — the Bitcons wallet: buy/sell with a fee, monthly price moves, mining pays into the wallet.
import { check, done } from './harness';
import { createLife, randomLook } from '../src/state/newGame';
import { hydrate } from '../src/state/save';
import { BTC_FEE, BTC_FLOOR, BTC_HISTORY, BTC_START, bitconsMonth, buyBitcons, buyLock, sellBitcons, sellLock, walletValue } from '../src/state/systems/bitcons';
import { netWorth } from '../src/state/systems/finance';
import { pcMonth } from '../src/state/pc/build';
import { PARTS } from '../src/state/pc/parts';

const mk = () => {
  const g = createLife({ name: 'B', familyName: 'C', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23 });
  g.s.money = 100000;
  return g;
};

{
  const g = mk();
  check('a new life starts with an empty wallet at the starting price', g.s.wallet.coins === 0 && g.s.wallet.price === BTC_START);
  const old = JSON.parse(JSON.stringify(g.s));
  delete old.wallet;
  check('old saves get a wallet', hydrate(old)?.wallet.price === BTC_START);
  check('cannot buy more than you have', !!buyLock(g, 200000) && !!buyLock(g, 0));
  const nw0 = netWorth(g);
  buyBitcons(g, 10000);
  const coins = g.s.wallet.coins;
  check('buying spends the dollars and adds coins (minus the fee)', g.s.money === 90000 && Math.abs(coins * BTC_START - 10000 * (1 - BTC_FEE)) < 5);
  check('net worth counts the wallet', Math.abs(netWorth(g) - (nw0 - 10000 * BTC_FEE)) < 10);
  check('cannot sell more than you hold', !!sellLock(g, coins + 1));
  sellBitcons(g, coins);
  check('selling everything empties the wallet and pays out (fee both ways)', g.s.wallet.coins === 0 && g.s.money > 99000 && g.s.money < 100000);
}

{
  const g = mk();
  let low = Infinity;
  for (let i = 0; i < 600; i++) {
    bitconsMonth(g);
    low = Math.min(low, g.s.wallet.price);
  }
  check('the price moves every month and never drops below the floor', low >= BTC_FLOOR && g.s.wallet.history.length === BTC_HISTORY);
  check('the chart keeps the last 24 months', g.s.wallet.history[BTC_HISTORY - 1] === g.s.wallet.price);
}

{
  const g = mk();
  g.give('pc');
  g.s.pc.parts = { ...g.s.pc.parts, gpu: PARTS.find((x) => x.slot === 'gpu')!.id };
  g.s.pc.score = 60;
  g.s.pc.mining = true;
  g.s.pc.noPaste = false;
  g.s.pc.built = g.s.clock;
  const cash = g.s.money;
  pcMonth(g);
  check('mining pays Bitcons into the wallet; the electricity bill is cash', g.s.wallet.coins > 0 && g.s.money < cash && walletValue(g) > 0);
}

done();
