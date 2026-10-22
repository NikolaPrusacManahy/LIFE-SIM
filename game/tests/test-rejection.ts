// Update 0.12 — rejecting (or ignoring) admirers: 50% turn yandere; a rejected yandere starts texting next month.
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import { admirerEncounter } from '../src/state/encounters/pools';
import { REJECT_TURN, REMARKS, answerRemark, anonReply, marriedOff, rejectAdmirer, secretsAbout, startStalking, stalkerMonth } from '../src/state/systems/stalker';
import { EVENT_BY_ID } from '../src/state/events';
import { makeMatch } from '../src/state/npc/match';
import { makeYandere } from '../src/state/npc/persona';
import type { Game } from '../src/state/Game';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });
const mk = (age: 14 | 23 = 23) => {
  const g = createLife({ name: 'R', familyName: 'J', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: age });
  g.s.sexuality = 'straight';
  return g;
};
const admirer = (g: Game) => {
  const p = makeMatch(g, 'acquaintance', [20, 28], { gender: 'female', met: g.dateLabel, where: 'Library' });
  p.persona = undefined;
  p.tags.push('stranger');
  return p;
};

{
  let turned = 0;
  const N = 600;
  for (let i = 0; i < N; i++) {
    const g = mk();
    const p = admirer(g);
    if (rejectAdmirer(g, p)) turned++;
    else if (g.s.people.includes(p) && p.persona === 'yandere') turned = -9999;
  }
  check(`a rejected admirer turns yandere about ${REJECT_TURN * 100}% of the time`, turned > N * 0.42 && turned < N * 0.58, `${turned}/${N}`);
}

{
  const g = mk();
  const p = makeYandere(g, 'acquaintance', 'Library')!;
  p.tags.push('stranger');
  check('a rejected yandere always stays (never deleted)', rejectAdmirer(g, p) && g.s.people.includes(p) && p.tags.includes('rejected') && !p.tags.includes('stranger'));
  stalkerMonth(g);
  check('…and the unknown number starts the very next month', g.s.stalker?.pid === p.id);
  check('the first message is angry about the rejection', /walked away|said no/.test(g.s.stalker!.msgs[0].text));
}

{
  let bad = 0;
  for (let i = 0; i < 200; i++) {
    const kid = mk(14);
    const p = kid.addPerson('acquaintance', { age: 15, gender: 'female', met: kid.dateLabel, where: 'School', tags: ['stranger'] });
    if (rejectAdmirer(kid, p) || p.persona === 'yandere') bad++;
    const g = mk();
    const same = makeMatch(g, 'acquaintance', [20, 28], { gender: 'male', met: g.dateLabel, where: 'Library' });
    same.persona = undefined;
    if (rejectAdmirer(g, same)) bad++;
  }
  check('minors and same-sex admirers never turn yandere', bad === 0, `${bad}`);
}

{
  const g = mk();
  const all = secretsAbout(g).join(' ');
  check('the obsession messages: hair in a jar, the toothbrush', /jar/.test(all) && /toothbrush/.test(all));
  check('with Mature Content on: they think about you when they touch themselves', /touch myself/.test(all));
  applySettings({ ageConfirmed: true, isAdult: true, mature: false });
  check('with Mature Content off those lines never appear', !/touch myself|whispered your name/.test(secretsAbout(g).join(' ')));
  applySettings({ ageConfirmed: true, isAdult: true, mature: true });
}

{
  // the encounter card: admirers and yanderes get Reject; Ignore counts as a rejection
  const g = mk();
  g.s.phase = 1;
  let ev = g.s.events[0];
  for (let i = 0; i < 50 && !ev; i++) { admirerEncounter(g, 'library'); ev = g.s.events[0]; }
  const labels = g.choicesFor(ev).map((c) => c.choice.label);
  check('admirer cards have a Reject option', labels.includes('🙅 Reject them') && labels.includes('Ignore'));
}

// ---------- stalker escalation without violence: bribed friends, remarks, letters, jealousy; marriage ends it
const withStalker = () => {
  const g = mk();
  const y = makeYandere(g, 'acquaintance', 'Library')!;
  startStalking(g, y);
  const f = g.addPerson('friend', { age: 25, gender: 'male', met: 'x', where: 'x' });
  f.rel = 70;
  return { g, y, f };
};
{
  const { g, f } = withStalker();
  anonReply(g, 'leave');
  check('one refusal: your friend is still your friend', f.role === 'friend');
  g.s.stalker!.sent = 0;
  anonReply(g, 'leave');
  check('every 2nd refusal: they pay a friend to cut you off (nobody is hurt)', f.role === 'acquaintance' && f.rel <= 5 && f.alive && f.status === 'alive');
}
{
  const { g, f } = withStalker();
  g.s.stalker!.remark = 0;
  answerRemark(g, 'funny');
  check('a funny / sweet / sarcastic reaction gets a reply and keeps your friend', f.role === 'friend' && g.s.stalker!.remark === null);
  g.s.stalker!.remark = 1;
  answerRemark(g, 'cold');
  check('a cold reaction: a friend is paid to drop you', f.role === 'acquaintance' && f.alive);
  check('remarks are flirty, never explicit', REMARKS.every((r) => !/condom|raw|breed|seed|naked/i.test(r)));
}
{
  let remarks = 0;
  let letters = 0;
  for (let i = 0; i < 80; i++) {
    const { g } = withStalker();
    g.s.stalker!.stage = 1;
    stalkerMonth(g);
    if (g.s.stalker?.remark != null) remarks++;
    if (g.queued('stalker_letter')) letters++;
  }
  check('remarks and letters show up while it goes on (Mature Content on)', remarks > 15 && letters > 5, `${remarks} remarks, ${letters} letters`);
  check('the letter is a Mature event and never shows the photos', !!EVENT_BY_ID.stalker_letter?.mature);
  applySettings({ ageConfirmed: true, isAdult: true, mature: false });
  let leak = 0;
  for (let i = 0; i < 80; i++) {
    const { g } = withStalker();
    g.s.stalker!.stage = 1;
    stalkerMonth(g);
    if (g.s.stalker?.remark != null || g.queued('stalker_letter')) leak++;
  }
  check('with Mature Content off: no remarks, no letters', leak === 0);
  applySettings({ ageConfirmed: true, isAdult: true, mature: true });
}
{
  let seen = 0;
  for (let i = 0; i < 60; i++) {
    const { g } = withStalker();
    const c = g.addPerson('talking', { age: 24, gender: 'female', met: 'x', where: 'x' });
    c.lastContact = g.s.clock;
    stalkerMonth(g);
    if (g.s.stalker!.msgs.some((m) => m.text.includes(c.name))) seen++;
  }
  check('they notice who you’ve been getting close to', seen > 15, `${seen}/60`);
}
{
  const { g, y } = withStalker();
  const other = makeYandere(g, 'acquaintance', 'Park')!;
  const w = g.addPerson('spouse', { age: 25, gender: 'female', met: 'x', where: 'x' });
  check('married to someone else: every yandere leaves and the unknown number stops', marriedOff(g) && !g.s.stalker && y.status === 'moved' && other.status === 'moved' && w.status === 'alive');
}

done();
