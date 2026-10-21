// Update 0.12 — rejecting (or ignoring) admirers: 50% turn yandere; a rejected yandere starts texting next month.
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import { admirerEncounter } from '../src/state/encounters/pools';
import { REJECT_TURN, rejectAdmirer, secretsAbout, stalkerMonth } from '../src/state/systems/stalker';
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

done();
