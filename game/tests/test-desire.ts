// Update 0.11 — gym & movie dates, friend dates (harder), their place, partner texts, and partner-led intimacy (where/how).
import { check, done, resolveAll } from './harness';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import type { Person } from '../src/state/types';
import { DATE_AUDIT, actionsFor, answerOffer, doMoment, endDate, friendKissOdds, isFriendDate, isRomanticDate, momentAt, momentLock, oddsOf, startDate } from '../src/state/datenight/date';
import { VENUES } from '../src/state/datenight/venues';
import { MOMENT_AT } from '../src/state/datenight/types';
import { LOVE_ASK, canAskSpouse } from '../src/state/datenight/desire';
import { INTIMACY_AUDIT } from '../src/state/systems/intimacy';
import { doInteraction, interactionsFor } from '../src/state/npc/interactions';
import { sendText } from '../src/state/phone/texts';
import { answer, pendingMessage } from '../src/state/phone/convo';
import { EVENT_BY_ID } from '../src/state/events';
import { retireStaff } from '../src/state/npc/school';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });
const mk = () => {
  const g = createLife({ name: 'D', familyName: 'N', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23 });
  g.s.bornAt -= 3 * 12;
  g.s.sexuality = 'pan';
  g.s.money = 5000;
  g.setFlag('hadFirstTime');
  g.s.housing = 'apartment';
  g.s.phase = 2;
  return g;
};
const person = (g: Game, role: Person['role'] = 'partner', romance = 70) => {
  const p = g.addPerson(role, { age: 27 });
  p.sexuality = 'pan';
  p.romance = romance;
  p.rel = 70;
  return p;
};
const pickChoice = (g: Game, re: RegExp) => {
  const ch = g.choicesFor(g.currentEvent!);
  const i = ch.findIndex((c) => !c.disabled && re.test(c.choice.label));
  return i >= 0 ? g.resolveChoice(i) : null;
};

// ---------- gym date: lift together, spot them; locker room or your place
{
  const g = mk();
  const p = person(g);
  startDate(g, p, 'gym');
  check('the gym has lifting together and spotting', ['lift', 'spot'].every((id) => actionsFor(g).some((a) => a.id === id)));
  g.s.date!.spark = 85;
  check('…the locker room (restroom) and your place are both possible', momentLock(g, 'restroom') === null && momentLock(g, 'yours') === null && VENUES.gym.restroomLabel?.includes('locker') === true);
  doMoment(g, 'restroom');
  check('the locker room → protection choice (condom or not)', g.currentEvent?.id === 'protection_choice' && g.currentEvent.ctx.place === 'locker');
  resolveAll(g);
  const m = mk();
  m.setFlag('gympass');
  const q = person(m);
  const cash = m.s.money;
  startDate(m, q, 'gym');
  check('members get in free', m.s.money === cash);
}

// ---------- movies: flirting; no restroom, intimacy right there in the back row
{
  const g = mk();
  const p = person(g);
  startDate(g, p, 'movie');
  check('movies have flirting actions', ['flirtdark', 'brush', 'backrow'].every((id) => actionsFor(g).some((a) => a.id === id)));
  g.s.date!.spark = 85;
  check('no restroom at the movies', momentLock(g, 'restroom') === 'No restroom here');
  check('…but the back row (on the spot) at 80 spark', MOMENT_AT.spot === 80 && momentLock(g, 'spot') === null);
  p.romance = 40;
  check('…only if it’s love', momentLock(g, 'spot') === 'Needs more love');
  p.romance = 70;
  const before = INTIMACY_AUDIT.length;
  doMoment(g, 'spot');
  check('the back row → protection choice in the theater', !g.s.date && g.currentEvent?.ctx.place === 'theater');
  resolveAll(g);
  check('…fade to black', INTIMACY_AUDIT.length >= before);
  const r = mk();
  startDate(r, person(r), 'restaurant');
  r.s.date!.spark = 90;
  check('the back row is only at the movies', momentLock(r, 'spot') === 'Not at this venue');
}

// ---------- friends: the same date, but harder
{
  const g = mk();
  const f = person(g, 'friend', 20);
  f.attraction = 50;
  check('friends get “make a move” dates, not romantic ones', isFriendDate(g, f) && !isRomanticDate(g, f) && interactionsFor(g, f).some((r) => r.def.id === 'frienddate') && !interactionsFor(g, f).some((r) => r.def.id === 'date'));
  const t0 = g.s.turn;
  doInteraction(g, f.id, 'frienddate', 'movie');
  check('it opens the date scene (uses the slot)', g.s.date?.friend === true && g.s.turn === t0 + 1);
  check('every moment needs 10 more spark', momentAt(g, 'kiss') === MOMENT_AT.kiss + 10 && momentAt(g, 'hands') === MOMENT_AT.hands + 10);
  const act = actionsFor(g).find((a) => a.id === 'popcorn')!;
  const fo = oddsOf(g, act);
  const h = mk();
  const pp = person(h, 'partner', 20);
  startDate(h, pp, 'movie');
  check('…and worse odds than a partner with the same feelings', fo < oddsOf(h, act), `${fo} vs ${oddsOf(h, act)}`);
  let refused = 0;
  let accepted = 0;
  for (let i = 0; i < 200 && (!refused || !accepted); i++) {
    const k = mk();
    const ff = person(k, 'friend', 20);
    startDate(k, ff, 'park');
    k.s.date!.spark = 60;
    doMoment(k, 'kiss');
    if (ff.role === 'talking') accepted++;
    else if (k.s.date?.quote?.includes('just friends')) refused++;
  }
  check('a friend can turn down the first kiss', refused > 0);
  check('…or kiss back — and now you’re talking', accepted > 0);
  check('friend kiss odds stay between 15% and 85%', friendKissOdds({ attraction: 0, romance: 0 } as Person) === 0.3 && friendKissOdds({ attraction: 100, romance: 100 } as Person) === 0.85);
  endDate(g);
}

// ---------- partners text: movie, come over, their place → plans → date scenes
{
  const g = mk();
  g.give('phone');
  const p = person(g);
  p.hasNumber = true;
  p.theyHaveNumber = true;
  for (const plan of ['movie', 'over', 'theirs'] as const) {
    g.s.plans = [];
    sendText(g, p, 'date_ask', `${p.name}: "tonight?"`, { ctx: { plan } });
    const m = pendingMessage(g, p.id)!;
    answer(g, p.id, m.id, 'date_yes');
    check(`a partner’s “${plan}” text becomes a ${plan} plan`, g.s.plans.some((x) => x.kind === plan));
  }
  startDate(g, p, 'theirs');
  check('their place is a date scene with home things to do', g.s.date?.venue === 'theirs' && actionsFor(g).some((a) => a.id === 'snoop') && actionsFor(g).some((a) => a.id === 'cuddle'));
  g.s.date!.spark = 80;
  p.romance = 60;
  doMoment(g, 'yours');
  check('staying the night at theirs wakes you up in their bed', g.currentEvent?.id === 'protection_choice' && !!g.currentEvent.ctx.theirs);
  resolveAll(g);
}

// ---------- they love you this much: THEY ask where and how
{
  const seen = { quick: 0, rounds: 0, raw: 0 };
  for (let i = 0; i < 200 && (!seen.quick || !seen.rounds || !seen.raw); i++) {
    const g = mk();
    const p = person(g, 'partner', 90);
    startDate(g, p, 'home');
    g.s.date!.spark = 80;
    answerOffer(g, true);
    if (i === 0) check('when they love you (80+), saying yes → they ask where', LOVE_ASK === 80 && g.currentEvent?.id === 'intimacy_where' && g.currentEvent.ctx.from === 'them');
    if (i === 0) check('…couch, bed or the kitchen counter', ['couch', 'bed', 'kitchen counter'].every((w) => g.choicesFor(g.currentEvent!).some((c) => c.choice.label.toLowerCase().includes(w))));
    pickChoice(g, /counter/i);
    if (g.currentEvent?.id !== 'intimacy_how') continue;
    const style = g.currentEvent.ctx.style as 'quick' | 'rounds' | 'raw';
    seen[style]++;
    if (style === 'raw' && seen.raw === 1) {
      check('“they want it raw”: you can agree, insist on a condom, or say not tonight', g.choicesFor(g.currentEvent).filter((c) => !c.disabled).length === 3);
      const r0 = p.romance;
      pickChoice(g, /Insist/);
      check('insisting on a condom is accepted, no penalty', (g.currentEvent?.id as string) === 'protection_choice' && p.romance >= r0 && g.choicesFor(g.currentEvent).some((c) => /condom/.test(c.choice.label) && !c.disabled));
    }
    if (style === 'rounds' && seen.rounds === 1) {
      pickChoice(g, /Yes/);
      const e0 = g.s.stats.energy;
      pickChoice(g, /condom/);
      check('five rounds costs energy', g.s.stats.energy < e0);
    }
    resolveAll(g);
  }
  check('they ask for a quick one, five rounds, or no condom', seen.quick > 0 && seen.rounds > 0 && seen.raw > 0, JSON.stringify(seen));
  const cool = mk();
  const q = person(cool, 'partner', 60);
  startDate(cool, q, 'home');
  cool.s.date!.spark = 80;
  answerOffer(cool, true);
  check('below that, the usual bedroom choice (no where/how)', cool.currentEvent?.id !== 'intimacy_where');
}

// ---------- the player asks only with their spouse
{
  const g = mk();
  const wife = person(g, 'spouse', 50);
  const gf = person(g, 'partner', 95);
  check('spouses can be asked', canAskSpouse(g, wife) && interactionsFor(g, wife).some((r) => r.def.id === 'askintimacy'));
  check('partners can’t (they ask you)', !canAskSpouse(g, gf) && !interactionsFor(g, gf).some((r) => r.def.id === 'askintimacy'));
  doInteraction(g, wife.id, 'askintimacy');
  check('asking your spouse → you pick where', g.currentEvent?.id === 'intimacy_where' && g.currentEvent.ctx.from === 'you');
  pickChoice(g, /bed/);
  check('…and how (quick or all night)', g.currentEvent?.id === 'intimacy_how' && g.choicesFor(g.currentEvent).some((c) => /quick/i.test(c.choice.label)) && g.choicesFor(g.currentEvent).some((c) => /All night/.test(c.choice.label)));
  resolveAll(g);
  applySettings({ mature: false });
  check('Mature Content off: nobody asks', !canAskSpouse(g, wife));
  applySettings({ mature: true });
}

// ---------- hard rules held
check('no date intimacy with anyone under 18', DATE_AUDIT.every((a) => a.playerAge >= 18 && a.npcAge >= 18));
check('no intimacy with anyone under 18', INTIMACY_AUDIT.every((a) => a.playerAge >= 18 && a.partnerAge >= 18));

// ---------- school stays in school (your correction): no school events or school rivals after you leave
{
  const g = mk();
  g.s.education.current = null;
  g.s.job = null;
  const when = (id: string) => EVENT_BY_ID[id].random!.when(g);
  check('out of school: no admirer notes in your locker, no mentor after class, no school events', !when('admirer_notes') && !when('bully') && !when('pop_quiz') && !when('substitute') && !when('field_trip') && !when('group_project') && !when('teacher_accuses'));
  check('…no rival without school or a job', !when('rival_emerges'));
  const old = g.addPerson('acquaintance', { age: g.age, met: 'x', where: 'School' });
  old.rivalry = 70;
  old.labels.push('rival');
  retireStaff(g);
  check('a school rival lets it go once you’ve left school', !old.labels.includes('rival') && old.rivalry <= 20);
  g.s.job = { careerId: 'retail' } as never;
  const txt = EVENT_BY_ID.rival_emerges.text(g, {});
  check('a new rival after school is at work, not in class', txt.includes('work') && !txt.includes('class'));
}

done();
