// Update 0.5 — Underworld safety & correctness: 1,000 crime-heavy lives, plus the hard rules checked directly.
import { simulateLife } from './sim';
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { CRIME_TARGET_AUDIT, cannotConsent } from '../src/state/crime/consent';
import { VIOLENT_AUDIT, commit, crimeLock } from '../src/state/crime/commit';
import { CRIMES } from '../src/state/crime/catalog';
import { TAG_LABEL, coverableTags } from '../src/state/crime/evidence';
import { DEMANDS } from '../src/state/crime/captives';
import { inPursuit, startPursuit } from '../src/state/crime/pursuit';
import { investigationMonth } from '../src/state/crime/investigation';
import { JAIL_AUDIT } from '../src/state/systems/crime';
import { INTIMACY_AUDIT, canBeIntimate } from '../src/state/systems/intimacy';
import { interactionsFor } from '../src/state/npc/interactions';
import { chipsFor, tabsFor } from '../src/state/phone/chat';
import { visibleLocations } from '../src/state/systems/world';
import { activitiesAt } from '../src/state/activities';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import type { Background, Region } from '../src/state/types';
import type { EvidenceTag } from '../src/state/crime/types';

applySettings({ ageConfirmed: true, isAdult: true, mature: true, darkCrime: true });

/** No intimacy entry point is ever open to someone who cannot consent. */
function consentLeaks(g: Game) {
  let n = 0;
  for (const p of g.s.people) {
    if (!p.alive || !cannotConsent(g, p)) continue;
    if (canBeIntimate(g, p)) n++;
    if (interactionsFor(g, p).some((r) => r.def.mature)) n++;
    if (p.status !== 'captive' && (tabsFor(g, p).includes('intimate') || chipsFor(g, p, 'flirt').some((c) => c.chip.photo))) n++;
  }
  return n;
}

const combos: [Background, Region][] = [['poor', 'city'], ['middle', 'country'], ['rich', 'city'], ['middle', 'city']];
let crashes = 0;
let leaks = 0;
let manhunts = 0;
let noSurrender = 0;
let courts = 0;
let lifeCases = 0;
let coldCases = 0;
let pursuits = 0;
let surrenderBlocked = 0;
let criminals = 0;
let consequences = 0;
const t0 = Date.now();
for (let i = 0; i < 1000; i++) {
  const [bg, home] = combos[i % combos.length];
  try {
    const g = simulateLife(bg, home, {
      maxTurns: 150,
      ageOffset: i % 10 === 0 ? 1 : 4 + (i % 8),
      social: 0.15,
      crime: 0.35,
      chat: 0.2,
      gear: true,
      onEvent: (gg) => {
        const ev = gg.currentEvent!;
        if (ev.id === 'court') courts++;
        if (ev.id === 'manhunt') {
          manhunts++;
          const labels = gg.choicesFor(ev).filter((c) => !c.disabled).map((c) => c.choice.label);
          if (!labels.includes('Turn yourself in') || !labels.includes('Run')) noSurrender++;
        }
        if (inPursuit(gg)) {
          const st = gg.activityStatus(activitiesAt('onrun').find((a) => a.id === 'run_surrender')!);
          if (!st.ok && st.reason !== 'Too tired' && gg.canAct()) surrenderBlocked++;
        }
      },
    });
    leaks += consentLeaks(g);
    lifeCases += g.s.underworld.cases.length;
    coldCases += g.s.underworld.cases.filter((c) => c.status === 'cold').length;
    if (g.s.underworld.pursuit) pursuits++;
    if (g.flag('crimes05') > 0) {
      criminals++;
      if (g.s.crime.record.length || g.s.underworld.pursuit || g.s.underworld.cases.some((c) => c.suspect) || g.s.crime.jail) consequences++;
    }
  } catch (e) {
    crashes++;
    if (crashes < 3) console.log(e);
  }
}
check('1,000 crime-heavy lives ran without crashing', crashes === 0, `${crashes} crashes`);
check('person crimes were exercised', CRIME_TARGET_AUDIT.length > 0 && VIOLENT_AUDIT.length > 0, `${CRIME_TARGET_AUDIT.length} targets, ${VIOLENT_AUDIT.length} violent`);
check('no under-18 NPC was ever a crime target', CRIME_TARGET_AUDIT.every((a) => a.npcAge >= 18 && a.playerAge >= 18));
check('violent / capital crime only ever committed by adults', VIOLENT_AUDIT.every((a) => a.playerAge >= 18));
check('under-18 players only ever went to juvenile hall', JAIL_AUDIT.every((a) => a.age >= 18 || a.juvie), `${JAIL_AUDIT.length} incarcerations`);
check('no intimacy offered to anyone who cannot consent', leaks === 0, `${leaks}`);
check('no intimacy ever involved anyone under 18', INTIMACY_AUDIT.every((a) => a.playerAge >= 18 && a.partnerAge >= 18));
check('every manhunt offers Run and Turn yourself in', noSurrender === 0, `${noSurrender} of ${manhunts}`);
check('Turn Yourself In is always available on the run', surrenderBlocked === 0, `${surrenderBlocked}`);
const adultJail = JAIL_AUDIT.filter((a) => !a.juvie);
const avg = adultJail.length ? adultJail.reduce((n, a) => n + a.months, 0) / adultJail.length : 0;
console.log(`   balance: ${criminals} criminal lives · ${Math.round((consequences / Math.max(1, criminals)) * 100)}% hit a serious consequence · ${adultJail.length} adult sentences (avg ${avg.toFixed(1)} mo)`);
console.log(`            ${lifeCases} cases · ${coldCases} cold · ${courts} court dates · ${manhunts} manhunts · ${pursuits} lives went on the run`);
console.log(`   ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// ---------- direct rule checks
const mk = (age: number) => {
  const g = createLife({ name: 'U', familyName: 'W', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook() });
  g.s.bornAt -= (age - 14) * 12;
  if (age >= 18) {
    g.s.education.current = null;
    g.s.education.degrees.push('hs');
  }
  g.s.money = 50000;
  return g;
};

// minors: every crime is locked, commit refuses
const kid = mk(16);
check('every adult crime is locked under 18', CRIMES.every((c) => crimeLock(kid, c) === 'Must be 18'));
check('commit() refuses under 18', CRIMES.every((c) => !commit(kid, c.id, null).ok));
check('under-18 players get no crime activities', visibleLocations(kid).flatMap((l) => activitiesAt(l.id)).every((a) => a.cat !== 'crime' || !kid.activityStatus(a).ok));

// an adult can never target a minor
const adult = mk(30);
const minor = adult.addPerson('acquaintance', { age: 15 });
check('minors never get Underworld interactions', !interactionsFor(adult, minor).some((r) => r.def.group === 'Underworld'));
check('commit() refuses a minor target', !commit(adult, 'assault', minor).ok && !commit(adult, 'kidnap', minor).ok);
check('minors never get an Underworld chat tab', !tabsFor(adult, minor).includes('underworld'));

// captives / sedated / blackmailed: intimacy closed
const victim = adult.addPerson('partner', { age: 30 });
victim.romance = 90;
const openBefore = canBeIntimate(adult, victim);
victim.status = 'captive';
const captiveClosed = !canBeIntimate(adult, victim) && !interactionsFor(adult, victim).some((r) => r.def.mature);
victim.status = 'alive';
victim.tags.push('sedated');
const sedatedClosed = !canBeIntimate(adult, victim) && !tabsFor(adult, victim).includes('intimate');
victim.tags = victim.tags.filter((t) => t !== 'sedated');
adult.s.underworld.blackmail.push({ pid: victim.id, demand: 'cash', monthly: 0, since: adult.s.clock });
const bmClosed = !canBeIntimate(adult, victim);
check('intimacy closes for captive / sedated / blackmailed', openBefore && captiveClosed && sedatedClosed && bmClosed, `${openBefore} ${captiveClosed} ${sedatedClosed} ${bmClosed}`);

// Dark Crime off hides dark crimes
applySettings({ darkCrime: false });
check('Dark Crime off locks every dark crime', CRIMES.filter((c) => c.dark).every((c) => crimeLock(adult, c) === 'Dark Crime is off'));
const friend = adult.addPerson('friend', { age: 28 });
check('Dark Crime off hides dark Underworld interactions', !interactionsFor(adult, friend).some((r) => r.def.dark));
applySettings({ darkCrime: true });

// blackmail: money, favours, silence, info, jobs — never sexual
const SEXUAL = /sex|sleep|bed|nude|naked|photo|kiss|intimate|body|date me|night with|strip|undress/i;
check('blackmail demands contain nothing sexual', DEMANDS.every((d) => !SEXUAL.test(d.label) && !SEXUAL.test(d.id)));

// evidence: every crime leaves something; every tag can be covered
check('every crime has at least one evidence tag', CRIMES.every((c) => c.tags.length > 0));
const uncovered = (Object.keys(TAG_LABEL) as EvidenceTag[]).filter((t) => !coverableTags.has(t));
check('every evidence tag has a cover-up action', uncovered.length === 0, uncovered.join(', '));

// wanted ★★★★ → manhunt → pursuit; surrender always there
const fug = mk(30);
fug.s.underworld.cases.push({ id: 'k1', crimeId: 'murder_weapon', name: 'Confrontation', sev: 5, clock: fug.s.clock, open: [], found: ['body', 'weapon', 'witness', 'motive', 'trace'], progress: 0, wanted: 0, status: 'open', board: false, podcast: 0, suspect: true });
investigationMonth(fug);
check('wanted ★★★★ queues a manhunt', fug.s.underworld.wanted >= 4 && fug.queued('manhunt'), `wanted ${fug.s.underworld.wanted}`);
fug.s.events = [];
startPursuit(fug);
const onrun = visibleLocations(fug).map((l) => l.id);
const surrender = activitiesAt('onrun').find((a) => a.id === 'run_surrender')!;
check('pursuit mode shows only the run', inPursuit(fug) && onrun.length === 1 && onrun[0] === 'onrun', onrun.join(','));
check('surrender is available in pursuit', fug.activityStatus(surrender).ok);
fug.doActivity('run_surrender');
check('surrendering ends the pursuit and goes to court', !inPursuit(fug) && fug.queued('court'));

done();
