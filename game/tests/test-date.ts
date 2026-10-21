// Update 0.10 — Date Night: romantic dates only, venue actions, spark, moments, and the hard rules.
import { check, done, resolveAll } from './harness';
import { playDateStep } from './sim';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import type { Person } from '../src/state/types';
import { DATE_AUDIT, actionLock, actionsFor, calmNight, oddsOf, dateAct, doMoment, endDate, isRomanticDate, momentLock, startDate, answerOffer } from '../src/state/datenight/date';
import { HOME_BONUS, VENUES, VENUE_ORDER } from '../src/state/datenight/venues';
import { sendChip } from '../src/state/phone/chat';
import { INTOX_LIMIT } from '../src/state/nightlife/types';
import { INTIMACY_AUDIT } from '../src/state/systems/intimacy';
import { doInteraction, interactionsFor } from '../src/state/npc/interactions';
import type { DateVenue } from '../src/state/datenight/types';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });
const mk = (age = 26) => {
  const g = createLife({ name: 'D', familyName: 'N', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: age >= 18 ? 23 : 14 });
  g.s.bornAt -= (age - (age >= 18 ? 23 : 14)) * 12;
  g.s.sexuality = 'pan';
  g.s.money = 5000;
  g.setFlag('hadFirstTime');
  g.s.phase = 2;
  return g;
};
const partnerOf = (g: Game, role: Person['role'] = 'partner', age = 27) => {
  const p = g.addPerson(role, { age });
  p.sexuality = 'pan';
  p.romance = 70;
  p.rel = 70;
  return p;
};

// ---------- romantic dates only
{
  const g = mk();
  const love = partnerOf(g);
  const friend = partnerOf(g, 'friend');
  const mom = g.s.people.find((x) => x.role === 'mother')!;
  check('partners can be taken on a date', isRomanticDate(g, love) && interactionsFor(g, love).some((r) => r.def.id === 'date'));
  check('friends and family can’t (romantic dates only)', !isRomanticDate(g, friend) && !isRomanticDate(g, mom) && !interactionsFor(g, friend).some((r) => r.def.id === 'date'));
  const t0 = g.s.turn;
  doInteraction(g, love.id, 'date', 'restaurant');
  check('going on a date opens the date scene and uses the slot', !!g.s.date && g.s.date.venue === 'restaurant' && g.s.turn === t0 + 1 && !g.canAct());
}

// ---------- actions differ by venue
{
  const sets = VENUE_ORDER.map((v) => VENUES[v].actions.map((a) => a.id).join());
  check('every venue has its own actions', new Set(sets).size === VENUE_ORDER.length && VENUE_ORDER.every((v) => VENUES[v].actions.length >= 3));
  const g = mk();
  const p = partnerOf(g);
  startDate(g, p, 'movie');
  check('a movie date has movie things to do (popcorn), not restaurant ones', actionsFor(g).some((a) => a.id === 'popcorn') && !actionsFor(g).some((a) => a.id === 'footsie'));
  endDate(g);
}

// ---------- spark rises with actions; moments unlock in order
{
  const g = mk();
  const p = partnerOf(g);
  startDate(g, p, 'restaurant');
  g.s.date!.spark = 0;
  check('at the start, only small talk — no kisses', momentLock(g, 'kiss') !== null && momentLock(g, 'hands') !== null);
  let guard = 0;
  while (g.s.date!.spark < 25 && guard++ < 50) { g.s.date!.time = 8; dateAct(g, 'talk'); }
  check('actions raise the spark (hold hands unlocks at 25)', momentLock(g, 'hands') === null);
  g.s.date!.spark = 45;
  check('kiss at 45', momentLock(g, 'kiss') === null && momentLock(g, 'french') !== null);
  g.s.date!.spark = 60;
  check('French kiss at 60', momentLock(g, 'french') === null);
  const kissed = doMoment(g, 'french');
  check('kissing works and keeps the date going', !!kissed && !!g.s.date);
  g.s.date!.spark = 80;
  p.romance = 70;
  check('the restroom needs 80 spark, love, and a venue with one', momentLock(g, 'restroom') === null);
  p.romance = 40;
  check('…not without love', momentLock(g, 'restroom') === 'Needs more love');
  p.romance = 70;
  const before = INTIMACY_AUDIT.length;
  doMoment(g, 'restroom');
  check('the restroom ends the date and goes to the protection choice', !g.s.date && g.currentEvent?.id === 'protection_choice' && g.currentEvent.ctx.place === 'restroom');
  const ch = g.choicesFor(g.currentEvent!);
  check('condom or not', ch.some((c) => c.choice.label.includes('condom') && !c.disabled) && ch.some((c) => c.choice.label.includes('No protection')));
  resolveAll(g);
  check('…and it happens (fade to black)', INTIMACY_AUDIT.length > before);
  const park = mk();
  const q = partnerOf(park);
  startDate(park, q, 'park');
  park.s.date!.spark = 90;
  check('no restroom on a park walk', momentLock(park, 'restroom') === 'No restroom here');
  check('back to your place at 70', momentLock(park, 'yours') === null);
  doMoment(park, 'yours');
  check('your place → the night together (condom or not)', !park.s.date && ['protection_choice', 'sexile', 'first_time'].includes(park.currentEvent?.id ?? ''));
}

// ---------- they suggest it sometimes; saying no is fine
{
  let offers = 0;
  for (let i = 0; i < 300 && offers === 0; i++) {
    const g = mk();
    const p = partnerOf(g);
    startDate(g, p, 'gala');
    g.s.date!.spark = 75;
    dateAct(g, 'champagne');
    if (g.s.date?.offer) {
      offers++;
      const r = answerOffer(g, false);
      check('saying “not tonight” keeps the date going, no penalty', !!g.s.date && !!r && p.romance >= 70);
    }
  }
  check('partners sometimes suggest going back to yours', offers > 0);
}

// ---------- a date at your place: invite them over / "Come over?" → home activities → calm night or the bedroom
{
  const g = mk();
  g.s.housing = 'apartment';
  const p = partnerOf(g);
  const t0 = g.s.turn;
  doInteraction(g, p.id, 'invite_over');
  check('“Invite them over” starts a date at your place (uses the slot)', g.s.date?.venue === 'home' && g.s.turn === t0 + 1);
  check('home has logical home things to do', ['tour', 'cook', 'takeout', 'couch', 'cuddle', 'boardgame', 'kitchen'].every((id) => actionsFor(g).some((a) => a.id === id)));
  const r0 = p.romance;
  const text = calmNight(g);
  check('a calm night in ends the date cozily (romance up, no intimacy)', !g.s.date && text.includes('calm night') && p.romance > r0 && !g.queued('protection_choice') && !g.queued('sexile') && !g.queued('first_time'));
  const h = mk();
  h.s.housing = 'house';
  const q = partnerOf(h);
  startDate(h, q, 'home');
  h.s.date!.spark = 75;
  doMoment(h, 'yours');
  check('…or to the bedroom → condom or not', ['protection_choice', 'sexile'].includes(h.currentEvent?.id ?? ''));
  const r1 = q.romance;
  const before = INTIMACY_AUDIT.length;
  while (h.currentEvent) {
    const ch = h.choicesFor(h.currentEvent);
    const pickI = ch.findIndex((c) => !c.disabled && /condom|protection/i.test(c.choice.label));
    h.resolveChoice(pickI >= 0 ? pickI : Math.max(0, ch.findIndex((c) => !c.disabled)));
  }
  check('intimacy raises romance a lot (+15)', INTIMACY_AUDIT.length === before || q.romance - r1 >= 15, `${r1} → ${q.romance}`);
  // "Come over?" over text to a partner = a plan for a date at your place
  const c = mk();
  c.give('phone');
  c.s.housing = 'apartment';
  const z = partnerOf(c);
  z.hasNumber = true;
  z.theyHaveNumber = true;
  let made = false;
  for (let i = 0; i < 30 && !made; i++) {
    c.s.clock++;
    sendChip(c, z.id, 'comeover');
    made = c.s.plans.some((x) => x.kind === 'over');
  }
  check('texting a partner “Come over?” makes a date-at-your-place plan', made);
  const homeless = mk();
  homeless.s.housing = 'homeless';
  check('no home, no inviting anyone over', interactionsFor(homeless, partnerOf(homeless)).find((r) => r.def.id === 'invite_over')?.ok === false);
}

// ---------- a better home makes a date there go better (same person, same date — only the home changes)
{
  const g = mk();
  const a = partnerOf(g);
  a.romance = 30;
  a.mood = 50;
  startDate(g, a, 'home');
  const act = actionsFor(g).find((x) => x.id === 'cuddle')!;
  g.s.housing = 'shared';
  const lo = oddsOf(g, act);
  g.s.housing = 'mansion';
  const hi = oddsOf(g, act);
  check('shared flat < mansion odds (by 20 points)', Math.round((hi - lo) * 100) === 20, `${Math.round(lo * 100)}% vs ${Math.round(hi * 100)}%`);
  check('home bonus ladder: shared < apartment < house < mansion', HOME_BONUS.shared < HOME_BONUS.apartment && HOME_BONUS.apartment < HOME_BONUS.house && HOME_BONUS.house < HOME_BONUS.mansion);
  endDate(g);
}

// ---------- hard rules
{
  // teens: hold hands only
  const teen = mk(16);
  const bf = partnerOf(teen, 'dating', 16);
  startDate(teen, bf, 'park');
  teen.s.date!.spark = 100;
  check('teen couples can hold hands', momentLock(teen, 'hands') === null);
  check('teens: no kissing or intimacy moments at all', (['kiss', 'french', 'yours', 'restroom'] as const).every((m) => momentLock(teen, m) === 'Adults only'));
  endDate(teen);
  startDate(teen, bf, 'restaurant');
  const wine = actionsFor(teen).find((a) => a.id === 'wine')!;
  check('teens can’t order the wine', !!actionLock(teen, wine)?.startsWith('Must be'));
  endDate(teen);
  // Mature Content off
  applySettings({ mature: false });
  const g = mk();
  const p = partnerOf(g);
  startDate(g, p, 'restaurant');
  g.s.date!.spark = 100;
  check('Mature Content off: holding hands only', momentLock(g, 'hands') === null && momentLock(g, 'kiss') !== null && momentLock(g, 'yours') !== null);
  applySettings({ mature: true });
  // too drunk
  g.s.date!.intox = INTOX_LIMIT + 5;
  check('too drunk: no intimacy', momentLock(g, 'yours') === 'Too drunk' && momentLock(g, 'restroom') === 'Too drunk');
  check('…and they won’t suggest it either', (() => { g.s.date!.offer = false; for (let i = 0; i < 40; i++) { g.s.date!.time = 8; dateAct(g, 'talk'); } return !g.s.date!.offer; })());
}

// ---------- 400 simulated dates
{
  let crashes = 0;
  const venues = VENUE_ORDER.filter((v) => v !== 'beach');
  for (let i = 0; i < 400; i++) {
    try {
      const g = mk(i % 10 === 0 ? 16 : 19 + (i % 20));
      const p = partnerOf(g, i % 3 ? 'partner' : 'dating', g.age < 18 ? g.age : 20 + (i % 20));
      startDate(g, p, venues[i % venues.length] as DateVenue);
      let k = 0;
      while (g.s.date && k++ < 40) playDateStep(g);
      resolveAll(g);
    } catch (e) {
      crashes++;
      if (crashes < 2) console.log(e);
    }
  }
  check('400 dates ran without crashing', crashes === 0, `${crashes}`);
  check('moments past hand-holding happened', DATE_AUDIT.length > 0, `${DATE_AUDIT.length}`);
  check('no kiss or intimacy on a date ever involved anyone under 18', DATE_AUDIT.every((a) => a.playerAge >= 18 && a.npcAge >= 18));
  check('no intimacy on a date while too drunk', DATE_AUDIT.every((a) => a.intox < INTOX_LIMIT));
  check('no intimacy ever involved anyone under 18', INTIMACY_AUDIT.every((a) => a.playerAge >= 18 && a.partnerAge >= 18));
}

done();
