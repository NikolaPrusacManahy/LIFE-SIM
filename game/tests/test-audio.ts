// Update 0.5.1 — audio: every sound has a converted file, money failures trigger the buzz, defaults are on.
import { existsSync } from 'node:fs';
import { check, done } from './harness';
import { SFX_FILES, isMoneyText } from '../src/ui/audio';
import { settings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import { ACT_BY_ID } from '../src/state/activities';
import { buyItem } from '../src/state/inventory/items';

const missing = SFX_FILES.filter((f) => !existsSync(`public/audio/${f}.mp3`));
check('every sound has a file in public/audio', missing.length === 0, missing.join(', '));
check('music and sound are on by default', settings.music && settings.sound);

for (const t of ['Not enough money.', 'Not enough cash.', 'You couldn’t afford it, so you just walked around.', 'Need $1,200']) check(`"${t}" plays the no-money sound`, isMoneyText(t));
for (const t of ['Not enough to pass.', 'Too tired', 'Done recently', '', null]) check(`"${t}" stays quiet`, !isMoneyText(t));

// the real engine messages match
const g = createLife({ name: 'A', familyName: 'B', gender: 'male', background: 'poor', hometown: 'city', traits: [], look: randomLook() });
g.s.money = 0;
const pricey = Object.values(ACT_BY_ID).find((a) => (typeof a.cost === 'number' ? a.cost : 0) > 0 && g.activityStatus(a).reason?.startsWith('Need $'));
check('a locked activity reason is recognised', !!pricey && isMoneyText(g.activityStatus(pricey).reason), pricey?.id ?? 'none found');
check('a failed purchase is recognised', isMoneyText(buyItem(g, 'flowers')));

done();
