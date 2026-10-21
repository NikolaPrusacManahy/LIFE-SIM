// Update 0.5.1 — start options (age 23, millionaire), US vs EU rules, and the fully-equipped kidnapping.
import { check, done } from './harness';
import { createLife, randomLook, type NewLifeOptions } from '../src/state/newGame';
import { hydrate } from '../src/state/save';
import { ageGate, legalAge, tuitionFor } from '../src/state/rules/us';
import { applySettings } from '../src/state/settings';
import { commit, crimeOddsFor } from '../src/state/crime/commit';
import { CRIME_BY_ID } from '../src/state/crime/catalog';
import { buyProperty } from '../src/state/crime/properties';
import { addItem, itemCount } from '../src/state/inventory/items';
import { simulateLife } from './sim';

const mk = (o: Partial<NewLifeOptions> = {}) =>
  createLife({ name: 'S', familyName: 'T', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), ...o });

// ---------- start age
const teen = mk();
check('default start is 14 in high school', teen.age === 14 && teen.s.education.current?.program === 'hs');
const grown = mk({ startAge: 23 });
check('age-23 start is 23', grown.age === 23, `${grown.age}`);
check('age-23 start: diploma, not in school, own phone', grown.hasDegree('hs') && !grown.s.education.current && grown.has('phone'));
check('age-23 start: lives in a shared flat with a roommate', grown.s.housing === 'shared' && grown.s.people.some((p) => p.labels.includes('roommate')));
check('age-23 start: parents are older than you by 22+', grown.parents.every((p) => grown.ageOf(p) >= 22 + 23));
check('age-23 start: no high-school teachers or first-day event', !grown.s.people.some((p) => p.role === 'teacher') && !grown.queued('hs_first_day'));
let crashes = 0;
for (let i = 0; i < 40; i++) {
  try {
    const bg = (['poor', 'middle', 'rich'] as const)[i % 3];
    simulateLife(bg, i % 2 ? 'city' : 'country', { maxTurns: 120, social: 0.2, start: { startAge: 23, millionaire: i % 4 === 0, rules: i % 2 ? 'eu' : 'us' } });
  } catch (e) {
    crashes++;
    if (crashes < 2) console.log(e);
  }
}
check('age-23 lives (US/EU, some millionaires) run without crashing', crashes === 0, `${crashes}`);

// ---------- millionaire
check('millionaire start has $1,000,000+', mk({ millionaire: true }).s.money >= 1_000_000);
check('normal start is not a millionaire', mk().s.money < 100_000 && mk({ startAge: 23 }).s.money < 100_000);

// ---------- US vs EU
const us = mk({ startAge: 23 });
const eu = mk({ startAge: 23, rules: 'eu' });
check('default rules are US', us.s.rules === 'us');
check('US: drinking age 21, EU: 18', legalAge(us, 'alcohol') === 21 && legalAge(eu, 'alcohol') === 18);
const us18 = mk({ rules: 'us' });
const eu18 = mk({ rules: 'eu' });
us18.s.bornAt -= 4 * 12;
eu18.s.bornAt -= 4 * 12;
check('18-year-old: US bar locked, EU bar open', !ageGate('alcohol', us18).allowed && ageGate('alcohol', eu18).allowed);
check('18-year-old: US casino locked, EU casino open', !ageGate('casino', us18).allowed && ageGate('casino', eu18).allowed);
check('16-year-old: US can drive, EU cannot', (() => {
  const a = mk({ rules: 'us' });
  const b = mk({ rules: 'eu' });
  a.s.bornAt -= 2 * 12;
  b.s.bornAt -= 2 * 12;
  return ageGate('license', a).allowed && !ageGate('license', b).allowed;
})());
check('EU tuition is a fraction of US', tuitionFor(eu, 14000) < tuitionFor(us, 14000) / 5 && tuitionFor(us, 14000) === 14000);
check('rules survive a save round-trip', hydrate(JSON.parse(JSON.stringify(eu.s)))?.rules === 'eu');
const oldSave = JSON.parse(JSON.stringify(us.s));
delete oldSave.rules;
check('older saves default to US rules', hydrate(oldSave)?.rules === 'us');

// ---------- kidnapping is guaranteed with the full kit
applySettings({ ageConfirmed: true, isAdult: true, darkCrime: true });
let fails = 0;
for (let i = 0; i < 60; i++) {
  const g = mk({ startAge: 23, millionaire: true });
  buyProperty(g, 'basement');
  addItem(g, 'restraints', 1);
  addItem(g, 'sedative', 1);
  const t = g.addPerson('acquaintance', { age: 30 });
  const odds = crimeOddsFor(g, CRIME_BY_ID.kidnap, t);
  const r = commit(g, 'kidnap', t);
  if (odds !== 1 || !r.ok || t.status !== 'captive' || itemCount(g, 'restraints') || itemCount(g, 'sedative')) fails++;
}
check('kidnapping with restraints + sedative always succeeds (and uses the kit)', fails === 0, `${fails}/60 failed`);
const partial = mk({ startAge: 23, millionaire: true });
buyProperty(partial, 'basement');
addItem(partial, 'restraints', 1);
check('with only part of the kit it is a normal roll', crimeOddsFor(partial, CRIME_BY_ID.kidnap) < 1);
const kid = mk({ millionaire: true });
addItem(kid, 'restraints', 1);
addItem(kid, 'sedative', 1);
check('the full kit never lets a minor commit it', !commit(kid, 'kidnap', kid.addPerson('acquaintance', { age: 30 })).ok);

done();
