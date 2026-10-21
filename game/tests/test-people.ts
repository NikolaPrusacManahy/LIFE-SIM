// Update 0.4 — people safety & correctness: 1,000 lives across ages 14–26 with heavy socialising.
import { simulateLife } from './sim';
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { MATURE_EVENT_AUDIT } from '../src/state/Game';
import { MATURE_LINE_AUDIT, ALL_POOLS } from '../src/state/npc/lines';
import { INTIMACY_AUDIT } from '../src/state/systems/intimacy';
import { PRONOUNS, isRomanceEligible, say } from '../src/state/npc/identity';
import { interactionsFor } from '../src/state/npc/interactions';
import { createLife, randomLook } from '../src/state/newGame';
import { addItem, searchBag } from '../src/state/inventory/items';
import type { Background, Region } from '../src/state/types';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });

const combos: [Background, Region][] = [['poor', 'city'], ['middle', 'country'], ['rich', 'city'], ['middle', 'city']];
let crashes = 0;
let teacherRomance = 0;
let badPairs = 0;
let missingChips = 0;
let named = 0;
const t0 = Date.now();
for (let i = 0; i < 1000; i++) {
  const [bg, home] = combos[i % combos.length];
  try {
    const g = simulateLife(bg, home, {
      maxTurns: 150,
      ageOffset: i % 8,
      social: 0.4,
      onEvent: (gg) => {
        const ev = gg.currentEvent!;
        const text = gg.eventText(ev);
        if (gg.s.people.some((p) => p.alive && p.name.length >= 3 && new RegExp(`\\b${p.name}\\b`).test(text))) {
          named++;
          if (!gg.eventPerson(ev)) missingChips++;
        }
      },
    });
    for (const p of g.s.people) {
      if (!p.alive) continue;
      if (p.role === 'teacher') {
        const ids = interactionsFor(g, p).map((r) => r.def);
        if (ids.some((d) => d.romance || d.mature)) teacherRomance++;
      }
      if (isRomanceEligible(g, p)) {
        const a = g.age;
        const b = g.ageOf(p);
        if (!((a < 18 && b < 18 && Math.abs(a - b) <= 2) || (a >= 18 && b >= 18)) || p.role === 'teacher') badPairs++;
      }
    }
  } catch (e) {
    crashes++;
    if (crashes < 3) console.log(e);
  }
}
check('1,000 lives ran without crashing', crashes === 0, `${crashes} crashes`);
// Encounters are rare in these short lives (can be 0); test-adult.ts requires them.
check('mature events were exercised', MATURE_EVENT_AUDIT.length > 0, `${MATURE_EVENT_AUDIT.length} events`);
console.log(`   ${MATURE_EVENT_AUDIT.length} mature events, ${INTIMACY_AUDIT.length} encounters`);
check('no mature event ever resolved with anyone under 18', MATURE_EVENT_AUDIT.every((a) => a.playerAge >= 18 && (a.npcAge === null || a.npcAge >= 18) && a.mature));
check('no mature line ever resolved with anyone under 18', MATURE_LINE_AUDIT.every((a) => a.playerAge >= 18 && a.npcAge >= 18), `${MATURE_LINE_AUDIT.length} lines`);
check('no intimacy ever involved anyone under 18', INTIMACY_AUDIT.every((a) => a.playerAge >= 18 && a.partnerAge >= 18));
check('teachers are never offered romance or mature options', teacherRomance === 0, `${teacherRomance}`);
check('no adult–minor romance-eligible pair', badPairs === 0, `${badPairs}`);
check('every event naming an NPC shows a person chip', missingChips === 0 && named > 0, `${missingChips} missing of ${named}`);
console.log(`   ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// pronoun tokens resolve for he / she / they in every line template
let leftovers = 0;
for (const pool of Object.values(ALL_POOLS)) {
  for (const t of pool) {
    for (const pr of Object.values(PRONOUNS)) if (/\{[A-Za-z]+\}/.test(say(t, { name: 'Sam', pronouns: pr }, 'You'))) leftovers++;
  }
}
check('pronoun tokens resolve for all three pronoun sets', leftovers === 0, `${leftovers}`);

// illegal items at each age
const mk = (age: number) => {
  const g = createLife({ name: 'I', familyName: 'T', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook() });
  g.s.bornAt -= (age - 14) * 12;
  g.s.money = 5000;
  return g;
};
const teen = mk(15);
addItem(teen, 'alcohol');
searchBag(teen, 'parents');
check('15 with alcohol: confiscated + grounded (juvenile)', !teen.hasItem('alcohol') && teen.flag('groundedUntil') > teen.s.clock && teen.s.crime.juvRecord.length === 1);
const young = mk(19);
addItem(young, 'alcohol');
const before = young.s.money;
searchBag(young, 'police');
check('19 with alcohol: confiscated + citation', !young.hasItem('alcohol') && young.s.money === before - 250);
const adult = mk(22);
addItem(adult, 'alcohol');
check('22 with alcohol: legal, nothing happens', searchBag(adult, 'police').includes('clean') && adult.hasItem('alcohol'));
const forger = mk(25);
addItem(forger, 'fakeid');
const b2 = forger.s.money;
searchBag(forger, 'police');
check('fake ID at 25: still illegal (fine)', !forger.hasItem('fakeid') && forger.s.money < b2);
done();
