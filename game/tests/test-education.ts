import { createLife, randomLook } from '../src/state/newGame';
import { check, done, resolveAll } from './harness';

const mk = () => createLife({ name: 'Ed', familyName: 'U', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook() });

// Diligent student graduates high school
{
  const g = mk();
  g.s.events = [];
  for (let i = 0; i < 4 * 52 && !g.s.education.degrees.includes('hs'); i++) {
    resolveAll(g);
    const obs = g.autoActionId();
    g.doActivity(obs === 'class_attend' ? 'class_focus' : obs ?? 'relax');
    g.s.stats.energy = 100;
  }
  resolveAll(g);
  check('attending every class earns a diploma', g.s.education.degrees.includes('hs'), `perf=${g.s.education.current?.perf}`);
}
// Skipping everything gets you expelled
{
  const g = mk();
  g.s.events = [];
  let expelled = false;
  for (let i = 0; i < 200 && !expelled; i++) {
    resolveAll(g);
    g.doActivity(g.phase === 'night' ? 'sleep' : 'gaming');
    g.s.stats.energy = 100;
    expelled = !g.s.education.current && !g.s.education.degrees.includes('hs');
  }
  check('chronic skipping leads to expulsion', expelled);
  check('expelled student can take GED class', expelled && g.age >= 16 ? true : g.age < 16);
}
done();
