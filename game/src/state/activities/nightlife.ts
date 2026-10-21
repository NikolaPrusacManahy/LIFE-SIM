import { underageCatch } from '../systems/trouble';
import { LATE, type ActivityDef } from './types';
import { legalAge } from '../rules/us';
import { startNight, venueType } from '../nightlife/night';
import { TYPE_LABEL, type Venue } from '../nightlife/types';

// Update 0.3 — clubs and bars are drinking-age venues (US 21 / EU 18; a fake ID gets 16+ in, at a risk).
// Update 0.8 — one card per venue opens the night-out scene (drinks, dancing, people, karaoke…). It uses one slot.

const VENUE = { gate: 'alcohol' as const, legality: 'underage' as const, venue: true, phases: LATE };

const nightOut = (loc: Venue, icon: string): ActivityDef => ({
  id: `night_${loc}`, loc, name: 'Night Out', icon, desc: 'Drinks, music, people. ~12 actions.', cat: 'social', energy: 10, ...VENUE,
  // 18+ nights let 18–20s in without a fake ID (no alcohol)
  gate: undefined,
  lock: (g) => {
    const t = venueType(g, loc);
    if (t === 'eighteen' && g.age >= 18) return null;
    if (g.age >= legalAge(g, 'alcohol')) return null;
    return g.age >= 16 && g.hasItem('fakeid') ? null : `Must be ${legalAge(g, 'alcohol')}${t === 'eighteen' ? ' (18+ tonight)' : ''}`;
  },
  preview: (g) => [TYPE_LABEL[venueType(g, loc)], ...(g.age < legalAge(g, 'alcohol') && venueType(g, loc) !== 'eighteen' ? ['ID check 20%'] : [])],
  run: (g) => {
    const t = venueType(g, loc);
    if (t !== 'eighteen' || g.age < 18) {
      if (underageCatch(g, 0.2, { name: 'Fake ID at a bar', sev: 1, kind: 'id', by: 'security' })) return 'The bouncer looked at your ID for a long time…';
    }
    return startNight(g, loc);
  },
});

export const NIGHTLIFE_ACTS: ActivityDef[] = [nightOut('club', '🪩'), nightOut('bar', '🍺'), nightOut('roadhouse', '🤠')];
