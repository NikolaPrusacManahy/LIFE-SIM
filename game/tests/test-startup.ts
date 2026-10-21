// Update 0.11 — START-UP: founding, team, development, investors, money, buildings, skills, status and diplomatic immunity.
import { check, done } from './harness';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import {
  costsOf, crunch, layOff, found, foundLock, headcount, hire, hireLock, launch, learnSkill, pitch, pitchOdds, revenueOf, sellCompany, startup,
  upgradeBuilding, valuationOf, wagesOf, refreshStatus, stakeValue,
} from '../src/state/startup/company';
import { startupMonth } from '../src/state/startup/month';
import { BUILDINGS, IDEAS, SKILLS, SKILL_ORDER, STATUS_POINTS } from '../src/state/startup/data';
import { capOf, dividendRate, marketing } from '../src/state/startup/company';
import { hydrate } from '../src/state/save';
import { untouchable } from '../src/state/systems/immunity';
import { sendToJail } from '../src/state/systems/crime';
import { riskCatch } from '../src/state/systems/trouble';
import { netWorth } from '../src/state/systems/finance';

const mk = (money = 200000): Game => {
  const g = createLife({ name: 'S', familyName: 'U', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23 });
  g.s.money = money;
  g.s.stats.charm = 70;
  g.s.stats.smarts = 80;
  return g;
};

// ---------- founding
{
  const g = mk();
  check('needs the minimum investment', foundLock(g, 'llm', 1000) !== null);
  check('custom name, starts in your room', found(g, 'Moonbeam AI', 'llm', 'normal', 50000).includes('Moonbeam AI') && startup(g)!.building === 'room' && startup(g)!.stake === 1);
  check('the money comes from you', g.s.money === 150000 && startup(g)!.cash === 50000);
  check('one company at a time', foundLock(g, 'game', 20000) === 'You already run a company');
  check('your share counts toward net worth', netWorth(g) >= g.s.money + stakeValue(g) - 1 && stakeValue(g) > 0);
}

// ---------- team: room fits 3; supervisors need 5 employees each; managers need an office
{
  const g = mk();
  found(g, '', 'social', 'normal', 20000);
  const c = startup(g)!;
  check('nameless companies get a default name', c.name === 'Social app Inc.');
  hire(g, 'employee', 3);
  check('your room fits 3', headcount(c) === 3 && hireLock(c, 'employee', 1) !== null);
  check('a manager needs an office', hireLock(c, 'manager') === 'Needs an office');
  c.cash = 100000;
  upgradeBuilding(g);
  check('moving to an office costs company cash and gives a skill point', c.building === 'office' && c.cash === 50000 && c.points === 1);
  hire(g, 'employee', 2);
  check('a supervisor needs 5 employees', hireLock(c, 'supervisor') === null && hire(g, 'supervisor').length > 0 && hireLock(c, 'supervisor') !== null);
  check('payroll adds up', wagesOf(c) === 5 * 4000 + 7000 && costsOf(c) === wagesOf(c) + BUILDINGS.office.rent);
}

// ---------- development → launch → revenue
{
  const g = mk();
  found(g, '', 'fashion', 'normal', 150000);
  const c = startup(g)!;
  hire(g, 'employee', 3);
  let months = 0;
  while (c.progress < 100 && months++ < 60) startupMonth(g);
  check('the team builds the product over the months', c.progress >= 100, `${months} months`);
  check('no revenue before launch', c.revenue === 0 && revenueOf(c) === 0);
  const pts = c.points;
  launch(g);
  check('launching starts revenue and gives a skill point', c.version === 1 && c.revenue > 0 && c.points === pts + 1);
  const r0 = revenueOf(c);
  c.points++;
  learnSkill(g, 'profit');
  check('Profit skill: +15% revenue', Math.abs(revenueOf(c) - r0 * 1.15) <= 2);
  const w0 = wagesOf(c);
  c.points++;
  learnSkill(g, 'payroll');
  check('Payroll skill: −10% wages', Math.abs(wagesOf(c) - w0 * 0.9) <= 1);
  const e0 = g.s.stats.energy;
  c.progress = 10;
  crunch(g);
  check('crunching yourself pushes development (and tires you)', c.progress > 10 && g.s.stats.energy < e0);
}

// ---------- appeal: easy pitches, low ceiling; moonshot the opposite
{
  const a = mk();
  const b = mk();
  const m = mk();
  found(a, '', 'phone', 'easy', 60000);
  found(b, '', 'phone', 'normal', 60000);
  found(m, '', 'phone', 'moonshot', 60000);
  for (const g of [a, b, m]) {
    const c = startup(g)!;
    c.version = 3;
    c.hype = 60;
    c.quality = 70;
  }
  check('easy appeals more to investors than moonshot', pitchOdds(a, startup(a)!) > pitchOdds(m, startup(m)!));
  check('ceiling: easy ½×, moonshot 2×', revenueOf(startup(a)!) * 2 === revenueOf(startup(b)!) || Math.abs(revenueOf(startup(a)!) * 2 - revenueOf(startup(b)!)) <= 2);
  check('…moonshot doubles it', Math.abs(revenueOf(startup(m)!) - revenueOf(startup(b)!) * 2) <= 2);
}

// ---------- investors: money for a share
{
  let deals = 0;
  for (let i = 0; i < 40 && deals === 0; i++) {
    const g = mk();
    found(g, '', 'game', 'easy', 20000);
    const c = startup(g)!;
    c.hype = 80;
    const cash0 = c.cash;
    const txt = pitch(g, 'angel');
    if (txt.includes('Deal')) {
      deals++;
      check('a deal brings cash and dilutes your share', c.cash > cash0 && c.stake < 1 && c.investors.length === 1);
      check('one pitch per round per month', pitch(g, 'angel') === '');
    }
  }
  check('investors can say yes', deals > 0);
  const g = mk();
  found(g, '', 'game', 'normal', 20000);
  check('bigger rounds need a bigger valuation', pitch(g, 'vc') === '');
}

// ---------- a profitable month pays you a dividend (real money)
{
  const g = mk(100000);
  found(g, '', 'factory', 'normal', 50000);
  const c = startup(g)!;
  c.version = 2;
  c.hype = 80;
  c.quality = 80;
  const m0 = g.s.money;
  startupMonth(g);
  const expect = Math.round(Math.round(Math.min(c.cash + Math.round(c.profit * 0.25), c.profit * 0.25)) * c.stake * 0.75);
  check('profit pays your share into your own account', c.profit > 0 && g.s.money - m0 === c.paid && Math.abs(c.paid - expect) <= 1, `${g.s.money - m0} vs ${expect}`);
  // no product on sale (a viral month can't create revenue out of nothing)
  c.staff.employees = 0;
  c.hype = 0;
  c.version = 0;
  const m1 = g.s.money;
  startupMonth(g);
  check('no profit, no payout', g.s.money === m1);
}

// ---------- it can fold
{
  const g = mk();
  found(g, '', 'delivery', 'normal', 12000);
  const c = startup(g)!;
  hire(g, 'employee', 3);
  c.cash = -1;
  for (let i = 0; i < 3; i++) {
    c.cash = Math.min(c.cash, -1);
    startupMonth(g);
  }
  check('3 months in the red and the company folds', !startup(g) && c.closed);
}

// ---------- it can make millions if run well (scripted good play)
{
  const g = mk(400000);
  found(g, 'Pixel Forge', 'game', 'normal', 200000);
  const c = startup(g)!;
  for (let m = 0; m < 120; m++) {
    if (c.progress >= 100) launch(g);
    const next = c.building === 'room' ? 'office' : c.building === 'office' ? 'facility' : c.building === 'facility' ? 'hq' : c.building === 'hq' ? 'skyscraper' : null;
    if (next && c.version && c.profit > 0 && c.cash > BUILDINGS[next].upgrade * 1.5) upgradeBuilding(g);
    // careful growth: only hire while six months of costs stay in the bank; trim when cash runs low
    while (!hireLock(c, 'employee', 1) && c.cash > (costsOf(c) + 4000) * 6 && costsOf(c) + 4000 < Math.max(20000, c.revenue * 0.7)) hire(g, 'employee', 1);
    if (c.cash < costsOf(c) * 3 && c.staff.employees > 3) layOff(g, 5);
    if (!hireLock(c, 'supervisor')) hire(g, 'supervisor');
    if (!hireLock(c, 'manager')) hire(g, 'manager');
    if (c.cash > 100000 && c.hype < 70) { c.cash -= 50000; c.hype = Math.min(100, c.hype + 10); }
    for (const b of ['profit', 'speed', 'payroll', 'pitch'] as const) learnSkill(g, b);
    g.setFlag('pitch:angel', 0);
    if (c.cash < 100000) pitch(g, valuationOf(c) > 1000000 ? 'vc' : 'angel');
    startupMonth(g);
    if (!startup(g)) break;
  }
  check('well run, it’s worth millions within 10 years', !!startup(g) && valuationOf(c) >= 1000000, `${Math.round(valuationOf(c)).toLocaleString()}`);
  check('…and you made CEO status or higher', ['ceo', 'tycoon', 'magnate', 'diplomatic'].includes(c.status), c.status);
  check('…and it paid real money into your bank account', c.paid > 0 && g.s.money > 200000, `paid ${c.paid}`);
}

// ---------- diplomatic status: immunity (needs the skyscraper)
{
  const g = mk();
  found(g, 'Orbital', 'rockets', 'moonshot', 200000);
  const c = startup(g)!;
  c.version = 5;
  c.hype = 100;
  c.quality = 100;
  c.cash = 900000000;
  refreshStatus(g);
  check('a billion-dollar company without the skyscraper is a Magnate, not Diplomatic', c.status === 'magnate' && !untouchable(g));
  c.building = 'skyscraper';
  refreshStatus(g);
  check('in the skyscraper: Diplomatic', c.status === 'diplomatic' && untouchable(g));
  sendToJail(g, 120, 'Test');
  check('diplomats can’t be jailed', !g.jailed);
  check('…or caught', !riskCatch(g, 1, { name: 'x', sev: 3, kind: 'other' }));
  sellCompany(g);
  check('immunity stays once earned', untouchable(g) && !startup(g));
}

// ---------- Update 0.12 — a bigger skill tree: 13 branches, 5 levels, levels 4–5 cost 2 points
{
  const g = mk();
  found(g, '', 'factory', 'normal', 60000);
  const c = startup(g)!;
  check('13 skill branches, 5 levels each', SKILL_ORDER.length === 13 && SKILL_ORDER.every((b) => SKILLS[b].max === 5));
  c.points = 7;
  for (let i = 0; i < 5; i++) learnSkill(g, 'profit');
  check('levels 1–3 cost 1 point, 4–5 cost 2 (7 points = level 5)', c.skills.profit === 5 && c.points === 0);
  c.points = 1;
  check('can’t go past the max', learnSkill(g, 'profit') === '' && c.points === 1);
  c.skills.space = 2;
  check('Office space: +10% staff per level', capOf(c) === Math.floor(BUILDINGS.room.cap * 1.2));
  c.skills.dividend = 3;
  check('Dividend: +5% of profit paid out per level', Math.abs(dividendRate(c) - 0.4) < 1e-9);
  c.version = 2; c.hype = 40; c.quality = 50;
  const h0 = c.hype;
  c.cash = 100000;
  c.skills.marketing = 0;
  marketing(g, 'social');
  const plain = c.hype - h0;
  c.hype = h0;
  c.skills.marketing = 5;
  marketing(g, 'social');
  check('Marketing: campaigns bring more hype', c.hype - h0 > plain);
  const pts = c.points;
  c.cash = 5000000;
  refreshStatus(g);
  check('a new status rank gives 2 skill points', c.points >= pts + STATUS_POINTS && STATUS_POINTS === 2);
  const old = hydrate(JSON.parse(JSON.stringify({ ...g.s, startup: { ...c, skills: { profit: 2, speed: 1, payroll: 0, pitch: 0 } } })));
  check('older companies get the new branches at 0', old?.startup?.skills.viral === 0 && old?.startup?.skills.profit === 2);
}

check('every idea has numbers', Object.values(IDEAS).every((i) => i.found > 0 && i.potential > 0 && i.work > 0));
done();
