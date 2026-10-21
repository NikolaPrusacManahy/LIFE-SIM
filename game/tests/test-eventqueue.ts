// Update 0.12 regression — an encounter rolled in the same slot as a planned date is never lost, and the stage only
// shows an event's person while that card is open (it used to show your date behind the result card).
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import { createPlan } from '../src/state/phone/plans';
import { stageViewFor } from '../src/fx/view';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });
let kept = 0;
let runs = 0;
let order = true;
for (let i = 0; i < 200; i++) {
  const g = createLife({ name: 'Q', familyName: 'E', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23 });
  g.s.phase = 1;
  const p = g.addPerson('partner', { age: 23, gender: 'female', met: 'x', where: 'x' });
  createPlan(g, p, 'date', 'invite', g.s.turn + 1);
  const r0 = Math.random;
  let k = 0;
  Math.random = () => (k++ < 2 ? 0.01 : r0());
  g.doActivity('read_novel');
  Math.random = r0;
  if (!g.queued('encounter')) continue;
  runs++;
  if (g.s.events[0].id !== 'plan_scene') order = false;
  const view = stageViewFor(g, 'library', false);
  if (view.npc) order = false;
  const idx = g.choicesFor(g.s.events[0]).findIndex((c) => c.choice.label === 'Stand them up');
  g.resolveChoice(idx);
  if (g.s.events[0]?.id === 'encounter') kept++;
}
check('the planned date comes first; the encounter waits behind it', runs > 50 && order, `${runs} runs`);
check('standing the date up still shows the encounter next', kept === runs, `${kept}/${runs}`);
check('behind a result card the stage shows nobody', order);
done();
