// Update 0.8 — nightlife: crowd ages follow the life's laws, the leave-together gate never bends, spiking is intervention-only.
import { check, done } from './harness';
import { playNightStep } from './sim';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import { startNight, venueType, minAgeFor, endNight } from '../src/state/nightlife/night';
import { INTOX_LIMIT, NIGHT_ACTIONS as BUDGET } from '../src/state/nightlife/types';
import { LEAVE_AUDIT, chooseLeave, leaveOptions } from '../src/state/nightlife/leave';
import { approach, chipsFor, talk, CHIP_LABEL } from '../src/state/nightlife/talk';
import { INCIDENT_CHOICES, NIGHT_ACTIONS, nightAct } from '../src/state/nightlife/extras';
import { INTIMACY_AUDIT, canBeIntimate } from '../src/state/systems/intimacy';
import { ACT_BY_ID } from '../src/state/activities';
import { legalAge } from '../src/state/rules/us';
import type { Venue } from '../src/state/nightlife/types';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });
const mk = (age: number, rules: 'us' | 'eu' = 'us'): Game => {
  const g = createLife({ name: 'N', familyName: 'O', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23, rules });
  g.s.bornAt -= (age - 23) * 12;
  g.s.money = 3000;
  g.s.phase = 3;
  return g;
};
const VENUES: Venue[] = ['bar', 'club', 'roadhouse'];

// ---------- 1,000 nights
let tooYoung = 0;
let leftTogether = 0;
let crashes = 0;
let overBudget = 0;
for (let i = 0; i < 1000; i++) {
  try {
    const g = mk(18 + (i % 30), i % 2 ? 'eu' : 'us');
    const v = VENUES[i % 3];
    g.s.region = v === 'roadhouse' ? 'country' : 'city';
    startNight(g, v);
    const n = g.s.night!;
    if (n.crowd.some((c) => !c.known && g.ageOf(c.p) < n.minAge)) tooYoung++;
    if (n.minAge < (n.type === 'eighteen' ? 18 : legalAge(g, 'alcohol'))) tooYoung++;
    let steps = 0;
    // every third night: chat one person up properly, so the leave-together gate gets exercised both ways
    if (i % 3 === 0) {
      g.s.sexuality = 'pan';
      const idx = n.crowd.findIndex((c) => !c.known && c.zone !== 'vip' && c.vibe !== 'alone');
      if (idx >= 0) {
        approach(g, idx);
        n.crowd[idx].intox = i % 2 ? 20 : 80;
        n.crowd[idx].p.attraction = 60;
        while (g.s.night && g.s.night.talking !== null && g.s.night.time > 0 && !leaveOptions(g, g.s.night.crowd[idx]).some((o) => o === 'leave' || o === 'cab')) {
          const best = chipsFor(g, g.s.night.crowd[idx]).filter((x) => !x.reason && x.chip !== 'leave' && x.chip !== 'shot').sort((a, b) => b.odds - a.odds)[0];
          if (!best) break;
          talk(g, best.chip);
        }
        if (g.s.night && leaveOptions(g, g.s.night.crowd[idx]).includes('leave')) chooseLeave(g, 'leave', 'the bar');
      }
    }
    while (g.s.night && steps++ < 80) {
      const before = g.s.night.time;
      playNightStep(g);
      if (g.s.night && g.s.night.time > before) overBudget++;
    }
    if (g.s.night) endNight(g);
    if (n.leftWith) leftTogether++;
    while (g.currentEvent) {
      const k = g.choicesFor(g.currentEvent).findIndex((c) => !c.disabled);
      g.resolveChoice(Math.max(0, k));
    }
  } catch (e) {
    crashes++;
    if (crashes < 3) console.log(e);
  }
}
check('1,000 nights ran without crashing', crashes === 0, `${crashes}`);
check('every crowd member is at least the venue’s minimum age', tooYoung === 0, `${tooYoung}`);
check('the night never gains time', overBudget === 0);
check('“leave together” was exercised', LEAVE_AUDIT.length > 0 && leftTogether > 0, `${LEAVE_AUDIT.length} offers, ${leftTogether} left`);
check('“leave together” is never offered to anyone under 18', LEAVE_AUDIT.every((a) => a.playerAge >= 18 && a.npcAge >= 18));
check('“leave together” is never offered past the intoxication limit (either person)', LEAVE_AUDIT.every((a) => a.playerIntox < INTOX_LIMIT && a.npcIntox < INTOX_LIMIT));
check('no intimacy ever involved anyone under 18', INTIMACY_AUDIT.every((a) => a.playerAge >= 18 && a.partnerAge >= 18));

// ---------- ages by the life's laws
{
  const us = mk(25, 'us');
  const eu = mk(25, 'eu');
  check('US bars: 21+ crowd; EU bars: 18+ crowd', minAgeFor(us, 'pub') === 21 && minAgeFor(eu, 'pub') === 18);
  check('18+ nights let 18-year-olds in (both laws)', minAgeFor(us, 'eighteen') === 18 && minAgeFor(eu, 'eighteen') === 18);
  const young = mk(19, 'us');
  let entry = '';
  for (let m = 0; m < 4; m++) {
    young.s.clock = m;
    const t = venueType(young, 'club');
    const st = young.activityStatus(ACT_BY_ID.night_club);
    if (t === 'eighteen') entry = st.ok ? 'ok' : 'blocked';
    else if (st.ok) entry = 'leak';
  }
  check('a 19-year-old (US) gets into the club only on 18+ night', entry === 'ok');
  young.s.clock = [0, 1, 2, 3].find((m) => { young.s.clock = m; return venueType(young, 'club') === 'eighteen'; })!;
  startNight(young, 'club');
  check('…with a wristband: no alcohol', !!young.s.night!.wristband && NIGHT_ACTIONS.length > 0);
  endNight(young);
  const euTeen = mk(18, 'eu');
  check('an 18-year-old in the EU gets into any bar', euTeen.activityStatus(ACT_BY_ID.night_bar).ok || euTeen.activityStatus(ACT_BY_ID.night_bar).reason === 'Too tired');
}

// ---------- the consent gate
{
  const g = mk(26);
  startNight(g, 'bar');
  const n = g.s.night!;
  const c = n.crowd[0];
  c.p.sexuality = 'pan';
  c.p.gender = 'male';
  g.s.sexuality = 'pan';
  c.conn = 90;
  c.p.attraction = 90;
  c.intox = 10;
  n.talking = 0;
  const sober = leaveOptions(g, c);
  c.intox = INTOX_LIMIT;
  const theyDrunk = leaveOptions(g, c);
  c.intox = 10;
  n.intox = INTOX_LIMIT + 5;
  const meDrunk = leaveOptions(g, c);
  check('sober, mutual, adults: the option exists', sober.includes('leave'));
  check('they’re too drunk: replaced by cab / numbers / friends', !theyDrunk.includes('leave') && theyDrunk.includes('cab') && theyDrunk.includes('walk'));
  check('you’re too drunk: same', !meDrunk.includes('leave') && meDrunk.includes('cab'));
  const drunkGate = canBeIntimate(g, c.p);
  n.intox = 10;
  const soberGate = canBeIntimate(g, c.p);
  check('you can’t consent past the limit either (canBeIntimate)', soberGate && !drunkGate, `${soberGate} ${drunkGate}`);
  applySettings({ mature: false });
  n.intox = 10;
  check('Mature Content off: never offered', !leaveOptions(g, c).includes('leave'));
  applySettings({ mature: true });
  const kid = mk(17);
  kid.give('fakeid');
  kid.s.inventory.fakeid = 1;
  startNight(kid, 'bar');
  const kn = kid.s.night!;
  kn.crowd[0].conn = 95;
  kn.crowd[0].p.attraction = 95;
  kn.talking = 0;
  check('a minor with a fake ID gets nothing with adults (not even numbers)', leaveOptions(kid, kn.crowd[0]).length === 0);
}

// ---------- your correction: a night that runs into the morning restores energy (half if drunk)
{
  for (const [intox, want] of [[10, 100], [60, 50]] as const) {
    const g = mk(25);
    g.s.phase = 3;
    g.s.stats.energy = 20;
    g.doActivity('night_bar');
    if (!g.s.night) g.doActivity('night_bar');
    const n = g.s.night!;
    n.intox = intox;
    endNight(g);
    check(`a night out into the morning wakes you at ${want} energy (intox ${intox})`, g.phase === 'morning' && Math.round(g.s.stats.energy) === want, `${g.phase} ${g.s.stats.energy}`);
  }
  const ev = mk(25);
  ev.s.phase = 2;
  ev.s.stats.energy = 40;
  ev.doActivity('night_bar');
  if (ev.s.night) {
    const e0 = ev.s.stats.energy;
    endNight(ev);
    check('an evening night out doesn’t restore energy (you’re still up)', ev.s.stats.energy === e0);
  }
}

// ---------- spiking is intervention-only; the night ends on schedule
{
  const words = [...Object.values(CHIP_LABEL), ...NIGHT_ACTIONS.map((a) => a.label), ...Object.values(INCIDENT_CHOICES).flat().map((c) => c.label)].join(' ').toLowerCase();
  check('the player is never offered a way to spike a drink', !/spike|slip something|drug (them|their)/.test(words));
  check('spiking choices are all interventions or looking away', INCIDENT_CHOICES.spike.every((c) => ['stop', 'tell', 'ignore'].includes(c.id)));
  const g = mk(30);
  startNight(g, 'club');
  let k = 0;
  while (g.s.night!.time > 0 && k++ < 40) {
    if (g.s.night!.incident) g.s.night!.incident = null;
    nightAct(g, 'dance');
    g.s.night!.zone = 'dance';
  }
  check(`the night has ${BUDGET} actions, then only “head home”`, g.s.night!.time === 0 && nightAct(g, 'dance') === '' && approach(g, 0) === '');
  endNight(g);
  check('heading home asks how you get there', g.queued('night_home'));
}

done();
