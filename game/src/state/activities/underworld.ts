import type { Game } from '../Game';
import { CRIME_BY_ID } from '../crime/catalog';
import { commit, crimeChips, crimeLock, crimeOddsFor } from '../crime/commit';
import { darkCrimeOn } from '../crime/consent';
import { owns } from '../crime/properties';
import { launder } from '../crime/drugs';
import { captives } from '../crime/captives';
import { crew } from '../crime/drugs';
import { canFleeCountry, endPursuit, fleeCountry, inPursuit, recognition } from '../crime/pursuit';
import { activeCases } from '../crime/investigation';
import { easeGuilt } from '../crime/guilt';
import { itemCount, spendItem } from '../inventory/items';
import { fmt } from '../systems/finance';
import { NIGHT, NOT_NIGHT, type ActivityDef } from './types';
import { pct } from './helpers';

// Update 0.5 — Underworld activities. Adult crime tiers are 18+ (minAge); dark ones need Dark Crime on.

function crimeAct(id: string, loc: string, crimeId: string, extra: Partial<ActivityDef> = {}): ActivityDef {
  const c = CRIME_BY_ID[crimeId];
  return {
    id, loc, name: c.name, icon: c.icon, desc: `${c.tier[0].toUpperCase()}${c.tier.slice(1)} crime.`, cat: 'crime', energy: 12 + c.sev * 3, minAge: 18, kind: 'crime',
    when: () => !c.dark || darkCrimeOn(),
    lock: (g) => crimeLock(g, c),
    risk: (g) => pct(crimeOddsFor(g, c)),
    preview: () => crimeChips(c),
    run: (g) => commit(g, crimeId).text,
    ...extra,
  };
}

const fugitive = (g: Game) => inPursuit(g);

export const UNDERWORLD_ACTS: ActivityDef[] = [
  // ---- street crime
  crimeAct('pickpocket', 'downtown', 'pickpocket', { phases: NOT_NIGHT }),
  crimeAct('pickpocket_c', 'mainstreet', 'pickpocket', { phases: NOT_NIGHT }),
  crimeAct('scam', 'alley', 'scam'),
  crimeAct('fakegoods', 'downtown', 'fakegoods', { phases: NOT_NIGHT }),
  crimeAct('burglary', 'alley', 'burglary', { phases: NIGHT }),
  crimeAct('burglary_c', 'backroads', 'burglary', { phases: NIGHT }),
  crimeAct('cartheft', 'alley', 'cartheft', { phases: ['evening', 'night'], run: (g) => { const r = commit(g, 'cartheft'); if (r.ok) g.inc('stolenCars'); return r.text; } }),
  crimeAct('cartheft_c', 'backroads', 'cartheft', { phases: ['evening', 'night'], run: (g) => { const r = commit(g, 'cartheft'); if (r.ok) g.inc('stolenCars'); return r.text; } }),
  crimeAct('fraud', 'alley', 'fraud'),
  crimeAct('arson', 'alley', 'arson', { phases: NIGHT }),
  crimeAct('smuggle', 'docks', 'smuggle', { phases: ['evening', 'night'] }),
  crimeAct('smuggle_c', 'backroads', 'smuggle', { phases: ['evening', 'night'] }),
  crimeAct('racket', 'alley', 'racket'),
  {
    id: 'hang_corner', loc: 'alley', name: 'Hang on the Corner', icon: '🧢', desc: 'Make contacts.', cat: 'social', energy: 10, minAge: 16,
    run: (g) => {
      g.stat('street', 2);
      if (g.age >= 18 && !g.s.underworld.contact && g.s.stats.street >= 15) {
        g.s.underworld.contact = true;
        return 'Someone mentions a back room where you can get… anything.';
      }
      return g.pick(['Nods from people who matter here.', 'You heard who runs what.', 'Cold night, warm gossip.']);
    },
  },
  {
    id: 'dock_work', loc: 'docks', name: 'Day Labour', icon: '🏗️', desc: 'Cash in hand.', cat: 'money', energy: 22, minAge: 16, phases: ['morning', 'afternoon'],
    run: (g) => { const amt = g.rand(80, 140); g.money(amt); g.stat('fitness', 2); return `Unloaded crates all day. ${fmt(amt)}.`; },
  },

  // ---- the Back Room (black market)
  { id: 'blackmarket', loc: 'backroom', name: 'The Back Room', icon: '🕶️', desc: 'No receipts. No questions.', cat: 'panel', energy: 0, panel: 'blackmarket', run: () => '' },
  {
    id: 'fence', loc: 'backroom', name: 'Fence Stolen Goods', icon: '📦', desc: 'Turn hot goods into cash.', cat: 'money', energy: 6, minAge: 18,
    when: (g) => itemCount(g, 'stolen') > 0,
    run: (g) => { const n = itemCount(g, 'stolen'); spendItem(g, 'stolen', n); const amt = n * g.rand(200, 600); g.s.underworld.dirty += amt; return `${fmt(amt)} in dirty cash for ${n} box${n > 1 ? 'es' : ''}.`; },
  },

  // ---- your spots (properties)
  {
    id: 'chop', loc: 'spots', name: 'Chop Shop', icon: '🔧', desc: 'Strip a stolen car for parts.', cat: 'crime', energy: 20, minAge: 18, kind: 'crime',
    when: (g) => owns(g, 'garage') && g.flag('stolenCars') > 0,
    run: (g) => { g.inc('stolenCars', -1); const amt = g.rand(2000, 5000); g.s.underworld.dirty += amt; g.heat(3); return `Parts sold. ${fmt(amt)} dirty.`; },
  },
  { id: 'run_op', loc: 'spots', name: 'Run the Operation', icon: '📊', desc: 'Business, crew, territory.', cat: 'panel', energy: 0, panel: 'crime', minAge: 18, run: () => '' },
  {
    id: 'launder', loc: 'spots', name: 'Launder Money', icon: '🧺', desc: 'Dirty in, clean out.', cat: 'money', energy: 8, minAge: 18,
    when: (g) => owns(g, 'front'),
    run: (g) => launder(g),
  },
  {
    id: 'lie_low', loc: 'spots', name: 'Lie Low', icon: '🫥', desc: 'Heat down. Boring.', cat: 'rest', energy: 0,
    run: (g) => { g.heat(-12); g.stat('energy', 10); g.stat('mood', -2); return 'You stayed in, curtains drawn.'; },
  },
  {
    id: 'check_captive', loc: 'spots', name: 'Check on Them', icon: '🚪', desc: 'Food, water, silence.', cat: 'crime', energy: 8, minAge: 18, kind: 'crime',
    when: (g) => captives(g).length > 0,
    run: (g) => { for (const p of captives(g)) g.s.flags[`captiveHealth:${p.id}`] = Math.min(100, (g.s.flags[`captiveHealth:${p.id}`] ?? 100) + 25); g.s.underworld.guilt = Math.min(100, g.s.underworld.guilt + 2); return 'They won’t look at you.'; },
  },
  {
    id: 'plan_heist', loc: 'spots', name: 'Plan a Heist', icon: '🗺️', desc: 'Crew of 2–4. One big score.', cat: 'crime', energy: 15, minAge: 18, cooldown: 24, kind: 'crime',
    when: () => darkCrimeOn(),
    lock: (g) => (crew(g).length >= 2 ? null : 'Needs 2+ crew'),
    run: (g) => { g.queue('heist_plan', {}, true); return 'Blueprints on the table. Coffee going cold.'; },
  },

  // ---- police station
  {
    id: 'gun_license', loc: 'police', name: 'Apply for a Gun License', icon: '📄', desc: 'Background check.', cat: 'panel', energy: 4, cost: 150, gate: 'gunHandgun', cooldown: 12,
    when: (g) => !g.flag('gunLicense'),
    lock: (g) => (g.s.crime.record.length ? 'Criminal record' : null),
    run: (g) => { g.setFlag('gunLicense'); return 'Approved. You can buy firearms at the gun counter.'; },
  },
  {
    id: 'turn_in', loc: 'police', name: 'Turn Yourself In', icon: '🙇', desc: 'Lighter sentence for coming forward.', cat: 'faith', energy: 4, minAge: 18,
    when: (g) => activeCases(g).some((c) => c.suspect),
    run: (g) => { const c = activeCases(g).find((x) => x.suspect)!; g.queue('court', { caseId: c.id, surrendered: true }, true); return 'You walked up to the front desk and said your name.'; },
  },

  // ---- confession & therapy ease guilt
  {
    id: 'confess_guilt', loc: 'church', name: 'Confession Booth', icon: '🕯️', desc: 'Unburden your conscience.', cat: 'faith', energy: 4, cooldown: 6, minAge: 18,
    when: (g) => g.s.underworld.guilt > 0,
    run: (g) => {
      easeGuilt(g, 18);
      g.stat('mood', 6);
      const c = activeCases(g)[0];
      if (c && g.s.underworld.guilt > 20 && g.chance(0.1)) { c.open.push('witness'); return 'The priest can’t tell anyone. The woman in the next pew might.'; }
      return 'The priest listened. The weight lifted a little.';
    },
  },

  // ---- on the run (pursuit mode)
  {
    id: 'run_run', loc: 'onrun', name: 'Run', icon: '🏃', desc: 'Keep moving.', cat: 'fitness', energy: 18, when: fugitive,
    risk: (g) => pct(g.statOdds('fitness', 50)),
    run: (g) => { const p = g.s.underworld.pursuit!; if (g.check('fitness', 50)) { p.zone = Math.max(0, p.zone - 15); return 'You put miles between you and them.'; } p.zone += 8; return 'You stumbled. They’re closer.'; },
  },
  {
    id: 'run_hide', loc: 'onrun', name: 'Hide', icon: '🫣', desc: 'Safe house, cabin, or a friend’s couch.', cat: 'rest', energy: 0, when: fugitive,
    run: (g) => {
      const p = g.s.underworld.pursuit!;
      g.stat('energy', 30);
      const friend = g.peopleBy('friend', 'partner', 'spouse', 'mother', 'father').find((x) => x.trust >= 55);
      if (owns(g, 'cabin')) { p.zone = Math.max(0, p.zone - 20); return 'The cabin. Silence. Pine trees. Safe, for now.'; }
      if (friend && g.chance(0.75)) { p.zone = Math.max(0, p.zone - 15); return `${friend.name} let you in without asking questions.`; }
      if (friend) { p.zone += 15; return `${friend.name} called the police after you fell asleep.`; }
      p.zone = Math.max(0, p.zone - 5);
      return 'You slept under a bridge.';
    },
  },
  {
    id: 'run_disguise', loc: 'onrun', name: 'Disguise', icon: '🎭', desc: 'Dye your hair, new clothes.', cat: 'fun', energy: 6, cost: 120, when: fugitive,
    run: (g) => { const p = g.s.underworld.pursuit!; p.disguise = Math.min(100, p.disguise + 45); g.s.look.hair = (g.s.look.hair + 3) % 10; return 'A stranger looks back from the gas-station mirror.'; },
  },
  {
    id: 'run_car', loc: 'onrun', name: 'Steal a Car', icon: '🚗', desc: 'Faster. Louder.', cat: 'crime', energy: 12, when: fugitive,
    risk: (g) => pct(g.statOdds('street', 45)),
    run: (g) => { const p = g.s.underworld.pursuit!; if (g.check('street', 45)) { p.zone = Math.max(0, p.zone - 18); g.heat(5); return 'You hit the highway in someone else’s car.'; } p.zone += 12; return 'The alarm screamed. You ran.'; },
  },
  {
    id: 'run_backroads', loc: 'onrun', name: 'Take the Back Roads', icon: '🛣️', desc: 'Slow, quiet, rural.', cat: 'travel', energy: 10, when: fugitive,
    run: (g) => { const p = g.s.underworld.pursuit!; p.zone = Math.max(0, p.zone - 8); if (g.s.region === 'city' && g.chance(0.5)) { g.s.region = 'country'; return 'You crossed the county line. Fields everywhere.'; } return 'Gravel roads, no cameras.'; },
  },
  {
    id: 'run_favour', loc: 'onrun', name: 'Call in a Favour', icon: '📞', desc: 'Someone owes you.', cat: 'social', energy: 4, cooldown: 12, when: fugitive,
    lock: (g) => (crew(g).length || g.s.stats.street >= 40 ? null : 'Nobody owes you'),
    run: (g) => { const p = g.s.underworld.pursuit!; p.zone = Math.max(0, p.zone - 25); return 'A van, a new jacket, and a ride two states over.'; },
  },
  {
    id: 'run_settle', loc: 'onrun', name: 'Settle Under a Fake Name', icon: '🏡', desc: 'A quiet life… until it isn’t.', cat: 'rest', energy: 10, when: fugitive,
    lock: (g) => (g.s.underworld.pursuit!.zone > 40 ? 'Too hot — lose them first' : g.s.region !== 'country' && !owns(g, 'cabin') ? 'Get to the countryside' : null),
    run: (g) => { endPursuit(g, true); g.s.familyName = g.pick(['Miller', 'Brooks', 'Hale', 'Turner']); g.milestone('Started over under a fake name'); return `You’re “${g.s.name} ${g.s.familyName}” now. The locals seem friendly.`; },
  },
  {
    id: 'run_flee', loc: 'onrun', name: 'Flee the Country', icon: '🛂', desc: 'Passport, cash, a way out.', cat: 'travel', energy: 10, when: fugitive,
    lock: (g) => canFleeCountry(g),
    run: (g) => fleeCountry(g),
  },
  {
    id: 'run_surrender', loc: 'onrun', name: 'Turn Yourself In', icon: '🙇', desc: 'Always an option. Lighter sentence.', cat: 'faith', energy: 0, when: fugitive,
    run: (g) => { const c = activeCases(g).find((x) => x.suspect) ?? activeCases(g)[0]; endPursuit(g); if (c) g.queue('court', { caseId: c.id, surrendered: true }, true); return 'You walked into the nearest station with your hands where they could see them.'; },
  },
  {
    id: 'run_sleep', loc: 'onrun', name: 'Sleep Rough', icon: '🌙', desc: 'Restless.', cat: 'rest', energy: 0, phases: NIGHT, when: fugitive,
    run: (g) => { g.stat('energy', 40); g.stat('mood', -3); if (g.chance(recognition(g) / 3)) g.s.underworld.pursuit!.zone += 10; return 'You slept in your clothes, one eye open.'; },
  },

  // ---- prison extras
  {
    id: 'jail_gang', loc: 'jail', name: 'Join a Prison Gang', icon: '🦂', desc: 'Protection, with strings.', cat: 'social', energy: 10, minAge: 18,
    when: (g) => !g.flag('prisonGang') && !g.s.crime.jail?.juvie,
    run: (g) => { g.setFlag('prisonGang'); g.stat('street', 6); if (g.s.crime.jail) g.s.crime.jail.behavior -= 10; return 'You’re one of them now. They’ll ask for something eventually.'; },
  },
  {
    id: 'jail_contraband', loc: 'jail', name: 'Trade Contraband', icon: '🚬', desc: 'Cash, risk of solitary.', cat: 'money', energy: 8, minAge: 18,
    when: (g) => !g.s.crime.jail?.juvie,
    run: (g) => {
      if (g.chance(0.25)) { if (g.s.crime.jail) { g.s.crime.jail.monthsLeft += 2; g.s.crime.jail.behavior -= 15; } return 'Caught. Two weeks in solitary and two months added.'; }
      g.money(g.rand(40, 120)); return 'Instant noodles are currency in here.';
    },
  },
  {
    id: 'jail_escape', loc: 'jail', name: 'Work on an Escape Plan', icon: '🕳️', desc: 'Multi-month plan.', cat: 'crime', energy: 14, minAge: 18, cooldown: 4,
    when: (g) => !g.s.crime.jail?.juvie,
    run: (g) => {
      const n = g.inc('escapePlan');
      if (n < 3) return `Plan stage ${n}/3: ${g.pick(['the guard rotation', 'a weak spot in the fence', 'a way to get clothes'])}.`;
      g.setFlag('escapePlan', 0);
      if (g.check('street', 55)) { g.s.crime.jail = null; g.achieve('escape'); g.queue('manhunt', { escaped: true }, true); return 'You’re over the wall.'; }
      if (g.s.crime.jail) g.s.crime.jail.monthsLeft += 24;
      return 'Caught at the fence. Two more years.';
    },
  },
];
