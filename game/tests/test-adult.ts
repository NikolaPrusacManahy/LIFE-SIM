// Update 0.3 — 18+ safety: 1,000 lives across the 14–26 age window.
import { simulateLife } from './sim';
import { check, done, resolveAll } from './harness';
import { doInteraction } from '../src/state/npc/interactions';
import { applySettings } from '../src/state/settings';
import { INTIMACY_AUDIT, canBeIntimate } from '../src/state/systems/intimacy';
import { JAIL_AUDIT } from '../src/state/systems/crime';
import { createLife, randomLook } from '../src/state/newGame';
import type { Background, Region } from '../src/state/types';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });

const combos: [Background, Region][] = [['poor', 'city'], ['middle', 'country'], ['rich', 'city'], ['middle', 'city']];
let crashes = 0;
const t0 = Date.now();
for (let i = 0; i < 1000; i++) {
  const [bg, home] = combos[i % combos.length];
  try {
    simulateLife(bg, home, { maxTurns: 150, ageOffset: 2 + (i % 6), social: 0.35 });
  } catch (e) {
    crashes++;
    if (crashes < 3) console.log(e);
  }
}
// Update 0.9 — random play rarely reaches an encounter since nights out became a scene; make sure the path is exercised
for (let i = 0; i < 300 && INTIMACY_AUDIT.length < 20; i++) {
  const g = createLife({ name: 'A', familyName: 'B', gender: i % 2 ? 'male' : 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23 });
  g.s.sexuality = 'pan';
  g.setFlag('hadFirstTime');
  const p = g.addPerson('partner', { age: 22 + (i % 15) });
  p.rel = 90;
  p.romance = 90;
  doInteraction(g, p.id, 'night');
  resolveAll(g);
}
const minorIntimacy = INTIMACY_AUDIT.filter((a) => a.playerAge < 18 || a.partnerAge < 18);
const adultJailForMinor = JAIL_AUDIT.filter((j) => j.age < 18 && !j.juvie);
check('1,000 lives ran without crashing', crashes === 0, `${crashes} crashes`);
check('intimacy actions were exercised', INTIMACY_AUDIT.length > 0, `${INTIMACY_AUDIT.length} recorded`);
check('no intimacy ever involved anyone under 18', minorIntimacy.length === 0, JSON.stringify(minorIntimacy.slice(0, 3)));
check('no minor ever went to adult jail', adultJailForMinor.length === 0, `${adultJailForMinor.length}`);
console.log(`   ${INTIMACY_AUDIT.length} adult interactions, ${JAIL_AUDIT.length} incarcerations, ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// explicit boundary: 18-year-old player, 17-year-old partner
const g = createLife({ name: 'A', familyName: 'B', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook() });
g.s.bornAt -= 4 * 12;
const young = g.addPerson('partner', { age: 17, rel: 90 });
const adult = g.addPerson('partner', { age: 19, rel: 90 });
check('18 + 17 partner: blocked', g.age === 18 && !canBeIntimate(g, young));
check('18 + 19 partner: allowed', canBeIntimate(g, adult));
applySettings({ mature: false });
check('Mature Content off: blocked', !canBeIntimate(g, adult));
applySettings({ isAdult: false, mature: true });
check('unconfirmed age can never enable Mature Content', !canBeIntimate(g, adult));
done();
