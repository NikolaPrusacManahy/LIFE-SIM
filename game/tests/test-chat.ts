// Update 0.5 — messenger rules: 18+ gates on 🔥 / photo chips, tabs for minors, groups, pools, pronouns, digital trail.
import { simulateLife } from './sim';
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { CHAT_MATURE_AUDIT, CHAT_POOLS, CHIPS, GROUP_TABS, TABS, chipsFor, groupChips, sendChip, tabsFor, type ChatTab } from '../src/state/phone/chat';
import { PRONOUNS, say } from '../src/state/npc/identity';
import { createLife, randomLook } from '../src/state/newGame';
import { addItem } from '../src/state/inventory/items';
import type { Game } from '../src/state/Game';
import type { Person } from '../src/state/types';

applySettings({ ageConfirmed: true, isAdult: true, mature: true, darkCrime: true });

const MATURE_PHOTO = new Set(CHIPS.filter((c) => c.photo && CHAT_POOLS[c.pool]?.mature).map((c) => c.id));
const allChips = (g: Game, p: Person) => tabsFor(g, p).flatMap((t) => chipsFor(g, p, t));
const hot = (g: Game, p: Person) => allChips(g, p).filter((c) => CHAT_POOLS[c.chip.pool]?.mature || MATURE_PHOTO.has(c.chip.id) || c.chip.tab === 'intimate');

// ---------- 300 chat-heavy lives
let crashes = 0;
let leaks = 0;
let minorTabs = 0;
const t0 = Date.now();
for (let i = 0; i < 300; i++) {
  try {
    const g = simulateLife(i % 2 ? 'middle' : 'rich', i % 3 ? 'city' : 'country', { maxTurns: 120, ageOffset: i % 10, social: 0.2, chat: 0.6, crime: 0.05 });
    for (const p of g.s.people) {
      if (!p.alive || !p.hasNumber) continue;
      const adultPair = g.age >= 18 && g.ageOf(p) >= 18;
      if (!adultPair && hot(g, p).length) leaks++;
      if (g.age < 18 && tabsFor(g, p).some((t) => t === 'intimate' || t === 'underworld')) minorTabs++;
    }
  } catch (e) {
    crashes++;
    if (crashes < 3) console.log(e);
  }
}
check('300 chat-heavy lives ran without crashing', crashes === 0, `${crashes}`);
check('mature chat lines were exercised', CHAT_MATURE_AUDIT.length > 0, `${CHAT_MATURE_AUDIT.length}`);
check('every mature chat reply involved two adults', CHAT_MATURE_AUDIT.every((a) => a.playerAge >= 18 && a.npcAge >= 18));
check('no 🔥 / private-photo chips with anyone under 18', leaks === 0, `${leaks}`);
check('under-18 players never see 🔥 or 🗡 tabs', minorTabs === 0, `${minorTabs}`);
console.log(`   ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// ---------- direct gates
const mk = (age: number) => {
  const g = createLife({ name: 'C', familyName: 'H', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook() });
  g.s.bornAt -= (age - 14) * 12;
  g.give('phone');
  return g;
};
const g = mk(28);
const partner = g.addPerson('partner', { age: 27 });
partner.hasNumber = true;
partner.romance = 80;
partner.rel = 80;
check('adult partners get the 🔥 tab with Mature on', tabsFor(g, partner).includes('intimate'));
applySettings({ mature: false });
check('Mature off: no 🔥 tab and no mature chips', !tabsFor(g, partner).includes('intimate') && hot(g, partner).length === 0);
applySettings({ mature: true });
partner.tags.push('sedated');
check('cannotConsent: no 🔥 tab and no mature chips', !tabsFor(g, partner).includes('intimate') && hot(g, partner).length === 0);
partner.tags = partner.tags.filter((t) => t !== 'sedated');

const teen = mk(16);
const crush = teen.addPerson('dating', { age: 16 });
crush.hasNumber = true;
check('teens dating: no 🔥 tab, no private-photo chips', !tabsFor(teen, crush).includes('intimate') && hot(teen, crush).length === 0);
check('teens: no 🗡 tab', !tabsFor(teen, crush).includes('underworld'));
const olderToMinor = g.addPerson('acquaintance', { age: 16 });
olderToMinor.hasNumber = true;
check('adult → minor: no 🔥 / 🗡 / photo chips', hot(g, olderToMinor).length === 0 && !tabsFor(g, olderToMinor).includes('underworld'));

// groups: light tabs only, never photos or mature lines
const groupLeak = GROUP_TABS.flatMap((t) => groupChips(t)).filter((c) => c.photo || CHAT_POOLS[c.pool]?.mature || c.tab === 'underworld' || c.tab === 'intimate');
check('group chats never offer photo, mature or underworld chips', groupLeak.length === 0, groupLeak.map((c) => c.id).join(','));

// pools: every chip points to a pool; ≥3 lines per band; pronouns resolve
const missing = CHIPS.filter((c) => !CHAT_POOLS[c.pool]).map((c) => c.id);
check('every chip has a reply pool', missing.length === 0, missing.join(','));
const thin = Object.entries(CHAT_POOLS).filter(([, p]) => p.ok.length < 3 || p.fail.length < 3).map(([k]) => k);
check('every chip pool has ≥3 lines per outcome band', thin.length === 0, thin.join(','));
let leftovers = 0;
for (const pool of Object.values(CHAT_POOLS)) {
  for (const t of [...pool.ok, ...pool.fail]) for (const pr of Object.values(PRONOUNS)) if (/\{[A-Za-z]+\}/.test(say(t, { name: 'Sam', pronouns: pr }, 'You'))) leftovers++;
}
check('chat lines resolve pronouns for all three sets', leftovers === 0, `${leftovers}`);
check('every tab id is registered', CHIPS.every((c) => TABS.some((t) => t.id === (c.tab as ChatTab))));

// underworld messages leave a digital trail unless sent from a burner
const crook = mk(30);
crook.s.money = 9999;
const mark = crook.addPerson('acquaintance', { age: 35 });
mark.hasNumber = true;
const caseOf = () => ({ id: `k${Math.random()}`, crimeId: 'assault', name: 'Assault', sev: 2, clock: crook.s.clock, open: [] as never[], found: [] as never[], progress: 0, wanted: 0, status: 'open' as const, board: false, podcast: 0, suspect: false });
crook.s.underworld.cases = [caseOf()];
const menace = chipsFor(crook, mark, 'underworld').find((c) => !c.reason);
check('adults with Dark Crime get Underworld chips', !!menace);
if (menace) {
  sendChip(crook, mark.id, menace.chip.id, false);
  check('an Underworld text without a burner adds digital evidence', crook.s.underworld.cases[0].open.includes('digital' as never));
  crook.s.underworld.cases = [caseOf()];
  addItem(crook, 'burner', 1);
  crook.s.turn++;
  sendChip(crook, mark.id, menace.chip.id, true);
  check('an Underworld text from a burner leaves no digital evidence', !crook.s.underworld.cases[0].open.includes('digital' as never));
}

done();
