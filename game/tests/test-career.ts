import { createLife, randomLook } from '../src/state/newGame';
import { careerStatus, startJob, careerMonth } from '../src/state/systems/career';
import { CAREER_BY_ID } from '../src/state/data/careers';
import { check, done } from './harness';

const g = createLife({ name: 'Wo', familyName: 'Rk', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook() });
check('14-year-old cannot be a doctor (hidden)', !careerStatus(g, CAREER_BY_ID.doctor).visible);
check('14-year-old can apply to Burger Barn', careerStatus(g, CAREER_BY_ID.burger).ok);
g.s.bornAt -= 12 * 12;
check('26-year-old without M.D. sees doctor locked', careerStatus(g, CAREER_BY_ID.doctor).reason?.includes('M.D.') === true, careerStatus(g, CAREER_BY_ID.doctor).reason);
startJob(g, 'cashier');
const before = g.s.money;
careerMonth(g);
check('salary is paid monthly', g.s.money - before === CAREER_BY_ID.cashier.levels[0].pay, `${g.s.money - before}`);
g.s.job!.skips = 2;
g.s.job!.worked = 0;
g.s.job!.warnings = 2;
g.s.events = [];
careerMonth(g);
check('third no-show warning queues firing', g.s.events.some((e) => e.id === 'fired'));
g.s.job!.perf = 90;
g.s.job!.monthsAtLevel = 99;
g.s.job!.skips = 0;
g.s.events = [];
let promo = false;
for (let i = 0; i < 20 && !promo; i++) { careerMonth(g); g.s.job!.perf = 90; promo = g.s.events.some((e) => e.id === 'promotion'); }
check('high performance queues a promotion', promo);
done();
