// Update 0.6 — God Mode: immortal and untouchable, but the hard rules never bend.
import { check, done } from './harness';
import { simulateLife } from './sim';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook, type NewLifeOptions } from '../src/state/newGame';
import { GOD_POWERS, GOD_TARGET_AUDIT, castPower, haremLock, haremMembers, inviteToHarem, powerLock, smite, smiteTargets } from '../src/state/systems/god';
import { CRIME_TARGET_AUDIT } from '../src/state/crime/consent';
import { commit } from '../src/state/crime/commit';
import { sendToJail } from '../src/state/systems/crime';
import { startPursuit } from '../src/state/crime/pursuit';
import { interactionsFor } from '../src/state/npc/interactions';
import { canBeIntimate } from '../src/state/systems/intimacy';
import { GOD_WEALTH } from '../src/state/Game';

applySettings({ ageConfirmed: true, isAdult: true, mature: true, darkCrime: true });
const mk = (o: Partial<NewLifeOptions> = {}) =>
  createLife({ name: 'G', familyName: 'D', gender: 'nonbinary', background: 'middle', hometown: 'city', traits: [], look: randomLook(), god: true, startAge: 23, ...o });

// ---------- immortal & untouchable
const g = mk();
check('born a god: every stat at the peak', g.s.god && g.s.stats.smarts === 100 && g.s.stats.fitness === 100);
check('born a god: max money', g.s.money === GOD_WEALTH);
g.money(-500_000_000);
check('spending never drains a god', g.s.money === GOD_WEALTH && g.canAfford(GOD_WEALTH));
g.s.stats.health = 0;
g.die('test');
check('gods do not die', !g.s.dead && g.s.stats.health === 100);
sendToJail(g, 120, 'Test');
check('no cell holds a god', !g.jailed);
startPursuit(g);
check('gods are never hunted', !g.s.underworld.pursuit);
const t = g.addPerson('acquaintance', { age: 40 });
const r = commit(g, 'robbery', t);
check('crimes always succeed and leave no case', r.ok && g.s.underworld.cases.length === 0 && !g.s.underworld.scene);

let crashes = 0;
let deaths = 0;
let jailed = 0;
let broke = 0;
for (let i = 0; i < 150; i++) {
  try {
    const life = simulateLife(i % 2 ? 'poor' : 'rich', i % 3 ? 'city' : 'country', { maxTurns: 400, crime: 0.2, social: 0.2, start: { god: true, startAge: i % 2 ? 23 : 14 } });
    if (life.s.dead) deaths++;
    if (life.jailed) jailed++;
    if (life.s.money !== GOD_WEALTH) broke++;
  } catch (e) {
    crashes++;
    if (crashes < 2) console.log(e);
  }
}
check('150 god lives ran without crashing', crashes === 0, `${crashes}`);
check('every god life ended at max money', broke === 0, `${broke}`);
check('no god life ever ended or went to jail', deaths === 0 && jailed === 0, `${deaths} dead, ${jailed} jailed`);
check('crime targets in god lives were all adults', CRIME_TARGET_AUDIT.every((a) => a.npcAge >= 18 && a.playerAge >= 18));

// ---------- smite: adults only, Dark Crime only, never as a minor
const kid = g.addPerson('acquaintance', { age: 12 });
const teen = g.addPerson('acquaintance', { age: 17 });
check('smite never lists anyone under 18', !smiteTargets(g).some((p) => g.ageOf(p) < 18));
check('smiting a minor does nothing', smite(g, kid.id) === '' && kid.alive && smite(g, teen.id) === '' && teen.alive);
const adult = g.addPerson('acquaintance', { age: 35 });
check('smiting an adult works', smite(g, adult.id) !== '' && !adult.alive);
check('every smite target was an adult', GOD_TARGET_AUDIT.length > 0 && GOD_TARGET_AUDIT.every((a) => a.npcAge >= 18 && a.playerAge >= 18));
applySettings({ darkCrime: false });
check('Dark Crime off: smite is locked', powerLock(g, GOD_POWERS.find((p) => p.id === 'smite')!) === 'Dark Crime is off' && smiteTargets(g).length === 0);
applySettings({ darkCrime: true });
const young = mk({ startAge: 14 });
check('a 14-year-old god cannot smite or level a city', !!powerLock(young, GOD_POWERS.find((p) => p.id === 'smite')!) && !!powerLock(young, GOD_POWERS.find((p) => p.id === 'level')!));
check('a 14-year-old god still cannot commit adult crimes', !commit(young, 'assault', young.addPerson('acquaintance', { age: 30 })).ok);

// ---------- levelling the city kills no one
const city = mk();
for (let i = 0; i < 10; i++) city.addPerson('acquaintance', { age: 5 + i * 7 });
const aliveBefore = city.s.people.filter((p) => p.alive).length;
const lvl = castPower(city, 'level');
check('levelling the city works', lvl !== '' && city.flag('ruinsUntil') > city.s.clock);
check('levelling the city kills no one', city.s.people.filter((p) => p.alive).length === aliveBefore);
check('every non-targeted power runs', GOD_POWERS.filter((p) => p.id !== 'smite').every((p) => { const x = mk(); return !powerLock(x, p) ? castPower(x, p.id) !== '' : true; }));

// ---------- harem: willing adults only, never compelled
const h = mk();
const minorCrush = h.addPerson('crush', { age: 16 });
check('no minor can be invited', haremLock(h, minorCrush) === 'Adults only');
const captive = h.addPerson('dating', { age: 30 });
captive.status = 'captive';
check('nobody who cannot consent can be invited', !!haremLock(h, captive) && !interactionsFor(h, captive).some((x) => x.def.id === 'g_harem'));
let yes = 0;
let no = 0;
for (let i = 0; i < 200; i++) {
  const x = mk();
  const p = x.addPerson('dating', { age: 25 + (i % 20) });
  if (haremLock(x, p)) continue;
  inviteToHarem(x, p);
  if (p.tags.includes('harem')) yes++;
  else no++;
}
check('invites are a real choice (some say yes, some say no)', yes > 0 && no > 0, `${yes} yes, ${no} no`);
check('harem members are all adults', haremMembers(h).every((p) => h.ageOf(p) >= 18));
check('harem membership never bypasses the intimacy gate', (() => {
  const x = mk();
  const p = x.addPerson('dating', { age: 30 });
  p.tags.push('harem', 'open', 'sedated');
  return !canBeIntimate(x, p);
})());

done();
