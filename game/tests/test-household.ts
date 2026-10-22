// Update 0.13 — who you see on the stage: the people you live with at home, classmates at school, coworkers at work.
import { check, done } from './harness';
import { createLife, randomLook } from '../src/state/newGame';
import { householdOf, peopleAt, petsAtHome } from '../src/state/systems/household';
import { stageViewFor } from '../src/fx/view';

const mk = (age: 14 | 23) => createLife({ name: 'H', familyName: 'V', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: age });

{
  const g = mk(14);
  const family = g.s.people.filter((p) => ['mother', 'father', 'sibling'].includes(p.role) && p.alive);
  const hh = householdOf(g);
  check('living with your parents: your parents and siblings are home', g.livesWithParents && hh.length === family.length && hh.length > 0);
  const view = stageViewFor(g, 'home');
  check('the home scene shows them', (view.household ?? []).length === hh.length);
  check('…and nobody from home shows up downtown', (stageViewFor(g, 'downtown').household ?? []).length === 0);
}

{
  const g = mk(23);
  g.s.housing = 'apartment' as typeof g.s.housing;
  const wife = g.addPerson('spouse', { age: 24, gender: 'female', met: 'x', where: 'x' });
  const kid = g.addPerson('child', { age: 5, gender: 'male', met: 'x', where: 'x' });
  const grown = g.addPerson('child', { age: 20, gender: 'male', met: 'x', where: 'x' });
  const ex = g.addPerson('ex', { age: 24, gender: 'female', met: 'x', where: 'x' });
  const hh = householdOf(g);
  check('your spouse and young kids live with you', hh.some((s) => s.pid === wife.id && s.kind === 'adult') && hh.some((s) => s.pid === kid.id && s.kind === 'kid'));
  check('grown-up kids and exes do not', !hh.some((s) => s.pid === grown.id || s.pid === ex.id));
  g.give('dog');
  check('your dog is home too', petsAtHome(g) === 1 && (stageViewFor(g, 'home').household ?? []).some((m) => m.kind === 'pet'));
  wife.alive = false;
  wife.status = 'dead';
  check('the dead are never shown', !householdOf(g).some((s) => s.pid === wife.id));
  g.s.housing = 'homeless' as typeof g.s.housing;
  check('homeless: nobody at home', householdOf(g).length === 0);
}

{
  const g = mk(14);
  const mate = g.addPerson('friend', { age: 14, gender: 'male', met: 'x', where: 'School' });
  mate.labels.push('classmate');
  check('classmates are around at school (and you can click them)', peopleAt(g, 'school').some((s) => s.pid === mate.id) && !!stageViewFor(g, 'school').people?.[0]?.pid);
  check('…but not at the park', peopleAt(g, 'park').length === 0);
  for (let i = 0; i < 8; i++) g.addPerson('friend', { age: 14, gender: 'male', met: 'x', where: 'School' }).labels.push('classmate');
  check('at most 4 people you know at a place', peopleAt(g, 'school').length === 4);
}

done();
