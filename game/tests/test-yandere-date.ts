// Update 0.12 — dating a yandere: possessive lines, spark ×2, a jealous text if you leave early, morning selfies.
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import { actionLock, actionsFor, dateAct, finishDate, startDate } from '../src/state/datenight/date';
import { YANDERE_DATE_LINES, YANDERE_MORNING } from '../src/state/datenight/yandere';
import { makeYandere } from '../src/state/npc/persona';
import { textsTick } from '../src/state/phone/texts';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });
const mk = () => {
  const g = createLife({ name: 'Y', familyName: 'D', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23 });
  g.s.sexuality = 'straight';
  g.s.money = 100000;
  g.give('phone');
  return g;
};
const gainOf = (yandere: boolean) => {
  let total = 0;
  for (let i = 0; i < 150; i++) {
    const g = mk();
    const p = yandere ? makeYandere(g, 'dating', 'x')! : g.addPerson('dating', { age: 24, gender: 'female', met: 'x', where: 'x' });
    p.role = 'dating';
    p.romance = 60;
    p.hasNumber = p.theyHaveNumber = true;
    startDate(g, p, 'restaurant');
    if (!g.s.date) continue;
    g.s.date.spark = 0;
    const a = actionsFor(g).find((x) => !actionLock(g, x) && x.gain > 0);
    if (a) dateAct(g, a.id);
    total += g.s.date?.spark ?? 0;
  }
  return total;
};
check('a yandere date fills the spark about twice as fast', gainOf(true) > gainOf(false) * 1.6);

{
  const g = mk();
  const p = makeYandere(g, 'dating', 'x')!;
  p.hasNumber = p.theyHaveNumber = true;
  startDate(g, p, 'restaurant');
  const a = actionsFor(g).find((x) => !actionLock(g, x))!;
  dateAct(g, a.id);
  check('they say possessive things on the date', YANDERE_DATE_LINES.includes(g.s.date!.quote ?? ''));
  finishDate(g);
  check('leave early: a jealous text', (g.s.chats[p.id] ?? []).some((m) => m.kind === 'p_yandere'));
}

{
  let selfies = 0;
  for (let i = 0; i < 200 && !selfies; i++) {
    const g = mk();
    const p = makeYandere(g, 'partner', 'x')!;
    p.role = 'partner';
    p.hasNumber = p.theyHaveNumber = true;
    p.lastContact = g.s.clock;
    g.s.phase = 0;
    for (let t = 0; t < 30; t++) textsTick(g);
    const chat = g.s.chats[p.id] ?? [];
    if (chat.some((m) => m.photo?.includes('morning outfit')) && chat.some((m) => m.text.includes(YANDERE_MORNING))) selfies++;
  }
  check('a yandere partner sends morning outfit selfies', selfies > 0);
}

done();
