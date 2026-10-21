import { simulateLife } from './sim';
import { check, done } from './harness';
import type { Background, Region } from '../src/state/types';

const combos: [Background, Region][] = [['poor', 'city'], ['middle', 'country'], ['rich', 'city'], ['middle', 'city'], ['poor', 'country']];
let errors = 0;
const ages: number[] = [];
for (let run = 0; run < 6; run++) {
  const [bg, home] = combos[run % combos.length];
  try {
    const g = simulateLife(bg, home);
    ages.push(g.age);
    const st = g.s.stats;
    const bad = Object.entries(st).filter(([, v]) => !Number.isFinite(v) || v < 0 || v > 100);
    if (bad.length) { errors++; console.log('bad stats', bad); }
    if (!Number.isFinite(g.s.money) || !Number.isFinite(g.s.debt)) { errors++; console.log('bad money', g.s.money, g.s.debt); }
    if (g.s.money < 0) { errors++; console.log('negative money', g.s.money); }
  } catch (e) {
    errors++;
    console.log(`run ${run} crashed:`, e);
  }
}
check('6 simulated lives run without crashing or invalid state', errors === 0, `${errors} problem(s)`);
check('lives reach adulthood', ages.filter((a) => a >= 18).length >= 5, `ages: ${ages.join(', ')}`);
console.log(`   ages at end: ${ages.join(', ')}`);
done();
