import { createLife, randomLook } from '../src/state/newGame';
import { hydrate } from '../src/state/save';
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
done();
