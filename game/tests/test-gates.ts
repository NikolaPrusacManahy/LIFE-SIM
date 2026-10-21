// Update 0.3 — legal age gates (US) and locked-card reasons.
import { createLife, randomLook } from '../src/state/newGame';
import { ageGate } from '../src/state/rules/us';
import { ACTIVITIES } from '../src/state/activities';
import { simulateLife } from './sim';
import { check, done } from './harness';

const mk = (age: number) => {
  const g = createLife({ name: 'G', familyName: 'T', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook() });
  g.s.bornAt -= (age - 14) * 12;
  g.s.events = [];
  g.s.money = 100000;
  g.s.phase = 3;
  return g;
};

let legalUnder21 = 0;
let venueUnder21 = 0;
for (let age = 14; age <= 20; age++) {
  const g = mk(age);
  for (const k of ['alcohol', 'tobacco', 'casino'] as const) if (ageGate(k, g).allowed) legalUnder21++;
  for (const a of ACTIVITIES.filter((x) => x.venue)) if (g.activityStatus(a).ok) venueUnder21++;
}
check('alcohol, tobacco and casino are never legal under 21', legalUnder21 === 0);
check('21+ venues are closed under 21 without a fake ID', venueUnder21 === 0);
const g21 = mk(21);
check('all three are legal at 21', (['alcohol', 'tobacco', 'casino'] as const).every((k) => ageGate(k, g21).allowed));
check('lease needs 18', !ageGate('lease', mk(17)).allowed && ageGate('lease', mk(18)).allowed);
const consent = mk(17);
for (const p of consent.parents) p.rel = 80;
check('military at 17 works with parent consent', ageGate('military', consent).consent === true);
check('rental cars need 25', !ageGate('rentCar', mk(24)).allowed);

// every locked card shows a readable reason, across many real game states
let bad = 0;
let locked = 0;
for (let i = 0; i < 25; i++) {
  const g = simulateLife('middle', i % 2 ? 'city' : 'country', { maxTurns: 40 + i * 30 });
  for (const a of ACTIVITIES) {
    const st = g.activityStatus(a);
    if (st.visible && !st.ok) {
      locked++;
      if (!st.reason || st.reason.includes('undefined') || st.reason.length < 3) bad++;
    }
  }
}
check('every locked card has a human-readable reason', bad === 0 && locked > 0, `${bad} bad of ${locked}`);
done();
