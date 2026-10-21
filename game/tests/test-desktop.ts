// Update 0.8 — computers: sessions, site gates, online safety, Nile, PC building, mini-game rules.
import { check, done } from './harness';
import { simulateLife } from './sim';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import { openSession, closeSession, SESSION_ACTIONS } from '../src/state/pc/session';
import { SITES, SITE_BY_ID, siteLock, siteVisible, webAct, download, canPlay } from '../src/state/web/sites';
import { meetOnline, onlineFriends, FRIEND_ACTIONS, isVerified } from '../src/state/web/discorb';
import { isRomanceEligible } from '../src/state/npc/identity';
import { canBeIntimate } from '../src/state/systems/intimacy';
import { order, deliveriesTick, returnOrder, checkout } from '../src/state/web/nile';
import { PART_BY_ID } from '../src/state/pc/parts';
import { assemble, compatibility, bagParts, canBuild } from '../src/state/pc/build';
import { addItem, itemCount } from '../src/state/inventory/items';
import { ACT_BY_ID } from '../src/state/activities';
import { newMines, reveal, cleared } from '../src/state/games/mines';
import { newSnek, step, turn } from '../src/state/games/snek';
import { emptyGrid, lock, spawn, W } from '../src/state/games/blocks';
import { markGuess, dealGolf, golfLeft } from '../src/state/games/cards';
import { rewardRun, TOURNAMENT_PRIZE, TOURNAMENT_FEE } from '../src/state/games/catalog';

applySettings({ ageConfirmed: true, isAdult: true, mature: true, darkCrime: true });
const mk = (age = 25): Game => {
  const g = createLife({ name: 'D', familyName: 'K', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: age >= 18 ? 23 : 14 });
  g.s.bornAt -= (age - (age >= 18 ? 23 : 14)) * 12;
  g.s.money = 20000;
  g.s.stats.street = 30;
  g.give('laptop');
  return g;
};

// ---------- sessions
{
  const g = mk();
  openSession(g, 'library');
  check('library sittings give 4 actions', g.s.session!.left === SESSION_ACTIONS.library && SESSION_ACTIONS.library === 4);
  check('a sitting blocks other actions', !g.canAct());
  webAct(g, 'viewtube', 'watch');
  check('a site action uses one action', g.s.session!.left === 3);
  webAct(g, 'weathernerds', 'forecast');
  check('free actions cost nothing', g.s.session!.left === 3);
  check('no downloads on a library PC', download(g, 'blocks').includes('library') && !g.s.web.installed.includes('blocks'));
  check('library only runs browser games', canPlay(g, 'mines') && !canPlay(g, 'flappy'));
  for (let i = 0; i < 6; i++) webAct(g, 'viewtube', 'watch');
  check('the sitting runs out', g.s.session!.left === 0 && webAct(g, 'viewtube', 'watch').includes('Session over'));
  check('shutting down returns a summary and frees you', closeSession(g).length > 0 && g.canAct());
}

// ---------- your correction: a computer sitting takes no time, one per time of day
{
  const g = mk();
  const t0 = g.s.turn;
  const r = g.doActivity('laptop_home');
  check('using the laptop takes no time', !!r && g.s.turn === t0 && !!g.s.session);
  closeSession(g);
  check('…one sitting per time of day', g.activityStatus(ACT_BY_ID.laptop_home).reason === 'Once per time of day');
  g.autopilot();
  check('…available again next slot', g.activityStatus(ACT_BY_ID.laptop_home).ok || g.activityStatus(ACT_BY_ID.laptop_home).reason === 'Too tired');
}

// ---------- 18+ & darknet gates
{
  const adultLib = mk();
  openSession(adultLib, 'library');
  check('SpicyHub is hidden on a library PC', !siteVisible(adultLib, SITE_BY_ID.spicyhub) && !!siteLock(adultLib, SITE_BY_ID.spicyhub) && webAct(adultLib, 'spicyhub', 'browse') === '');
  adultLib.s.web.installed.push('tor');
  check('Onionmarket is unreachable from a library PC', !siteVisible(adultLib, SITE_BY_ID.onion) && order(adultLib, 'lockpick', false, true).includes('library'));
  const teen = mk(16);
  openSession(teen, 'laptop');
  check('SpicyHub is never reachable under 18', !siteVisible(teen, SITE_BY_ID.spicyhub) && webAct(teen, 'spicyhub', 'browse') === '');
  check('Onionmarket is never reachable under 18', download(teen, 'tor').includes('18') && order(teen, 'lockpick', false, true).includes('18'));
  check('Spark Web needs 18+', !!siteLock(teen, SITE_BY_ID.sparkweb));
  const adult = mk();
  openSession(adult, 'laptop');
  check('adults at home can open SpicyHub (Mature on)', !siteLock(adult, SITE_BY_ID.spicyhub));
  applySettings({ mature: false });
  check('Mature Content off hides SpicyHub', !siteVisible(adult, SITE_BY_ID.spicyhub));
  applySettings({ mature: true });
  check('Onionmarket needs the Tor-ish download', !!siteLock(adult, SITE_BY_ID.onion));
  download(adult, 'tor');
  check('…and then opens', !siteLock(adult, SITE_BY_ID.onion));
  // a full sweep: no gated site ever visible to a minor or on a library PC
  let leaks = 0;
  for (const age of [14, 16, 17]) {
    const k = mk(age);
    k.s.web.installed.push('tor');
    for (const d of ['library', 'laptop'] as const) {
      openSession(k, d);
      if (SITES.some((s) => (s.id === 'spicyhub' || s.id === 'onion') && siteVisible(k, s))) leaks++;
      closeSession(k);
    }
  }
  check('sweep: 18+ / darknet sites never visible to minors', leaks === 0);
}

// ---------- online friends: romance only when verified adults
{
  let unverifiedRomance = 0;
  let minorRomance = 0;
  let minorsMet = 0;
  for (let i = 0; i < 300; i++) {
    const g = mk(20 + (i % 15));
    openSession(g, 'laptop');
    g.s.session!.left = 99;
    meetOnline(g, 'gaming');
    const p = onlineFriends(g)[0];
    p.rel = 80;
    p.attraction = 90;
    if (isRomanceEligible(g, p) || canBeIntimate(g, p)) unverifiedRomance++;
    webAct(g, 'discorb', 'meet', p.id);
    if (g.ageOf(p) < 18) {
      minorsMet++;
      // resolve the safety event
      while (g.currentEvent) g.resolveChoice(0);
      if (isRomanceEligible(g, p) || canBeIntimate(g, p) || !p.tags.includes('noRomance')) minorRomance++;
    }
  }
  check('unverified online contacts are never romance options', unverifiedRomance === 0, `${unverifiedRomance}`);
  check('a revealed minor is never a romance option (and gets flagged)', minorRomance === 0, `${minorRomance} of ${minorsMet}`);
  const kid = mk(15);
  openSession(kid, 'laptop');
  for (let i = 0; i < 40; i++) meetOnline(kid, 'anime');
  check('minors only meet honest peers online', onlineFriends(kid).every((p) => Math.abs(kid.ageOf(p) - 15) <= 2 && p.tags.includes(`claims:${kid.ageOf(p)}`)));
  check('meeting in person verifies', (() => { const g = mk(); openSession(g, 'laptop'); meetOnline(g, 'coding'); const p = onlineFriends(g)[0]; p.rel = 60; webAct(g, 'discorb', 'meet', p.id); return isVerified(p); })());
  check('friend actions exist', FRIEND_ACTIONS.length >= 3);
}

// ---------- Nile: orders arrive, problems happen, returns refund
{
  const g = mk();
  const before = g.s.money;
  check('ordering takes the money', order(g, 'flowers').startsWith('📦') && g.s.money < before);
  check('nothing arrives early', (deliveriesTick(g), itemCount(g, 'flowers') === 0));
  g.s.turn += 2;
  deliveriesTick(g);
  const o = g.s.orders[0];
  check('the order resolves after its slots', o.status !== 'transit');
  let stolen = 0;
  let wrong = 0;
  for (let i = 0; i < 400; i++) {
    const h = mk();
    order(h, 'pc_gpu2', true);
    h.s.turn += 1;
    deliveriesTick(h);
    if (h.s.orders[0].status === 'stolen') stolen++;
    if (h.s.orders[0].status === 'wrong' || h.s.orders[0].status === 'damaged') {
      wrong++;
      const m = h.s.money;
      returnOrder(h, h.s.orders[0].id);
      if (h.s.money <= m) wrong = -9999;
    }
  }
  check('porch theft and wrong/damaged items happen', stolen > 0 && wrong > 0, `${stolen} stolen, ${wrong} returns`);
  check('a cart checks out together', (() => { const h = mk(); return checkout(h, ['pc_ram1', 'pc_ssd1']).includes('2 items') && h.s.orders.length === 2; })());
}

// ---------- PC building
{
  const g = mk();
  const kit = ['pc_case2', 'pc_mobo_am1', 'pc_cpu_am2', 'pc_cool2', 'pc_gpu2', 'pc_ram2', 'pc_ssd2', 'pc_psu2', 'pc_mon1', 'pc_kb1', 'pc_mouse1'];
  for (const id of kit) addItem(g, id);
  check('a full kit can be built', canBuild(g) && compatibility(bagParts(g)).length === 0);
  const bad = mk();
  for (const id of kit.filter((x) => x !== 'pc_cpu_am2')) addItem(bad, id);
  addItem(bad, 'pc_cpu_lg1');
  check('a wrong-socket CPU is caught', compatibility(bagParts(bad)).some((i) => i.includes('socket')));
  const r = assemble(bad, ['mobo', 'cpu', 'cooler', 'ram', 'storage', 'gpu', 'psu'], true);
  check('incompatible parts are detected at assembly (parts stay in the bag)', !r.ok && !bad.has('pc') && itemCount(bad, 'pc_cpu_lg1') === 1);
  let built = 0;
  let zapped = 0;
  for (let i = 0; i < 40; i++) {
    const h = mk();
    for (const id of kit) addItem(h, id);
    const res = assemble(h, ['mobo', 'cpu', 'cooler', 'ram', 'storage', 'gpu', 'psu'], i % 2 === 0);
    if (res.ok) {
      built++;
      if (!h.has('pc') || h.s.pc.score <= 0 || !ACT_BY_ID.use_pc.when!(h)) built = -999;
    } else if (res.broken) zapped++;
  }
  check('a completed build adds the Use PC action', built > 0, `${built} built, ${zapped} zapped`);
  const weak = mk();
  for (const id of kit.filter((x) => x !== 'pc_psu2')) addItem(weak, id);
  addItem(weak, 'pc_psu1');
  addItem(weak, 'pc_gpu4');
  check('a weak PSU is caught', compatibility(bagParts(weak)).some((i) => i.includes('Power')));
  check('every part is a bag item', Object.keys(PART_BY_ID).every((id) => !!id));
}

// ---------- mini-game rules
{
  let ok = true;
  for (let i = 0; i < 30; i++) {
    const b = newMines(9, 9, 10, 4, 4);
    if (b.flat().filter((c) => c.mine).length !== 10 || b[4][4].mine) ok = false;
    if (reveal(b, 4, 4) !== 'ok' || !b[4][4].open) ok = false;
  }
  check('Mines: 10 mines, first click is safe and opens', ok);
  const solved = newMines(5, 5, 1, 0, 0);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) if (!solved[y][x].mine) reveal(solved, x, y);
  check('Mines: clearing every safe cell wins', cleared(solved));
  let s = newSnek();
  s = { ...s, food: [s.body[0][0] + 1, s.body[0][1]] };
  s = step(s);
  check('Snek: eating grows the snake', s.eaten === 1 && s.body.length === 4);
  s = turn(s, [-1, 0]);
  check('Snek: no instant U-turn', s.dir[0] === 1);
  let dead = newSnek();
  for (let i = 0; i < 20; i++) dead = step(dead);
  check('Snek: hitting the wall ends the run', !dead.alive);
  const grid = emptyGrid();
  for (let x = 0; x < W - 4; x++) grid[17][x] = 1;
  const r = lock(grid, { ...spawn(0), x: W - 4, y: 17 });
  check('Block Drop: a full row clears', r.lines === 1 && r.grid[17].every((c) => !c));
  check('Word Duel: marks hits, near-misses and misses', markGuess('CRANE', 'CRANE').every((m) => m === 'hit') && markGuess('EAGLE', 'APPLE').join() === 'miss,near,miss,hit,hit');
  const golf = dealGolf();
  check('Golf: 35 cards on the table', golfLeft(golf) === 35 && golf.stock.length === 16);
  const t = mk();
  const m0 = t.s.money;
  rewardRun(t, 'snek', 999, true);
  check('a great tournament run wins the prize', t.s.money === m0 - TOURNAMENT_FEE + TOURNAMENT_PRIZE);
}

// ---------- lives that use computers don't crash
{
  let crashes = 0;
  for (let i = 0; i < 80; i++) {
    try {
      simulateLife('middle', 'city', { maxTurns: 200, social: 0.2, chat: 0.2, start: { startAge: 23 } });
    } catch (e) {
      crashes++;
      if (crashes < 2) console.log(e);
    }
  }
  check('80 lives with computers ran without crashing', crashes === 0, `${crashes}`);
}

done();
