// Update 0.12 — hospital encounters: doctors and nurses; a doctor can fall for you at first sight (adults only).
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import { staffEncounter } from '../src/state/encounters/pools';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });
const mk = (adult: boolean) => {
  const g = createLife({ name: 'H', familyName: 'D', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: adult ? 23 : 14 });
  g.s.sexuality = 'straight';
  return g;
};

let doctors = 0;
let nurses = 0;
let love = 0;
let badAge = 0;
let loveOk = true;
for (let i = 0; i < 400; i++) {
  const g = mk(true);
  staffEncounter(g);
  const ev = g.s.events[0];
  const p = g.s.people.find((x) => x.id === ev?.ctx.pid);
  if (!p) continue;
  if (g.ageOf(p) < 25 || g.ageOf(p) > 61) badAge++;
  if (ev.ctx.kind === 'doctor_love') {
    love++;
    if (p.subject !== 'Doctor' || p.attraction < 90 || !p.tags.includes('loveAtFirstSight')) loveOk = false;
  } else if (p.subject === 'Doctor') doctors++;
  else if (p.subject === 'Nurse') nurses++;
}
check('you meet both doctors and nurses at the hospital', doctors > 50 && nurses > 50, `${doctors} doctors, ${nurses} nurses`);
check('staff are 25–60', badAge === 0, `${badAge}`);
check('sometimes a doctor falls for you at first sight', love > 10 && loveOk, `${love}/400`);

{
  let minorLove = 0;
  for (let i = 0; i < 300; i++) {
    const g = mk(false);
    staffEncounter(g);
    if (g.s.events[0]?.ctx.kind === 'doctor_love') minorLove++;
  }
  check('never love at first sight for a minor', minorLove === 0);
}

{
  let g = mk(true);
  for (let i = 0; i < 200 && g.s.events[0]?.ctx.kind !== 'doctor_love'; i++) {
    g = mk(true);
    staffEncounter(g);
  }
  const ev = g.s.events[0];
  const p = g.s.people.find((x) => x.id === ev.ctx.pid)!;
  const i = g.choicesFor(ev).findIndex((c) => c.choice.label.startsWith('☕'));
  check('the doctor asks you out (partner-led)', i >= 0);
  g.resolveChoice(i);
  check('saying yes: you have their number and you’re talking', p.hasNumber && p.role === 'talking');
}

done();
