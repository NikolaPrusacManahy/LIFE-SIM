// Update 0.12 — Hackr: VPN required, adults only, never on a library PC; riddle hints, 3 tries; loot.
import { check, done } from './harness';
import { createLife, randomLook } from '../src/state/newGame';
import { hydrate } from '../src/state/save';
import { openSession } from '../src/state/pc/session';
import { HACK_TRIES, LEAKS_PER_MONTH, RIDDLES, VPN_PRICE, buyVpn, chargeCard, guess, hackLock, leaksFor, takeWallet } from '../src/state/web/hack';

const mk = (age: 14 | 23 = 23) => {
  const g = createLife({ name: 'K', familyName: 'R', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: age });
  g.s.money = 5000;
  g.give('laptop');
  openSession(g, 'laptop');
  return g;
};

{
  const kid = mk(14);
  kid.s.web.installed.push('vpn');
  check('minors can’t hack', hackLock(kid) === 'Must be 18');
  const g = mk();
  check('no VPN, no Hackr', hackLock(g)?.includes('VPN') === true);
  const lib = mk();
  lib.s.session = null;
  openSession(lib, 'library');
  lib.s.web.installed.push('vpn');
  check('never on a library PC (and no VPN download there)', !!hackLock(lib) && buyVpn(lib).includes('library'));
  buyVpn(g);
  check('the VPN costs money and unlocks Hackr', g.s.money === 5000 - VPN_PRICE && hackLock(g) === null);
  const old = JSON.parse(JSON.stringify(g.s));
  delete old.hack;
  check('old saves get a Hackr state', hydrate(old)?.hack.leaks.length === 0);
}

{
  const g = mk();
  buyVpn(g);
  const leaks = leaksFor(g);
  check(`${LEAKS_PER_MONTH} leaks a month, all adults, each with a hint and ${HACK_TRIES} tries`, leaks.length === LEAKS_PER_MONTH && leaks.every((l) => l.age >= 18 && l.hint && l.tries === HACK_TRIES));
  check('the same month shows the same leaks', leaksFor(g) === leaks);
  check('every riddle answer is a single lowercase word', RIDDLES.every(([, a]) => /^[a-z]+$/.test(a)));
  const left = g.s.session!.left;
  const a = leaks[0];
  guess(g, a.id, 'nope');
  guess(g, a.id, 'nope2');
  check('the first guess uses one computer action, later ones are free', g.s.session!.left === left - 1 && a.tries === 1);
  const heat = g.s.heat;
  guess(g, a.id, 'nope3');
  check('3 wrong guesses lock the account and add heat', a.status === 'locked' && g.s.heat > heat);
  const b = leaks[1];
  guess(g, b.id, `  ${b.answer.toUpperCase()} `);
  check('the right word cracks it (case and spaces ignored)', b.status === 'cracked' && g.flag('hacks') === 1);
}

{
  let cards = 0;
  let wallets = 0;
  let ok = true;
  for (let i = 0; i < 150; i++) {
    const g = mk();
    buyVpn(g);
    for (const l of leaksFor(g)) {
      guess(g, l.id, l.answer);
      const m = g.s.money;
      const c = g.s.wallet.coins;
      if (l.loot === 'card') { cards++; chargeCard(g, l.id); if (g.s.money <= m || !l.taken || chargeCard(g, l.id)) ok = false; }
      if (l.loot === 'wallet') { wallets++; takeWallet(g, l.id); if (g.s.wallet.coins <= c || !l.taken) ok = false; }
    }
  }
  check('when lucky: credit cards and Bitcons wallets', cards > 100 && wallets > 20, `${cards} cards, ${wallets} wallets`);
  check('a card pays once; a wallet moves into yours', ok);
}

done();
