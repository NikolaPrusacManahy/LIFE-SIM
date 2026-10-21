import { createLife, randomLook } from '../src/state/newGame';
import { SLOT_COUNT, anySave, clearSave, hydrate, listSlots, loadGame, saveGame, setStorage } from '../src/state/save';
import { check, done } from './harness';

const g = createLife({ name: 'Sa', familyName: 'Ve', gender: 'female', background: 'rich', hometown: 'country', traits: ['iron'], look: randomLook() });
const json = JSON.parse(JSON.stringify(g.s));
const round = hydrate(json)!;
check('round-trip keeps name and stats', round.name === 'Sa' && round.stats.smarts === g.s.stats.smarts);
delete json.netWorthPeak;
delete json.education.gedStudy;
delete json.crime;
const old = hydrate(json)!;
check('missing top-level field gets default', old.netWorthPeak === 0);
check('missing nested field gets default', old.education.gedStudy === 0 && old.education.current?.program === 'hs');
check('missing object gets default', Array.isArray(old.crime.record));
check('garbage save returns null', hydrate('nope') === null && hydrate(null) === null);

// ---------- Update 0.9 — five save slots (in-memory storage for the test)
const mem = new Map<string, string>();
setStorage({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) });
mem.set('lifesim.save', JSON.stringify(g.s));
check('the old single save moves into slot 1', loadGame(0)?.name === 'Sa' && !mem.has('lifesim.save'));
const b = createLife({ name: 'Bo', familyName: 'Two', gender: 'male', background: 'poor', hometown: 'city', traits: [], look: randomLook() });
saveGame(b.s, 3);
check('slots are independent', loadGame(0)?.name === 'Sa' && loadGame(3)?.name === 'Bo' && loadGame(1) === null);
check(`there are ${SLOT_COUNT} slots`, SLOT_COUNT === 5 && listSlots().length === 5);
check('the slot list shows who is where', listSlots().filter((x) => x.state).map((x) => x.slot).join() === '0,3' && listSlots()[3].age === 14);
saveGame(createLife({ name: 'Cy', familyName: 'New', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook() }).s, 3);
check('a new life overwrites the slot it was given', loadGame(3)?.name === 'Cy');
clearSave(0);
check('clearing one slot leaves the others', loadGame(0) === null && loadGame(3)?.name === 'Cy' && anySave());
done();
