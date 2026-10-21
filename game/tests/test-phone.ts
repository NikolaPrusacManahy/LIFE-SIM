import { createLife, randomLook } from '../src/state/newGame';
import { askForPhone, hasPhone, phoneLock, confiscatePhone } from '../src/state/systems/phone';
import { buyAsset } from '../src/state/systems/finance';
import type { Background } from '../src/state/types';
import { check, done } from './harness';

const mk = (bg: Background) => createLife({ name: 'Ph', familyName: 'One', gender: 'male', background: bg, hometown: 'city', traits: [], look: randomLook() });

check('rich kids start with a phone', hasPhone(mk('rich')));
check('middle-class kids start without one', !hasPhone(mk('middle')));

const teen = mk('middle');
teen.s.money = 5000;
check('teen without permission is blocked from buying', phoneLock(teen) !== null && buyAsset(teen, 'phone') !== 'You bought a Smartphone!' && !teen.has('phone'));

// a beloved teen eventually gets a yes from either parent
const loved = mk('middle');
for (const p of loved.parents) p.rel = 100;
let tries = 0;
while (!loved.has('phone') && tries++ < 50) askForPhone(loved);
check('a parent eventually says yes', loved.has('phone'), `after ${tries} tries`);

// poor families: permission, then buy it yourself
const poor = mk('poor');
for (const p of poor.parents) p.rel = 100;
tries = 0;
while (!poor.flag('phoneAllowed') && tries++ < 50) askForPhone(poor);
check('poor parents allow but do not buy', poor.flag('phoneAllowed') === 1 && !poor.has('phone'));
poor.s.money = 1000;
buyAsset(poor, 'phone');
check('allowed teen can buy one', poor.has('phone'));

const adult = mk('middle');
adult.s.bornAt -= 5 * 12;
adult.s.money = 1000;
check('adults need no permission', phoneLock(adult) === null);

confiscatePhone(loved, 1);
check('confiscated phone is unusable', !hasPhone(loved));
loved.s.clock += 1;
check('phone comes back after the punishment', hasPhone(loved));
done();
