// Update 0.11 — Stats on steroids: buy stat levels (100 a level, $ or €), raise max health/energy to 300, never karma.
import { check, done } from './harness';
import { createLife, randomLook } from '../src/state/newGame';
import { BOOST_STATS, CAP_MAX, boostCost, boostLock, boostStat, capCost, capLock, levelPrice, raiseCap } from '../src/state/systems/boost';
import { USD_PER_EUR } from '../src/state/rules/us';
import { toEuros } from '../src/ui/currency';
import { hydrate } from '../src/state/save';

const mk = (rules: 'us' | 'eu' = 'us') => {
  const g = createLife({ name: 'S', familyName: 'T', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23, rules });
  g.s.money = 100000;
  return g;
};

// ---------- price: 100 a level in your own currency
{
  const us = mk();
  const eu = mk('eu');
  check('US: $100 a level', levelPrice(us) === 100);
  check('EU: €100 a level (shown as €100)', levelPrice(eu) === Math.round(100 * USD_PER_EUR) && toEuros(`$${levelPrice(eu)}`) === '€100');
  us.s.stats.smarts = 40;
  check('40 → 75 costs 35 levels = $3,500', boostCost(us, 'smarts', 75) === 3500);
}

// ---------- pick a level, pay, get it
{
  const g = mk();
  g.s.stats.charm = 30.4;
  const m0 = g.s.money;
  const txt = boostStat(g, 'charm', 90);
  check('boosting sets the stat exactly to the level you picked', g.s.stats.charm === 90 && txt.includes('90'));
  check('…and costs 100 per level (30 → 90 = 60 levels)', m0 - g.s.money === 6000, `${m0 - g.s.money}`);
  check('can’t go past 100', boostLock(g, 'charm', 101) === 'Max 100');
  check('can’t “buy” a level you already have', boostLock(g, 'charm', 50) === 'Already there');
  g.s.money = 50;
  check('needs the money', boostLock(g, 'looks', 100) === 'Not enough money' && boostStat(g, 'looks', 100) === '');
  // Update 0.12 — your correction: health & energy are raised only through their max
  check('stats can be bought, not karma, health or energy', BOOST_STATS.length === 7 && !(BOOST_STATS as string[]).some((k) => ['karma', 'health', 'energy'].includes(k)));
  check('health and energy can’t be bought as levels', boostLock(g, 'health', 100) === 'Can’t be bought' && boostLock(g, 'energy', 100) === 'Can’t be bought');
}

// ---------- max health & energy: 100 → up to 300
{
  const g = mk();
  check('max health and energy start at 100', g.maxOf('health') === 100 && g.maxOf('energy') === 100 && g.maxOf('smarts') === 100);
  check('raising max energy to 250 costs 150 levels', capCost(g, 'energy', 250) === 15000);
  raiseCap(g, 'energy', 250);
  check('max energy is now 250', g.maxOf('energy') === 250);
  g.stat('energy', 500);
  check('energy can now fill up to 250 (not 300, not 100)', g.s.stats.energy === 250);
  check('the cap stops at 300', capLock(g, 'energy', CAP_MAX + 1) === `Max ${CAP_MAX}`);
  raiseCap(g, 'health', 300);
  check('max health can be raised to 300', g.maxOf('health') === 300 && boostStat(g, 'health', 300) === '');
  check('other stats stay capped at 100', (g.stat('smarts', 500), g.s.stats.smarts <= 100));
  const old = hydrate(JSON.parse(JSON.stringify({ ...g.s, statCaps: undefined })));
  check('old saves load with max 100', old?.statCaps.health === 100 && old?.statCaps.energy === 100);
}

// ---------- sleeping fills the whole energy bar (your correction), including a raised max
{
  const g = mk();
  raiseCap(g, 'energy', 200);
  g.s.stats.energy = 20;
  g.s.phase = 3;
  g.doActivity('sleep');
  check('a night in bed fills energy to the max (200)', g.s.stats.energy === 200, `${g.s.stats.energy}`);
  const h = mk();
  h.s.housing = 'homeless';
  h.s.stats.energy = 10;
  h.s.phase = 3;
  h.doActivity('sleep');
  // night is the month's last slot: the monthly tick adds +10 on top
  check('…sleeping rough gives half (plus the month’s +10)', h.s.stats.energy >= 50 && h.s.stats.energy <= 60, `${h.s.stats.energy}`);
}

done();
